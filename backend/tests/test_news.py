"""Personalized news feed tests."""

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


def test_news_unauthorized(client: TestClient) -> None:
    response = client.get("/api/news")
    assert response.status_code == 401


def test_news_manager_forbidden(client: TestClient) -> None:
    token = _login(client, "manager")
    response = client.get("/api/news", headers=_auth(token))
    assert response.status_code == 403


def test_news_client1_personalized(client: TestClient) -> None:
    token = _login(client, "client1")
    response = client.get("/api/news", headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["personalized"] is True
    assert data["industry"] == "Производство продуктов питания"
    assert data["region"] == "Москва"
    assert len(data["items"]) == 3
    titles = [item["title"] for item in data["items"]]
    assert any("выпечк" in t.lower() or "пищев" in t.lower() or "Москва" in t for t in titles)


def test_news_client3_different_from_client1(client: TestClient) -> None:
    token1 = _login(client, "client1")
    token3 = _login(client, "client3")

    feed1 = client.get("/api/news", headers=_auth(token1)).json()
    feed3 = client.get("/api/news", headers=_auth(token3)).json()

    assert feed1["personalized"] is True
    assert feed3["personalized"] is True
    assert feed3["industry"] == "Услуги для бизнеса"
    assert feed3["region"] == "Татарстан"

    titles1 = {item["title"] for item in feed1["items"]}
    titles3 = {item["title"] for item in feed3["items"]}
    assert titles1 != titles3


def test_news_client4_fallback_general(client: TestClient) -> None:
    token = _login(client, "client4")
    response = client.get("/api/news", headers=_auth(token))
    assert response.status_code == 200
    data = response.json()
    assert data["personalized"] is False
    assert data["industry"] is None
    assert data["region"] is None
    assert len(data["items"]) == 3
    for item in data["items"]:
        assert item["industries"] == []
        assert item["regions"] == []
