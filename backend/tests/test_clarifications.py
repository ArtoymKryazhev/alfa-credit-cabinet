"""T07: clarifications, attachments, reduced offer, recheck."""

from __future__ import annotations

from io import BytesIO

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
            "description": "Демо-профиль для T07",
            "contact_person": "Тест Т.Т.",
            "contact_phone": "+79001112233",
            "contact_email": "demo@example.com",
        },
    )
    assert response.status_code == 200


def _submit_application(
    client: TestClient,
    *,
    login: str,
    amount: int = 500_000,
    fill_profile: dict[str, str] | None = None,
) -> tuple[str, str, dict]:
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
    return token, app_id, submitted.json()


def test_clarification_cycle_with_file(client: TestClient) -> None:
    client_token, app_id, data = _submit_application(
        client, login="client3", amount=500_000
    )
    assert data["status"] == "manual_review"
    manager_token = _login(client, "manager")

    asked = client.post(
        f"/api/manager/applications/{app_id}/request-clarification",
        headers=_auth(manager_token),
        json={"question": "Уточните структуру оборота за последний квартал"},
    )
    assert asked.status_code == 200
    asked_data = asked.json()
    assert asked_data["status"] == "clarification_requested"
    assert len(asked_data["clarifications"]) == 1
    assert asked_data["clarifications"][0]["status"] == "open"

    pdf = BytesIO(b"%PDF-1.4 demo clarification attachment")
    answered = client.post(
        f"/api/applications/{app_id}/answer",
        headers=_auth(client_token),
        data={"answer_text": "Оборот стабильный, прилагаю выписку"},
        files={"file": ("turnover.pdf", pdf, "application/pdf")},
    )
    assert answered.status_code == 200
    answered_data = answered.json()
    assert answered_data["id"] == app_id
    assert answered_data["status"] == "manual_review"
    assert len(answered_data["clarifications"]) == 1
    clarification = answered_data["clarifications"][0]
    assert clarification["status"] == "answered"
    assert clarification["answer_text"].startswith("Оборот стабильный")
    assert clarification["attachment"] is not None
    attachment_id = clarification["attachment"]["id"]

    messages = [event["message"] for event in answered_data["events"]]
    assert any("уточнение" in message.lower() for message in messages)
    assert any("ответил" in message.lower() for message in messages)

    owned = client.get(
        f"/api/attachments/{attachment_id}",
        headers=_auth(client_token),
    )
    assert owned.status_code == 200
    assert owned.content.startswith(b"%PDF")

    manager_dl = client.get(
        f"/api/attachments/{attachment_id}",
        headers=_auth(manager_token),
    )
    assert manager_dl.status_code == 200

    other_token = _login(client, "client1")
    foreign = client.get(
        f"/api/attachments/{attachment_id}",
        headers=_auth(other_token),
    )
    assert foreign.status_code == 404


def test_clarification_transition_guards(client: TestClient) -> None:
    client_token, app_id, _ = _submit_application(
        client, login="client3", amount=600_000
    )
    manager_token = _login(client, "manager")

    early_answer = client.post(
        f"/api/applications/{app_id}/answer",
        headers=_auth(client_token),
        data={"answer_text": "Слишком рано"},
    )
    assert early_answer.status_code == 409

    forbidden = client.post(
        f"/api/manager/applications/{app_id}/request-clarification",
        headers=_auth(client_token),
        json={"question": "Клиент не должен сюда"},
    )
    assert forbidden.status_code == 403

    asked = client.post(
        f"/api/manager/applications/{app_id}/request-clarification",
        headers=_auth(manager_token),
        json={"question": "Нужны детали по контрагентам"},
    )
    assert asked.status_code == 200

    again = client.post(
        f"/api/manager/applications/{app_id}/request-clarification",
        headers=_auth(manager_token),
        json={"question": "Повторный запрос недопустим"},
    )
    assert again.status_code == 409


def test_attachment_validation(client: TestClient) -> None:
    client_token, app_id, _ = _submit_application(
        client, login="client3", amount=550_000
    )
    manager_token = _login(client, "manager")
    asked = client.post(
        f"/api/manager/applications/{app_id}/request-clarification",
        headers=_auth(manager_token),
        json={"question": "Приложите документ"},
    )
    assert asked.status_code == 200

    bad_type = client.post(
        f"/api/applications/{app_id}/answer",
        headers=_auth(client_token),
        data={"answer_text": "Вот файл"},
        files={"file": ("notes.txt", BytesIO(b"hello"), "text/plain")},
    )
    assert bad_type.status_code == 422

    too_big = client.post(
        f"/api/applications/{app_id}/answer",
        headers=_auth(client_token),
        data={"answer_text": "Большой файл"},
        files={
            "file": (
                "big.pdf",
                BytesIO(b"x" * (5 * 1024 * 1024 + 1)),
                "application/pdf",
            )
        },
    )
    assert too_big.status_code == 422


def test_reduced_offer_and_stale_accept(client: TestClient) -> None:
    client_token, app_id, data = _submit_application(
        client, login="client2", amount=3_000_000
    )
    assert data["status"] == "manual_review"
    alt = data["decision"]["alternative_amount"]
    assert alt is not None
    manager_token = _login(client, "manager")

    too_high = client.post(
        f"/api/manager/applications/{app_id}/offer-reduced",
        headers=_auth(manager_token),
        json={"amount": 3_000_000},
    )
    assert too_high.status_code == 422

    below_min = client.post(
        f"/api/manager/applications/{app_id}/offer-reduced",
        headers=_auth(manager_token),
        json={"amount": 250_000},
    )
    assert below_min.status_code == 422

    not_step = client.post(
        f"/api/manager/applications/{app_id}/offer-reduced",
        headers=_auth(manager_token),
        json={"amount": 1_234_567},
    )
    assert not_step.status_code == 422

    reduced = client.post(
        f"/api/manager/applications/{app_id}/offer-reduced",
        headers=_auth(manager_token),
        json={"amount": alt},
    )
    assert reduced.status_code == 200
    reduced_data = reduced.json()
    assert reduced_data["status"] == "offer_ready"
    assert reduced_data["active_offer"] is not None
    assert reduced_data["active_offer"]["amount"] == alt
    assert reduced_data["active_offer"]["version"] == 1
    assert "manager_reduced_offer" in reduced_data["decision"]["reason_codes"]
    first_offer_id = reduced_data["active_offer"]["id"]

    accepted = client.post(
        f"/api/applications/{app_id}/offer/accept",
        headers=_auth(client_token),
        json={"offer_id": first_offer_id},
    )
    assert accepted.status_code == 200
    assert accepted.json()["status"] == "offer_accepted"

    stale = client.post(
        f"/api/applications/{app_id}/offer/accept",
        headers=_auth(client_token),
        json={"offer_id": first_offer_id},
    )
    assert stale.status_code == 409


def test_reduced_offer_versioning_stale_id(client: TestClient) -> None:
    """New reduced offer deactivates previous; accept old offer_id → 409."""
    client_token, app_id, _ = _submit_application(
        client, login="client3", amount=800_000
    )
    manager_token = _login(client, "manager")

    approved = client.post(
        f"/api/manager/applications/{app_id}/approve",
        headers=_auth(manager_token),
    )
    assert approved.status_code == 200
    first_offer_id = approved.json()["active_offer"]["id"]
    assert approved.json()["active_offer"]["version"] == 1

    # Reset to manual_review so a replacement reduced offer can be created.
    from app.db import SessionLocal
    from app.models.application import Application

    with SessionLocal() as session:
        row = session.get(Application, app_id)
        assert row is not None
        row.status = "manual_review"
        session.commit()

    reduced = client.post(
        f"/api/manager/applications/{app_id}/offer-reduced",
        headers=_auth(manager_token),
        json={"amount": 500_000},
    )
    assert reduced.status_code == 200
    reduced_data = reduced.json()
    assert reduced_data["status"] == "offer_ready"
    assert reduced_data["active_offer"]["version"] == 2
    assert reduced_data["active_offer"]["amount"] == 500_000
    second_offer_id = reduced_data["active_offer"]["id"]
    assert second_offer_id != first_offer_id

    stale = client.post(
        f"/api/applications/{app_id}/offer/accept",
        headers=_auth(client_token),
        json={"offer_id": first_offer_id},
    )
    assert stale.status_code == 409

    bogus = client.post(
        f"/api/applications/{app_id}/offer/accept",
        headers=_auth(client_token),
        json={"offer_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert bogus.status_code == 409

    ok = client.post(
        f"/api/applications/{app_id}/offer/accept",
        headers=_auth(client_token),
        json={"offer_id": second_offer_id},
    )
    assert ok.status_code == 200
    assert ok.json()["status"] == "offer_accepted"


def test_recheck_client5(client: TestClient) -> None:
    client_token, app_id, data = _submit_application(
        client,
        login="client5",
        amount=500_000,
        fill_profile={
            "inn": "7701000005",
            "activity": "IT и цифровые сервисы",
        },
    )
    assert data["status"] == "manual_review"
    assert "source_unavailable" in data["decision"]["reason_codes"]
    assert data["checks"]["attempt"] == 1
    assert data["checks"]["sources"]["bki"]["status"] == "unavailable"

    manager_token = _login(client, "manager")
    rechecked = client.post(
        f"/api/manager/applications/{app_id}/recheck",
        headers=_auth(manager_token),
    )
    assert rechecked.status_code == 200
    recheck_data = rechecked.json()
    assert recheck_data["checks"]["attempt"] == 2
    assert recheck_data["checks"]["sources"]["bki"]["status"] == "ok"
    assert recheck_data["status"] in ("offer_ready", "manual_review", "declined")
    if recheck_data["decision"]["outcome"] == "manual_review":
        assert "source_unavailable" not in recheck_data["decision"]["reason_codes"]

    if recheck_data["status"] == "manual_review":
        approved = client.post(
            f"/api/manager/applications/{app_id}/approve",
            headers=_auth(manager_token),
        )
        assert approved.status_code == 200

    bad = client.post(
        f"/api/manager/applications/{app_id}/recheck",
        headers=_auth(manager_token),
    )
    assert bad.status_code == 409

    forbidden = client.post(
        f"/api/manager/applications/{app_id}/recheck",
        headers=_auth(client_token),
    )
    assert forbidden.status_code == 403
