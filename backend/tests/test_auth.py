"""Auth endpoint tests."""

from fastapi.testclient import TestClient


def test_login_ok(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"login": "client1", "password": "demo"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["role"] == "client"
    assert data["display_name"]
    assert data["company_name"]


def test_login_bad_password(client: TestClient) -> None:
    response = client.post(
        "/api/auth/login",
        json={"login": "client1", "password": "wrong"},
    )
    assert response.status_code == 401


def test_me_with_token(client: TestClient) -> None:
    login = client.post(
        "/api/auth/login",
        json={"login": "client1", "password": "demo"},
    )
    token = login.json()["token"]
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    me = response.json()
    assert me["login"] == "client1"
    assert me["role"] == "client"


def test_me_without_token(client: TestClient) -> None:
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_logout_invalidates_session(client: TestClient) -> None:
    login = client.post(
        "/api/auth/login",
        json={"login": "manager", "password": "demo"},
    )
    token = login.json()["token"]
    logout = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert logout.status_code == 204
    me = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me.status_code == 401


def test_client_forbidden_on_manager_ping(client: TestClient) -> None:
    login = client.post(
        "/api/auth/login",
        json={"login": "client1", "password": "demo"},
    )
    token = login.json()["token"]
    response = client.get(
        "/api/manager/ping",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 403


def test_manager_ping_ok(client: TestClient) -> None:
    login = client.post(
        "/api/auth/login",
        json={"login": "manager", "password": "demo"},
    )
    token = login.json()["token"]
    response = client.get(
        "/api/manager/ping",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
