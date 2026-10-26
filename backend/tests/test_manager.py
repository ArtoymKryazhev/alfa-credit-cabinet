"""Manager review loop: queue, approve/decline, client offer actions."""

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


def _submit_application(
    client: TestClient,
    *,
    login: str = "client3",
    amount: int = 500_000,
) -> tuple[str, str]:
    """Submit as a company that lands in manual_review (default: client3 / C)."""
    token = _login(client, login)
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
            "term_months": 12,
            "purpose": "goods",
        },
    )
    assert patch.status_code == 200
    submitted = client.post(
        f"/api/applications/{app_id}/submit",
        headers=_auth(token),
    )
    assert submitted.status_code == 200
    assert submitted.json()["status"] == "manual_review"
    return token, app_id


def test_manager_approve_then_client_accept(client: TestClient) -> None:
    client_token, app_id = _submit_application(client, login="client3")
    manager_token = _login(client, "manager")
    queue = client.get(
        "/api/manager/applications",
        headers=_auth(manager_token),
        params={"attention": True},
    )
    assert queue.status_code == 200
    ids = [item["id"] for item in queue.json()]
    assert app_id in ids
    item = next(row for row in queue.json() if row["id"] == app_id)
    assert item["company_name"]
    assert item["client_display_name"]

    detail = client.get(
        f"/api/manager/applications/{app_id}",
        headers=_auth(manager_token),
    )
    assert detail.status_code == 200
    assert detail.json()["status"] == "manual_review"

    approved = client.post(
        f"/api/manager/applications/{app_id}/approve",
        headers=_auth(manager_token),
    )
    assert approved.status_code == 200
    approved_data = approved.json()
    assert approved_data["status"] == "offer_ready"
    assert approved_data["active_offer"] is not None
    assert approved_data["active_offer"]["amount"] == 500_000
    assert approved_data["active_offer"]["term_months"] == 12
    assert approved_data["active_offer"]["rate"] == 0.19
    assert approved_data["active_offer"]["payment"] > 0
    assert approved_data["decision"]["outcome"] == "offer"
    assert "manager_approve" in approved_data["decision"]["reason_codes"]
    offer_id = approved_data["active_offer"]["id"]

    roles = {
        event["actor_role"]
        for event in approved_data["events"]
        if event["actor_role"]
    }
    assert "client" in roles
    assert "manager" in roles

    accepted = client.post(
        f"/api/applications/{app_id}/offer/accept",
        headers=_auth(client_token),
        json={"offer_id": offer_id},
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "offer_accepted"


def test_manager_decline_with_reason(client: TestClient) -> None:
    client_token, app_id = _submit_application(client, login="client3", amount=700_000)
    manager_token = _login(client, "manager")

    empty = client.post(
        f"/api/manager/applications/{app_id}/decline",
        headers=_auth(manager_token),
        json={"reason": "  "},
    )
    assert empty.status_code == 422

    short = client.post(
        f"/api/manager/applications/{app_id}/decline",
        headers=_auth(manager_token),
        json={"reason": "ок"},
    )
    assert short.status_code == 422

    declined = client.post(
        f"/api/manager/applications/{app_id}/decline",
        headers=_auth(manager_token),
        json={"reason": "Недостаточно оборотов для запрошенной суммы"},
    )
    assert declined.status_code == 200
    data = declined.json()
    assert data["status"] == "declined"
    assert data["decision"]["outcome"] == "declined"
    assert data["decision"]["comment"] == "Недостаточно оборотов для запрошенной суммы"

    client_view = client.get(
        f"/api/applications/{app_id}",
        headers=_auth(client_token),
    )
    assert client_view.status_code == 200
    view = client_view.json()
    assert view["status"] == "declined"
    assert view["decision"]["comment"] == "Недостаточно оборотов для запрошенной суммы"


def test_approve_conflicts_and_client_decline_offer(client: TestClient) -> None:
    client_token, app_id = _submit_application(client, login="client3", amount=600_000)
    manager_token = _login(client, "manager")

    first = client.post(
        f"/api/manager/applications/{app_id}/approve",
        headers=_auth(manager_token),
    )
    assert first.status_code == 200
    offer_id = first.json()["active_offer"]["id"]

    again = client.post(
        f"/api/manager/applications/{app_id}/approve",
        headers=_auth(manager_token),
    )
    assert again.status_code == 409

    bad_offer = client.post(
        f"/api/applications/{app_id}/offer/accept",
        headers=_auth(client_token),
        json={"offer_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert bad_offer.status_code == 409

    declined_offer = client.post(
        f"/api/applications/{app_id}/offer/decline",
        headers=_auth(client_token),
        json={"offer_id": offer_id},
    )
    assert declined_offer.status_code == 200
    assert declined_offer.json()["status"] == "offer_declined"

    after_decline = client.post(
        f"/api/manager/applications/{app_id}/approve",
        headers=_auth(manager_token),
    )
    assert after_decline.status_code == 409


def test_role_guards_and_ownership(client: TestClient) -> None:
    client_token, app_id = _submit_application(client, login="client3")
    manager_token = _login(client, "manager")
    other_token = _login(client, "client2")

    forbidden_manager = client.get(
        "/api/manager/applications",
        headers=_auth(client_token),
    )
    assert forbidden_manager.status_code == 403

    forbidden_approve = client.post(
        f"/api/manager/applications/{app_id}/approve",
        headers=_auth(client_token),
    )
    assert forbidden_approve.status_code == 403

    approved = client.post(
        f"/api/manager/applications/{app_id}/approve",
        headers=_auth(manager_token),
    )
    assert approved.status_code == 200
    offer_id = approved.json()["active_offer"]["id"]

    manager_accept = client.post(
        f"/api/applications/{app_id}/offer/accept",
        headers=_auth(manager_token),
        json={"offer_id": offer_id},
    )
    assert manager_accept.status_code == 403

    foreign = client.get(
        f"/api/applications/{app_id}",
        headers=_auth(other_token),
    )
    assert foreign.status_code == 404


def test_draft_not_in_manager_queue(client: TestClient) -> None:
    client_token = _login(client, "client1")
    opened = client.post(
        "/api/applications",
        headers=_auth(client_token),
        json={"product_code": "working_capital"},
    )
    assert opened.status_code in (200, 201)
    assert opened.json()["status"] == "draft"
    draft_id = opened.json()["id"]

    manager_token = _login(client, "manager")
    queue = client.get(
        "/api/manager/applications",
        headers=_auth(manager_token),
        params={"attention": False},
    )
    assert queue.status_code == 200
    assert draft_id not in [item["id"] for item in queue.json()]

    missing = client.get(
        f"/api/manager/applications/{draft_id}",
        headers=_auth(manager_token),
    )
    assert missing.status_code == 404
