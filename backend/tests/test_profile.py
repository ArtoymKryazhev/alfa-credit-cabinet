"""Business profile + registry lookup tests."""

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


def test_get_profile_filled_seed(client: TestClient) -> None:
    token = _login(client, "client1")
    response = client.get("/api/profile", headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["completeness"] == "filled"
    assert data["inn"] == "7701000001"
    assert data["company_name"]
    assert data["registry_source"]
    assert data["registry_as_of"]
    assert data["contact_person"]


def test_get_profile_partial_seed(client: TestClient) -> None:
    token = _login(client, "client2")
    response = client.get("/api/profile", headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["completeness"] == "partial"
    assert data["inn"] == "7701000002"
    assert data["activity_direction"]
    assert data["contact_person"] is None


def test_get_profile_empty_seed(client: TestClient) -> None:
    token = _login(client, "client4")
    response = client.get("/api/profile", headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["completeness"] == "empty"
    assert data["inn"] is None


def test_lookup_own_inn(client: TestClient) -> None:
    token = _login(client, "client4")
    response = client.post(
        "/api/profile/registry-lookup",
        headers=_auth(token),
        json={"inn": "7701000004"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["inn"] == "7701000004"
    assert data["name"]
    assert data["source"]
    assert data["as_of"]
    assert data["status"] == "liquidating"


def test_lookup_foreign_inn(client: TestClient) -> None:
    token = _login(client, "client4")
    response = client.post(
        "/api/profile/registry-lookup",
        headers=_auth(token),
        json={"inn": "7701000001"},
    )
    assert response.status_code == 403
    assert "не относится" in response.json()["detail"].lower()


def test_lookup_unknown_inn(client: TestClient) -> None:
    token = _login(client, "client4")
    response = client.post(
        "/api/profile/registry-lookup",
        headers=_auth(token),
        json={"inn": "7701999999"},
    )
    assert response.status_code == 404
    assert "демо-реестре" in response.json()["detail"].lower()


def test_lookup_invalid_format(client: TestClient) -> None:
    token = _login(client, "client4")
    response = client.post(
        "/api/profile/registry-lookup",
        headers=_auth(token),
        json={"inn": "123"},
    )
    assert response.status_code == 422


def test_put_then_get_persists(client: TestClient) -> None:
    token = _login(client, "client5")
    put = client.put(
        "/api/profile",
        headers=_auth(token),
        json={
            "inn": "7701000005",
            "activity_direction": "IT и цифровые сервисы",
            "description": "Разрабатываем SaaS для ритейла",
            "contact_person": "Новиков Д.Д.",
            "contact_phone": "+7 (900) 555-00-05",
            "contact_email": "client5@demo.local",
        },
    )
    assert put.status_code == 200
    saved = put.json()
    assert saved["completeness"] == "filled"
    assert saved["inn"] == "7701000005"
    assert saved["registry_source"]

    get_again = client.get("/api/profile", headers=_auth(token))
    assert get_again.status_code == 200
    data = get_again.json()
    assert data["completeness"] == "filled"
    assert data["description"] == "Разрабатываем SaaS для ритейла"
    assert data["contact_email"] == "client5@demo.local"


def test_put_inn_only_partial(client: TestClient) -> None:
    token = _login(client, "client4")
    put = client.put(
        "/api/profile",
        headers=_auth(token),
        json={"inn": "7701000004"},
    )
    assert put.status_code == 200
    data = put.json()
    assert data["completeness"] == "partial"
    assert data["company_name"]
    assert data["contact_person"] is None


def test_profile_unauthorized(client: TestClient) -> None:
    response = client.get("/api/profile")
    assert response.status_code == 401


def test_manager_forbidden_on_profile(client: TestClient) -> None:
    token = _login(client, "manager")
    response = client.get("/api/profile", headers=_auth(token))
    assert response.status_code == 403
