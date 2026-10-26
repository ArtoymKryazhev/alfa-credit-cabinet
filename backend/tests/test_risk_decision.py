"""Unit tests: risk factors and decision rules (no INN hardcode)."""

from app.services.decision import decide, max_affordable_amount
from app.services.risk import assess_risk


def _ok_registry(status: str = "active") -> dict:
    return {
        "status": "ok",
        "source": "demo",
        "as_of": "2026-10-01",
        "data": {"status": status, "inn": "x", "name": "X"},
    }


def _ok_finance(*, inflow: int = 3_000_000, opex: int = 2_300_000) -> dict:
    months = [
        {"ym": f"2026-{i:02d}", "inflow": inflow, "opex": opex}
        for i in range(1, 13)
    ]
    return {
        "status": "ok",
        "source": "demo",
        "as_of": "2026-10-01",
        "data": {"months": months},
    }


def _ok_bki(
    *,
    payments: int = 150_000,
    current_overdue: int = 0,
    max_overdue: int = 0,
) -> dict:
    return {
        "status": "ok",
        "source": "demo",
        "as_of": "2026-10-01",
        "data": {
            "monthly_payments": payments,
            "total_debt": 1_000_000,
            "current_overdue_days": current_overdue,
            "max_overdue_days_12m": max_overdue,
        },
    }


def _ok_product() -> dict:
    return {
        "status": "ok",
        "source": "demo",
        "as_of": "2026-10-01",
        "data": {
            "code": "working_capital",
            "amount_min": 300_000,
            "amount_max": 10_000_000,
            "term_min": 6,
            "term_max": 36,
            "rate_annual": 0.19,
            "alternative_step": 50_000,
            "target_coverage": 1.5,
        },
    }


def test_unknown_never_becomes_zero_or_good() -> None:
    sources = {
        "registry": _ok_registry(),
        "finance": _ok_finance(),
        "bki": {"status": "unavailable", "source": "demo", "as_of": "2026-10-01"},
        "product": _ok_product(),
    }
    risk = assess_risk(sources=sources, amount=500_000, term_months=12)
    assert risk["factors"]["payment_discipline"]["value"] == "unknown"
    assert risk["factors"]["current_load"]["value"] == "unknown"
    assert risk["factors"]["new_request"]["value"] == "unknown"
    # Must not invent favourable coverage from missing BKI
    metrics = risk["factors"]["new_request"].get("metrics") or {}
    assert metrics.get("coverage") is None
    assert risk["data_complete"] is False


def test_source_unavailable_beats_coverage() -> None:
    sources = {
        "registry": _ok_registry(),
        "finance": _ok_finance(inflow=1_000_000, opex=900_000),
        "bki": {"status": "unavailable", "source": "demo"},
        "product": _ok_product(),
    }
    risk = assess_risk(sources=sources, amount=5_000_000, term_months=12)
    result = decide(
        sources=sources,
        risk=risk,
        amount=5_000_000,
        term_months=12,
    )
    assert result["status"] == "manual_review"
    assert "source_unavailable" in result["reason_codes"]
    assert result["outcome"] != "declined"


def test_stop_condition_beats_everything() -> None:
    sources = {
        "registry": _ok_registry(status="liquidating"),
        "finance": _ok_finance(),
        "bki": _ok_bki(),
        "product": _ok_product(),
    }
    risk = assess_risk(sources=sources, amount=500_000, term_months=12)
    result = decide(
        sources=sources,
        risk=risk,
        amount=500_000,
        term_months=12,
    )
    assert result["status"] == "declined"
    assert "company_inactive" in result["reason_codes"]


def test_overdue_over_60_declines() -> None:
    sources = {
        "registry": _ok_registry(),
        "finance": _ok_finance(),
        "bki": _ok_bki(current_overdue=90),
        "product": _ok_product(),
    }
    risk = assess_risk(sources=sources, amount=500_000, term_months=12)
    result = decide(
        sources=sources,
        risk=risk,
        amount=500_000,
        term_months=12,
    )
    assert result["status"] == "declined"
    assert "overdue_over_60" in result["reason_codes"]


def test_alternative_amount_rounding() -> None:
    amount = max_affordable_amount(
        free_cash=200_000,
        term_months=12,
        annual_rate=0.19,
        target_coverage=1.5,
        amount_min=300_000,
        amount_max=10_000_000,
        step=50_000,
    )
    assert amount is not None
    assert amount % 50_000 == 0
    assert amount >= 300_000


def test_healthy_profile_auto_offer() -> None:
    sources = {
        "registry": _ok_registry(),
        "finance": _ok_finance(inflow=3_000_000, opex=2_300_000),
        "bki": _ok_bki(payments=150_000),
        "product": _ok_product(),
    }
    risk = assess_risk(sources=sources, amount=500_000, term_months=12)
    assert risk["level"] == "low"
    result = decide(
        sources=sources,
        risk=risk,
        amount=500_000,
        term_months=12,
    )
    assert result["outcome"] == "offer"
    assert result["status"] == "offer_ready"
