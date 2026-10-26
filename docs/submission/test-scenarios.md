# Тестовые сценарии

Пароль всех демо-аккаунтов: **`demo`**.  
UI: `http://localhost:8080`. API/Swagger: `http://localhost:8000/api/docs`.

Автопокрытие: `backend/tests/` (`pytest`).

---

## Сценарии A–E (happy / ветки конвейера)

### A — client1, авто-предложение

| | |
| -- | -- |
| Аккаунт | `client1` — ООО «Стабильный поток», профиль filled |
| Ожидание | После submit → `offer_ready`, активный оффер на запрошенных условиях |

Шаги:

1. Войти как `client1`.
2. Открыть «Мой бизнес» — профиль заполнен (можно оставить как есть).
3. На витрине «Оформить» у «Кредит для бизнеса» (`working_capital`).
4. Пройти wizard (business → params → review), сумма в лимитах продукта, отправить.
5. Убедиться: статус «Предложение», условия видны.
6. Принять предложение → `offer_accepted`.

Pytest: `test_pipeline.py`, `test_risk_decision.py` (исход A).

---

### B — client2, запрос сверх возможностей → альтернатива

| | |
| -- | -- |
| Аккаунт | `client2` — профиль partial |
| Ожидание | `manual_review` + `alternative_amount`; менеджер может `offer-reduced` |

Шаги:

1. Войти как `client2`, при необходимости дозаполнить профиль (ИНН компании аккаунта).
2. Оформить оборотный кредит с **высокой** суммой (близко к max продукта).
3. Submit → `manual_review`, в карточке видна альтернативная сумма.
4. Выйти, войти как `manager`, открыть заявку.
5. `offer-reduced` с суммой &lt; requested, ≥ 300 000, кратно 50 000 → `offer_ready`.
6. Клиент принимает или отклоняет.

Pytest: `test_pipeline.py`, `test_manager.py`.

---

### C — client3, средний риск → уточнение

| | |
| -- | -- |
| Аккаунт | `client3` — профиль filled |
| Ожидание | `manual_review`; менеджер запрашивает уточнение; клиент отвечает (+ файл) |

Шаги:

1. `client3` → оформить и отправить заявку → `manual_review`.
2. `manager` → `request-clarification` с текстом вопроса.
3. Клиент видит статус `clarification_requested`, отвечает текстом и прикладывает pdf/png/jpg ≤5 МБ.
4. Статус → снова `manual_review` (без авто-recheck).
5. Менеджер `approve` или `decline`.

Pytest: `test_clarifications.py`, `test_manager.py`.

---

### D — client4, компания не действует → авто-отказ

| | |
| -- | -- |
| Аккаунт | `client4` — профиль пустой до заполнения; в реестре статус ликвидации / не действует |
| Ожидание | После заполнения профиля и submit → `declined` (hard stop) |

Шаги:

1. Войти как `client4`, заполнить профиль (ИНН компании аккаунта через registry-lookup).
2. Оформить и отправить заявку.
3. Статус `declined`, причина объяснима.

Pytest: `test_pipeline.py`, `test_risk_decision.py`.

---

### E — client5, БКИ unavailable → recheck

| | |
| -- | -- |
| Аккаунт | `client5` — профиль пустой; на attempt 1 БКИ `unavailable` |
| Ожидание | Submit → `manual_review` (`source_unavailable`); manager `recheck` → attempt 2 успешен |

Шаги:

1. Заполнить профиль `client5`, отправить заявку → `manual_review`.
2. Менеджер нажимает «Повторить проверку» (`recheck`).
3. Конвейер перезапускается с attempt++; исход меняется согласно данным 2-й попытки.

Pytest: `test_pipeline.py`, `test_clarifications.py` (recheck).

---

### Новости под профиль (T08)

1. Войти как `client1` (есть `activity_direction` / industry / region).
2. На `/app` блок новостей отражает отрасль/регион (score industry+2, region+1).
3. Аккаунт без профиля — general + подсказка в UI.

Pytest: `test_news.py`.

---

## Негативные сценарии

| # | Действие | Ожидание | Тест |
| - | -------- | -------- | ---- |
| N1 | Клиент A открывает `GET /applications/{id}` клиента B | 404 | `test_applications.py` |
| N2 | Клиент вызывает `GET /manager/applications` | 403 | `test_auth.py` / `test_manager.py` |
| N3 | Повторный `submit` не-draft заявки | 409 | `test_applications.py` |
| N4 | Accept/decline с неверным / неактивным `offer_id` | 409 | `test_manager.py` |
| N5 | PUT профиля с чужим ИНН (не компании аккаунта) | 422, текст про ИНН | `test_profile.py` |
| N6 | Registry-lookup неизвестного ИНН | ошибка «нет в демо-реестре» | `test_profile.py` |
| N7 | Answer с файлом &gt;5 МБ или не pdf/png/jpg | 422 | `test_clarifications.py` |
| N8 | Запрос без Bearer / с протухшим токеном | 401 | `test_auth.py` |
| N9 | Скачать чужой attachment другим клиентом | 404 | `test_clarifications.py` |
| N10 | Неизвестный `product_code` при open draft | 422 | `test_products.py` |

---

## Быстрый smoke после `docker compose up --build`

1. `GET http://localhost:8080/api/health` → `{"status":"ok"}`.
2. Login `client1` / `demo` в UI.
3. Видны витрина и новости.
4. Login `manager` / `demo` → очередь открывается.
