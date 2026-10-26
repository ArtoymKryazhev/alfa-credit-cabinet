"""Source checks: registry, finance, BKI enrichment for an application."""

from __future__ import annotations

from typing import Any, Literal

from app.mocks.bki import find_bki
from app.mocks.finance import find_finance
from app.mocks.products import get_product
from app.mocks.registry import find_company

SourceStatus = Literal["ok", "unavailable", "missing"]


def _source_result(
    *,
    status: SourceStatus,
    source: str | None = None,
    as_of: str | None = None,
    data: dict[str, Any] | None = None,
    reason: str | None = None,
) -> dict[str, Any]:
    result: dict[str, Any] = {"status": status}
    if source is not None:
        result["source"] = source
    if as_of is not None:
        result["as_of"] = as_of
    if data is not None:
        result["data"] = data
    if reason is not None:
        result["reason"] = reason
    return result


def run_checks(
    *,
    inn: str,
    product_code: str,
    attempt: int,
) -> dict[str, Any]:
    """
    Collect mock source results for one pipeline attempt.

    attempt starts at 1. BKI may be unavailable for early attempts
    when the mock sets unavailable_attempts.
    """
    sources: dict[str, Any] = {}

    company = find_company(inn)
    if company is None:
        sources["registry"] = _source_result(
            status="missing",
            reason="company_not_in_registry",
        )
    else:
        sources["registry"] = _source_result(
            status="ok",
            source=str(company.get("source") or "Демо-реестр ЕГРЮЛ"),
            as_of=str(company.get("as_of") or ""),
            data={
                "inn": company.get("inn"),
                "name": company.get("name"),
                "status": company.get("status"),
                "region": company.get("region"),
                "industry": company.get("industry"),
            },
        )

    finance = find_finance(inn)
    if finance is None:
        sources["finance"] = _source_result(
            status="missing",
            reason="finance_not_found",
        )
    else:
        sources["finance"] = _source_result(
            status="ok",
            source=str(finance.get("source") or "Демо-финансовый профиль"),
            as_of=str(finance.get("as_of") or ""),
            data={
                "months": list(finance.get("months") or []),
            },
        )

    bki = find_bki(inn)
    if bki is None:
        sources["bki"] = _source_result(
            status="missing",
            reason="bki_not_found",
        )
    else:
        unavailable_until = int(bki.get("unavailable_attempts") or 0)
        if attempt <= unavailable_until:
            sources["bki"] = _source_result(
                status="unavailable",
                source=str(bki.get("source") or "Демо-БКИ"),
                as_of=str(bki.get("as_of") or ""),
                reason="source_temporarily_unavailable",
            )
        else:
            sources["bki"] = _source_result(
                status="ok",
                source=str(bki.get("source") or "Демо-БКИ"),
                as_of=str(bki.get("as_of") or ""),
                data={
                    "monthly_payments": bki.get("monthly_payments"),
                    "total_debt": bki.get("total_debt"),
                    "current_overdue_days": bki.get("current_overdue_days"),
                    "max_overdue_days_12m": bki.get("max_overdue_days_12m"),
                },
            )

    product = get_product(product_code)
    if product is None:
        sources["product"] = _source_result(
            status="missing",
            reason="product_not_found",
        )
    else:
        sources["product"] = _source_result(
            status="ok",
            source=str(product.get("source") or "Справочник продукта (демо)"),
            as_of=str(product.get("as_of") or ""),
            data=dict(product),
        )

    has_unavailable = any(
        item.get("status") == "unavailable" for item in sources.values()
    )
    has_missing = any(item.get("status") == "missing" for item in sources.values())
    data_complete = not has_unavailable and not has_missing

    return {
        "sources": sources,
        "data_complete": data_complete,
        "has_unavailable": has_unavailable,
        "has_missing": has_missing,
    }
