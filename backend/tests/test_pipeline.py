"""T06 pipeline: companies A–E outcomes from data, not INN hardcode."""

from fastapi.testclient import TestClient


def _login(client: TestClient, login: str) -> str:
    response = client.post(
        "/api/auth/login",
        json={"login": login, "password": "demo"},
    )
    assert response.status_code == 200
    return response.json()["token"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _fill_profile(
    client: TestClient,
    token: str,
    *,
    inn: str,
    activity: str,
) -> None:
    response = client.put(
        "/api/profile",
        headers=_auth(token),
        json={
            "inn": inn,
            "activity_direction": activity,
            "description": "Демо-профиль для конвейера",
            "contact_person": "Тест Т.Т.",
            "contact_phone": "+79001112233",
            "contact_email": "demo@example.com",
        },
    )
    assert response.status_code == 200


def _submit(
    client: TestClient,
    *,
    login: str,
    amount: int,
    term_months: int = 12,
    fill_profile: dict[str, str] | None = None,
) -> dict:
    token = _login(client, login)
    if fill_profile is not None:
        _fill_profile(
            client,
            token,
            inn=fill_profile["inn"],
            activity=fill_profile["activity"],
        )
    opened = client.post(
        "/api/applications",
        headers=_auth(token),
        json={"product_code": "working_capital"},
    )
    assert opened.status_code in (200, 201)
    app_id = opened.json()["id"]
    patch = client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={
            "current_step": "review",
            "amount": amount,
            "term_months": term_months,
            "purpose": "goods",
        },
    )
    assert patch.status_code == 200
    submitted = client.post(
        f"/api/applications/{app_id}/submit",
        headers=_auth(token),
    )
    assert submitted.status_code == 200
    data = submitted.json()
    data["_token"] = token
    return data


def test_company_a_auto_offer(client: TestClient) -> None:
    data = _submit(client, login="client1", amount=500_000)
    assert data["status"] == "offer_ready"
    assert data["active_offer"] is not None
    assert data["active_offer"]["amount"] == 500_000
    assert data["active_offer"]["rate"] == 0.19
    assert data["decision"]["outcome"] == "offer"
    assert "auto_approve" in data["decision"]["reason_codes"]
    assert data["risk"]["level"] == "low"
    assert data["risk"]["data_complete"] is True
    assert data["checks"]["data_complete"] is True


def test_company_b_manual_with_alternative(client: TestClient) -> None:
    data = _submit(client, login="client2", amount=3_000_000)
    assert data["status"] == "manual_review"
    assert data["decision"]["outcome"] == "manual_review"
    assert "coverage_insufficient" in data["decision"]["reason_codes"]
    alt = data["decision"]["alternative_amount"]
    assert alt is not None
    assert alt >= 300_000
    assert alt < 3_000_000
    assert alt % 50_000 == 0
    assert data["active_offer"] is None


def test_company_c_manual_medium_risk(client: TestClient) -> None:
    data = _submit(client, login="client3", amount=500_000)
    assert data["status"] == "manual_review"
    assert data["decision"]["outcome"] == "manual_review"
    assert "risk_medium" in data["decision"]["reason_codes"]
    assert data["risk"]["level"] == "medium"
    assert data["decision"]["alternative_amount"] is None


def test_company_d_auto_decline(client: TestClient) -> None:
    data = _submit(
        client,
        login="client4",
        amount=500_000,
        fill_profile={
            "inn": "7701000004",
            "activity": "Розничная торговля",
        },
    )
    assert data["status"] == "declined"
    assert data["decision"]["outcome"] == "declined"
    assert "company_inactive" in data["decision"]["reason_codes"]
    assert data["decision"]["comment"]
    assert data["active_offer"] is None


def test_company_e_source_unavailable(client: TestClient) -> None:
    data = _submit(
        client,
        login="client5",
        amount=500_000,
        fill_profile={
            "inn": "7701000005",
            "activity": "IT и цифровые сервисы",
        },
    )
    assert data["status"] == "manual_review"
    assert data["decision"]["outcome"] == "manual_review"
    assert "source_unavailable" in data["decision"]["reason_codes"]
    assert data["status"] != "declined"
    assert data["checks"]["sources"]["bki"]["status"] == "unavailable"
    assert data["risk"]["factors"]["payment_discipline"]["value"] == "unknown"
    assert data["risk"]["factors"]["current_load"]["value"] == "unknown"
    assert data["risk"]["factors"]["new_request"]["value"] == "unknown"


def test_repeat_submit_conflict(client: TestClient) -> None:
    data = _submit(client, login="client1", amount=500_000)
    token = data["_token"]
    again = client.post(
        f"/api/applications/{data['id']}/submit",
        headers=_auth(token),
    )
    assert again.status_code == 409
