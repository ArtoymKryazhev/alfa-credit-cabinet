"""Multi-product catalog: open, validate, submit, reduced offer."""

from __future__ import annotations

from fastapi.testclient import TestClient


def _login(client: TestClient, login: str = "client1") -> str:
    response = client.post(
        "/api/auth/login",
        json={"login": login, "password": "demo"},
    )
    assert response.status_code == 200
    return response.json()["token"]


def _auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def _open(client: TestClient, token: str, product: str):
    return client.post(
        "/api/applications",
        headers=_auth(token),
        json={"product_code": product},
    )


def test_open_overdraft_separate_from_working_capital(client: TestClient) -> None:
    token = _login(client, "client1")
    wc = _open(client, token, "working_capital")
    od = _open(client, token, "overdraft")
    assert wc.status_code in (200, 201)
    assert od.status_code == 201
    assert wc.json()["id"] != od.json()["id"]
    assert od.json()["product_code"] == "overdraft"
    assert od.json()["product"]["name"] == "Овердрафт"
    assert od.json()["product"]["amount_max"] == 20_000_000


def test_open_overdraft_idempotent(client: TestClient) -> None:
    token = _login(client, "client1")
    first = _open(client, token, "overdraft")
    second = _open(client, token, "overdraft")
    assert first.status_code == 201
    assert second.status_code == 200
    assert first.json()["id"] == second.json()["id"]


def test_overdraft_param_bounds(client: TestClient) -> None:
    token = _login(client, "client1")
    app_id = _open(client, token, "overdraft").json()["id"]

    too_big = client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={"amount": 25_000_000, "term_months": 6, "purpose": "opex"},
    )
    assert too_big.status_code == 422

    bad_purpose = client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={"amount": 500_000, "term_months": 6, "purpose": "real_estate"},
    )
    assert bad_purpose.status_code == 422
    assert "назначение" in bad_purpose.json()["detail"].lower()


def test_submit_leasing_client1(client: TestClient) -> None:
    token = _login(client, "client1")
    opened = _open(client, token, "leasing")
    assert opened.status_code == 201
    data = opened.json()
    assert data["status"] == "draft"
    assert data["product"]["name"] == "Лизинг"
    app_id = data["id"]

    patch = client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={
            "current_step": "review",
            "amount": 1_000_000,
            "term_months": 24,
            "purpose": "equipment",
        },
    )
    assert patch.status_code == 200

    submitted = client.post(
        f"/api/applications/{app_id}/submit",
        headers=_auth(token),
    )
    assert submitted.status_code == 200
    body = submitted.json()
    assert body["status"] != "draft"
    assert body["product"]["name"] == "Лизинг"
    assert body["product_code"] == "leasing"


def test_manager_reduced_offer_uses_product_limits(client: TestClient) -> None:
    client_token = _login(client, "client3")
    opened = _open(client, client_token, "overdraft")
    assert opened.status_code in (200, 201)
    app_id = opened.json()["id"]

    patch = client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(client_token),
        json={
            "current_step": "review",
            "amount": 1_000_000,
            "term_months": 6,
            "purpose": "opex",
        },
    )
    assert patch.status_code == 200
    submitted = client.post(
        f"/api/applications/{app_id}/submit",
        headers=_auth(client_token),
    )
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "manual_review"

    manager_token = _login(client, "manager")
    below_min = client.post(
        f"/api/manager/applications/{app_id}/offer-reduced",
        headers=_auth(manager_token),
        json={"amount": 90_000},
    )
    assert below_min.status_code == 422

    bad_step = client.post(
        f"/api/manager/applications/{app_id}/offer-reduced",
        headers=_auth(manager_token),
        json={"amount": 125_000},
    )
    assert bad_step.status_code == 422

    ok = client.post(
        f"/api/manager/applications/{app_id}/offer-reduced",
        headers=_auth(manager_token),
        json={"amount": 500_000},
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "offer_ready"
    assert ok.json()["product"]["name"] == "Овердрафт"
