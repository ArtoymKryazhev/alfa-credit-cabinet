"""Credit decision rules — separate from risk scoring (contracts §7)."""

from __future__ import annotations

from typing import Any, Literal

from app.services.application import annuity_payment

DecisionOutcome = Literal["offer", "declined", "manual_review"]

_ACTIVE_STATUSES = {"active"}


def _round_down_step(amount: float, step: int) -> int:
    if step <= 0:
        return int(amount)
    return int(amount // step) * step


def max_affordable_amount(
    *,
    free_cash: float,
    term_months: int,
    annual_rate: float,
    target_coverage: float,
    amount_min: int,
    amount_max: int,
    step: int,
) -> int | None:
    """
    Largest product amount whose annuity payment satisfies coverage.

    target_payment = free_cash / target_coverage
    amount from reverse annuity, floored to step.
    """
    if free_cash <= 0 or term_months <= 0 or target_coverage <= 0:
        return None
    target_payment = free_cash / target_coverage
    if target_payment <= 0:
        return None

    monthly_rate = annual_rate / 12
    if monthly_rate == 0:
        raw = target_payment * term_months
    else:
        factor = (1 + monthly_rate) ** term_months
        raw = target_payment * (factor - 1) / (monthly_rate * factor)

    amount = _round_down_step(raw, step)
    if amount < amount_min:
        return None
    return min(amount, amount_max)


def decide(
    *,
    sources: dict[str, Any],
    risk: dict[str, Any],
    amount: int,
    term_months: int,
) -> dict[str, Any]:
    """
    Apply decision rules in contracts §7 order.

    Returns outcome, reason_codes, optional comment / alternative_amount / status.
    """
    registry = sources.get("registry") or {}
    bki = sources.get("bki") or {}
    product_src = sources.get("product") or {}
    product = (product_src.get("data") or {}) if product_src.get("status") == "ok" else {}

    annual_rate = float(product.get("rate_annual") or 0.19)
    amount_min = int(product.get("amount_min") or 300_000)
    amount_max = int(product.get("amount_max") or 10_000_000)
    step = int(product.get("alternative_step") or 50_000)
    target_coverage = float(product.get("target_coverage") or 1.5)

    # 1. Stop conditions
    if registry.get("status") == "ok":
        company_status = str((registry.get("data") or {}).get("status") or "")
        if company_status and company_status not in _ACTIVE_STATUSES:
            return {
                "outcome": "declined",
                "status": "declined",
                "reason_codes": ["company_inactive"],
                "comment": (
                    "Компания не действует (статус в демо-реестре: "
                    f"{company_status}). Автоматический отказ."
                ),
                "alternative_amount": None,
            }

    if bki.get("status") == "ok":
        current_overdue = int(
            (bki.get("data") or {}).get("current_overdue_days") or 0
        )
        if current_overdue > 60:
            return {
                "outcome": "declined",
                "status": "declined",
                "reason_codes": ["overdue_over_60"],
                "comment": (
                    f"Текущая просрочка {current_overdue} дн. превышает 60 дней. "
                    "Автоматический отказ."
                ),
                "alternative_amount": None,
            }

    # 2. Source unavailable / incomplete data
    has_unavailable = any(
        (sources.get(name) or {}).get("status") == "unavailable"
        for name in ("registry", "finance", "bki", "product")
    )
    if has_unavailable:
        return {
            "outcome": "manual_review",
            "status": "manual_review",
            "reason_codes": ["source_unavailable"],
            "comment": "Один из источников данных временно недоступен — нужна проверка менеджера.",
            "alternative_amount": None,
        }

    has_missing = any(
        (sources.get(name) or {}).get("status") == "missing"
        for name in ("registry", "finance", "bki", "product")
    )
    if has_missing or not risk.get("data_complete"):
        return {
            "outcome": "manual_review",
            "status": "manual_review",
            "reason_codes": ["data_incomplete"],
            "comment": "Недостаточно данных для автоматического решения.",
            "alternative_amount": None,
        }

    factors = risk.get("factors") or {}
    new_request = (factors.get("new_request") or {}).get("value")
    new_metrics = (factors.get("new_request") or {}).get("metrics") or {}

    # 3. Coverage bad but alternative possible
    if new_request == "bad":
        free_cash = new_metrics.get("free_cash")
        alternative: int | None = None
        if isinstance(free_cash, (int, float)):
            alternative = max_affordable_amount(
                free_cash=float(free_cash),
                term_months=term_months,
                annual_rate=annual_rate,
                target_coverage=target_coverage,
                amount_min=amount_min,
                amount_max=amount_max,
                step=step,
            )
        if alternative is not None and alternative < amount:
            return {
                "outcome": "manual_review",
                "status": "manual_review",
                "reason_codes": ["coverage_insufficient", "alternative_amount"],
                "comment": (
                    "Запрошенная сумма не покрывается свободным потоком. "
                    f"Расчётная альтернатива: {alternative:,} ₽.".replace(",", " ")
                ),
                "alternative_amount": alternative,
            }
        # No viable alternative — still manual (not auto-decline)
        return {
            "outcome": "manual_review",
            "status": "manual_review",
            "reason_codes": ["coverage_insufficient"],
            "comment": "Покрытие нового платежа недостаточное — нужна проверка менеджера.",
            "alternative_amount": None,
        }

    # 4. Medium / high risk
    level = risk.get("level")
    if level == "high":
        return {
            "outcome": "manual_review",
            "status": "manual_review",
            "reason_codes": ["risk_high"],
            "comment": "Высокий уровень риска — заявка передана менеджеру.",
            "alternative_amount": None,
        }
    if level == "medium":
        return {
            "outcome": "manual_review",
            "status": "manual_review",
            "reason_codes": ["risk_medium"],
            "comment": "Средний уровень риска — заявка передана менеджеру.",
            "alternative_amount": None,
        }

    # 5. Auto offer on requested terms
    _ = annuity_payment  # imported for symmetry / callers may use
    return {
        "outcome": "offer",
        "status": "offer_ready",
        "reason_codes": ["auto_approve"],
        "comment": "Автоматическое предложение на запрошенных условиях.",
        "alternative_amount": None,
    }
