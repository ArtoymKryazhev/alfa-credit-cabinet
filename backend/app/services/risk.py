"""Explainable risk assessment (not a credit decision)."""

from __future__ import annotations

from typing import Any, Literal

from app.services.application import annuity_payment

FactorValue = Literal["good", "medium", "bad", "unknown"]
RiskLevel = Literal["low", "medium", "high"]

FACTOR_KEYS = (
    "payment_discipline",
    "financial_stability",
    "current_load",
    "new_request",
)


def _avg(values: list[float]) -> float | None:
    if not values:
        return None
    return sum(values) / len(values)


def _finance_metrics(finance_data: dict[str, Any] | None) -> dict[str, Any]:
    if not finance_data:
        return {"available": False}
    months = list(finance_data.get("months") or [])
    if not months:
        return {"available": False}

    inflows = [float(m.get("inflow") or 0) for m in months]
    opexes = [float(m.get("opex") or 0) for m in months]
    nets = [inf - op for inf, op in zip(inflows, opexes, strict=True)]

    avg_inflow = _avg(inflows)
    avg_opex = _avg(opexes)
    avg_net = _avg(nets)
    assert avg_inflow is not None and avg_opex is not None and avg_net is not None

    first3 = _avg(inflows[:3]) or 0.0
    last3 = _avg(inflows[-3:]) or 0.0
    revenue_change: float | None = None
    if first3 > 0:
        revenue_change = (last3 - first3) / first3

    margin = avg_net / avg_inflow if avg_inflow > 0 else None

    return {
        "available": True,
        "avg_inflow": avg_inflow,
        "avg_opex": avg_opex,
        "avg_net": avg_net,
        "margin": margin,
        "revenue_change": revenue_change,
    }


def _factor(
    value: FactorValue,
    *,
    explanation: str,
    metrics: dict[str, Any] | None = None,
) -> dict[str, Any]:
    row: dict[str, Any] = {"value": value, "explanation": explanation}
    if metrics:
        row["metrics"] = metrics
    return row


def assess_risk(
    *,
    sources: dict[str, Any],
    amount: int,
    term_months: int,
    annual_rate: float = 0.19,
) -> dict[str, Any]:
    """
    Score four factors from check sources.

    unknown never becomes zero / good. Missing inputs → unknown.
    """
    registry = sources.get("registry") or {}
    finance = sources.get("finance") or {}
    bki = sources.get("bki") or {}

    finance_ok = finance.get("status") == "ok"
    bki_ok = bki.get("status") == "ok"

    fin_metrics = _finance_metrics(finance.get("data") if finance_ok else None)
    bki_data = bki.get("data") if bki_ok else None

    # --- payment_discipline ---
    if not bki_ok:
        payment_discipline = _factor(
            "unknown",
            explanation="Данные БКИ недоступны — дисциплина платежей не оценена",
        )
    else:
        assert bki_data is not None
        max_overdue = int(bki_data.get("max_overdue_days_12m") or 0)
        current = int(bki_data.get("current_overdue_days") or 0)
        worst = max(max_overdue, current)
        if worst == 0:
            payment_discipline = _factor(
                "good",
                explanation="Просрочек по кредитам за 12 месяцев нет",
                metrics={"max_overdue_days_12m": max_overdue, "current_overdue_days": current},
            )
        elif worst <= 30:
            payment_discipline = _factor(
                "medium",
                explanation=f"Были просрочки до {worst} дн. за 12 месяцев",
                metrics={"max_overdue_days_12m": max_overdue, "current_overdue_days": current},
            )
        else:
            payment_discipline = _factor(
                "bad",
                explanation=f"Существенные просрочки: до {worst} дн.",
                metrics={"max_overdue_days_12m": max_overdue, "current_overdue_days": current},
            )

    # --- financial_stability ---
    if not fin_metrics.get("available"):
        financial_stability = _factor(
            "unknown",
            explanation="Финансовый профиль недоступен — устойчивость не оценена",
        )
    else:
        avg_net = float(fin_metrics["avg_net"])
        margin = fin_metrics.get("margin")
        revenue_change = fin_metrics.get("revenue_change")
        if avg_net <= 0:
            financial_stability = _factor(
                "bad",
                explanation="Средний чистый денежный поток неположительный",
                metrics=fin_metrics,
            )
        elif (margin is not None and margin < 0.10) or (
            revenue_change is not None and revenue_change < -0.15
        ):
            financial_stability = _factor(
                "medium",
                explanation="Слабая маржа или снижение выручки",
                metrics=fin_metrics,
            )
        else:
            financial_stability = _factor(
                "good",
                explanation="Устойчивый чистый поток и приемлемая динамика выручки",
                metrics=fin_metrics,
            )

    # --- current_load ---
    if not bki_ok or not fin_metrics.get("available"):
        current_load = _factor(
            "unknown",
            explanation="Недостаточно данных для оценки текущей кредитной нагрузки",
        )
    else:
        assert bki_data is not None
        payments = float(bki_data.get("monthly_payments") or 0)
        avg_inflow = float(fin_metrics["avg_inflow"])
        if avg_inflow <= 0:
            current_load = _factor(
                "unknown",
                explanation="Средние поступления неизвестны или равны нулю",
            )
        else:
            ratio = payments / avg_inflow
            metrics = {
                "monthly_payments": payments,
                "avg_inflow": avg_inflow,
                "load_ratio": ratio,
            }
            if ratio < 0.15:
                current_load = _factor(
                    "good",
                    explanation=f"Кредитная нагрузка {ratio:.0%} от поступлений",
                    metrics=metrics,
                )
            elif ratio <= 0.30:
                current_load = _factor(
                    "medium",
                    explanation=f"Умеренная нагрузка {ratio:.0%} от поступлений",
                    metrics=metrics,
                )
            else:
                current_load = _factor(
                    "bad",
                    explanation=f"Высокая нагрузка {ratio:.0%} от поступлений",
                    metrics=metrics,
                )

    # --- new_request ---
    new_payment = annuity_payment(amount, term_months, annual_rate)
    if (
        not bki_ok
        or not fin_metrics.get("available")
        or new_payment <= 0
    ):
        new_request = _factor(
            "unknown",
            explanation="Недостаточно данных для оценки покрытия нового платежа",
            metrics={"new_payment": new_payment} if new_payment else None,
        )
    else:
        assert bki_data is not None
        payments = float(bki_data.get("monthly_payments") or 0)
        free_cash = float(fin_metrics["avg_net"]) - payments
        coverage = free_cash / new_payment
        metrics = {
            "avg_net": fin_metrics["avg_net"],
            "monthly_payments": payments,
            "free_cash": free_cash,
            "new_payment": new_payment,
            "coverage": coverage,
        }
        if coverage >= 1.5:
            new_request = _factor(
                "good",
                explanation=f"Покрытие нового платежа {coverage:.1f}×",
                metrics=metrics,
            )
        elif coverage >= 1.2:
            new_request = _factor(
                "medium",
                explanation=f"Пограничное покрытие нового платежа {coverage:.1f}×",
                metrics=metrics,
            )
        else:
            new_request = _factor(
                "bad",
                explanation=f"Недостаточное покрытие нового платежа {coverage:.1f}×",
                metrics=metrics,
            )

    factors = {
        "payment_discipline": payment_discipline,
        "financial_stability": financial_stability,
        "current_load": current_load,
        "new_request": new_request,
    }

    values = [factors[key]["value"] for key in FACTOR_KEYS]
    if any(v == "bad" for v in values):
        level: RiskLevel = "high"
    elif sum(1 for v in values if v == "medium") >= 2:
        level = "medium"
    else:
        level = "low"

    # data_complete for risk: all scored factors are not unknown AND sources ok
    data_complete = all(v != "unknown" for v in values) and all(
        (sources.get(name) or {}).get("status") == "ok"
        for name in ("registry", "finance", "bki", "product")
    )

    # registry status is informational for decision, not a risk factor
    _ = registry

    return {
        "level": level,
        "factors": factors,
        "data_complete": data_complete,
        "new_payment": new_payment,
    }
