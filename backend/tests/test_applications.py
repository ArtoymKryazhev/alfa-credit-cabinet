"""Client applications: open draft, patch, submit, ownership."""

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


def _open_draft(client: TestClient, token: str, product: str = "working_capital"):
    return client.post(
        "/api/applications",
        headers=_auth(token),
        json={"product_code": product},
    )


def test_open_draft_idempotent(client: TestClient) -> None:
    token = _login(client, "client1")
    first = _open_draft(client, token)
    assert first.status_code == 201
    data1 = first.json()
    assert data1["status"] == "draft"
    assert data1["product_code"] == "working_capital"
    assert data1["current_step"] == "business"
    assert len(data1["events"]) == 1

    second = _open_draft(client, token)
    assert second.status_code == 200
    data2 = second.json()
    assert data2["id"] == data1["id"]


def test_open_unavailable_product(client: TestClient) -> None:
    token = _login(client, "client1")
    response = _open_draft(client, token, product="unknown_product")
    assert response.status_code == 422
    assert "демо" in response.json()["detail"].lower()


def test_patch_draft_and_bounds(client: TestClient) -> None:
    token = _login(client, "client1")
    app_id = _open_draft(client, token).json()["id"]

    ok = client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={
            "current_step": "params",
            "amount": 1_000_000,
            "term_months": 12,
            "purpose": "goods",
            "comment": "закупка",
        },
    )
    assert ok.status_code == 200
    data = ok.json()
    assert data["current_step"] == "params"
    assert data["draft_payload"]["amount"] == 1_000_000
    assert data["draft_payload"]["purpose"] == "goods"
    assert data["amount"] == 1_000_000
    assert data["estimated_payment"] is not None

    bad = client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={"amount": 100},
    )
    assert bad.status_code == 422


def test_submit_auto_offer_and_idempotent(client: TestClient) -> None:
    token = _login(client, "client1")
    app_id = _open_draft(client, token).json()["id"]
    client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={
            "current_step": "review",
            "amount": 500_000,
            "term_months": 12,
            "purpose": "materials",
        },
    )

    submitted = client.post(
        f"/api/applications/{app_id}/submit",
        headers=_auth(token),
    )
    assert submitted.status_code == 200
    data = submitted.json()
    assert data["status"] == "offer_ready"
    assert data["snapshot"] is not None
    assert data["snapshot"]["inn"] == "7701000001"
    assert data["submitted_at"] is not None
    assert data["active_offer"] is not None
    assert data["active_offer"]["amount"] == 500_000
    assert data["decision"]["outcome"] == "offer"
    assert "auto_approve" in data["decision"]["reason_codes"]
    assert data["risk"] is not None
    assert data["checks"] is not None
    assert len(data["events"]) >= 2

    again = client.post(
        f"/api/applications/{app_id}/submit",
        headers=_auth(token),
    )
    assert again.status_code == 409

    listing = client.get("/api/applications", headers=_auth(token))
    assert listing.status_code == 200
    ids = [item["id"] for item in listing.json()]
    assert ids.count(app_id) == 1


def test_patch_after_submit_conflict(client: TestClient) -> None:
    token = _login(client, "client1")
    app_id = _open_draft(client, token).json()["id"]
    client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={"amount": 500_000, "term_months": 6, "purpose": "opex"},
    )
    assert (
        client.post(
            f"/api/applications/{app_id}/submit",
            headers=_auth(token),
        ).status_code
        == 200
    )

    patch = client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={"amount": 600_000},
    )
    assert patch.status_code == 409


def test_foreign_application_404(client: TestClient) -> None:
    token1 = _login(client, "client1")
    app_id = _open_draft(client, token1).json()["id"]

    token3 = _login(client, "client3")
    response = client.get(
        f"/api/applications/{app_id}",
        headers=_auth(token3),
    )
    assert response.status_code == 404


def test_manager_forbidden_on_client_endpoints(client: TestClient) -> None:
    token = _login(client, "manager")
    response = client.get("/api/applications", headers=_auth(token))
    assert response.status_code == 403


def test_profile_change_does_not_rewrite_snapshot(client: TestClient) -> None:
    token = _login(client, "client1")
    app_id = _open_draft(client, token).json()["id"]
    client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={"amount": 800_000, "term_months": 18, "purpose": "goods"},
    )
    submitted = client.post(
        f"/api/applications/{app_id}/submit",
        headers=_auth(token),
    ).json()
    snapshot_before = submitted["snapshot"]
    assert snapshot_before["contact_person"]

    profile_put = client.put(
        "/api/profile",
        headers=_auth(token),
        json={
            "inn": "7701000001",
            "activity_direction": "Розничная торговля",
            "description": "Изменено после submit",
            "contact_person": "Новый Контакт",
            "contact_phone": "+79001112233",
            "contact_email": "new@example.com",
        },
    )
    assert profile_put.status_code == 200
    assert profile_put.json()["contact_person"] == "Новый Контакт"

    again = client.get(
        f"/api/applications/{app_id}",
        headers=_auth(token),
    ).json()
    assert again["snapshot"]["contact_person"] == snapshot_before["contact_person"]
    assert again["snapshot"]["description"] == snapshot_before["description"]


def test_submit_empty_profile_422(client: TestClient) -> None:
    token = _login(client, "client4")
    app_id = _open_draft(client, token).json()["id"]
    client.patch(
        f"/api/applications/{app_id}",
        headers=_auth(token),
        json={"amount": 500_000, "term_months": 12, "purpose": "goods"},
    )
    response = client.post(
        f"/api/applications/{app_id}/submit",
        headers=_auth(token),
    )
    assert response.status_code == 422
    assert "профиль" in response.json()["detail"].lower()


def test_new_draft_after_submit(client: TestClient) -> None:
    token = _login(client, "client1")
    first_id = _open_draft(client, token).json()["id"]
    client.patch(
        f"/api/applications/{first_id}",
        headers=_auth(token),
        json={"amount": 500_000, "term_months": 12, "purpose": "goods"},
    )
    assert (
        client.post(
            f"/api/applications/{first_id}/submit",
            headers=_auth(token),
        ).status_code
        == 200
    )

    second = _open_draft(client, token)
    assert second.status_code == 201
    assert second.json()["id"] != first_id
    assert second.json()["status"] == "draft"
