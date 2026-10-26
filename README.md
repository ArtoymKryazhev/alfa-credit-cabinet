# alfa-credit-cabinet

Прототип трека «Умный кредитный кабинет предпринимателя» (хакатон Альфа-Банк).

Веб-кабинет: клиент оформляет **обычный оборотный кредит**, данные сохраняются, моки обогащают заявку, система оценивает риск и принимает решение (авто / менеджер / отказ). Клиент видит статус, отвечает на уточнения, принимает или отклоняет предложение. Менеджер работает с той же заявкой.

Репозиторий: [github.com/ArtoymKryazhev/alfa-credit-cabinet](https://github.com/ArtoymKryazhev/alfa-credit-cabinet)

Версия на сдачу: тег **`v1.0-hackathon`** (коммиты после дедлайна в эту версию не учитывать).

---

## Архитектура (кратко)

| Слой | Стек |
| ---- | ---- |
| Frontend | React 19 + Vite 8 + TypeScript + Tailwind 4, nginx в Docker |
| Backend | Python 3.12 + FastAPI + SQLAlchemy 2 + SQLite |
| Auth | Demo login, opaque Bearer-токен в БД (`sessions`) |
| Данные | Том Docker `app-data` → `/data/app.db`, `/data/uploads` |
| Внешние системы | Только JSON-моки (реестр, финансы, БКИ, продукты, новости) |

Подробнее: [`docs/submission/architecture.md`](docs/submission/architecture.md), диаграмма состояний — [`docs/submission/state-diagram.md`](docs/submission/state-diagram.md), модель данных — [`docs/submission/data-model.md`](docs/submission/data-model.md).

```text
Browser → nginx :8080 (SPA + proxy /api/) → FastAPI :8000 → SQLite + uploads
```

---

## Требования

- Docker + Docker Compose
- (Опционально, локальная разработка) Node.js 22+, Python 3.12+, npm

---

## Быстрый старт (Docker)

```bash
docker compose up --build
```

| Что | URL |
| --- | --- |
| UI | http://localhost:8080 |
| Health | http://localhost:8080/api/health |
| Swagger | http://localhost:8000/api/docs (или через nginx `/api/docs`) |
| OpenAPI JSON | http://localhost:8000/api/openapi.json |

Остановка: `Ctrl+C` / `docker compose down`. Данные в томе `app-data` сохраняются.

---

## Локальный запуск (без Docker)

### Backend

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt -c requirements.lock
pip install -r requirements-dev.txt   # для pytest
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Vite проксирует `/api` на `:8000`. UI: http://localhost:5173.

---

## Переменные окружения

См. `.env.example`. Compose задаёт значения для контейнера backend.

| Переменная | Назначение | По умолчанию |
| ---------- | ---------- | ------------ |
| `DATA_DIR` | Каталог данных | `backend/.data` / в Docker `/data` |
| `DATABASE_URL` | SQLAlchemy URL | SQLite в `DATA_DIR/app.db` |
| `UPLOADS_DIR` | Вложения уточнений | `DATA_DIR/uploads` |
| `CORS_ORIGINS` | Разрешённые origins | localhost:5173 и :8080 |
| `SESSION_SECRET` | Секрет демо-сессий | `dev-session-secret-change-me` |

---

## Демо-аккаунты

Пароль для всех: **`demo`**.

| Login | Роль | ИНН | Компания / сценарий |
| ----- | ---- | --- | ------------------- |
| `client1` | client | `7701000001` | A — ООО «Стабильный поток» → **авто-предложение** |
| `client2` | client | `7701000002` | B — ООО «Большой запрос» → **manual_review + альтернатива** |
| `client3` | client | `7701000003` | C — ООО «Средний риск» → **manual_review** (уточнения) |
| `client4` | client | `7701000004` | D — ООО «Не действует» → **авто-отказ** |
| `client5` | client | `7701000005` | E — ООО «БКИ пауза» → **manual_review**, recheck успешен |
| `manager` | manager | — | Очередь и действия менеджера |

Seed профилей: client1/client3 filled; client2 partial; client4/client5 empty до первого заполнения (для D/E в «Мой бизнес» указать ИНН из таблицы → registry-lookup).

Подробные шаги: [`docs/submission/test-scenarios.md`](docs/submission/test-scenarios.md).

---

## Сценарий проверки (рекомендуемый)

1. `docker compose up --build` → открыть http://localhost:8080.
2. **A:** войти `client1` / `demo` → оформить «Кредит для бизнеса» → submit → принять оффер.
3. **B:** `client2` → высокая сумма → submit → войти `manager` → предложить меньшую сумму → клиент принимает/отклоняет.
4. **C:** `client3` → submit → менеджер запрашивает уточнение → клиент отвечает (можно с файлом pdf/png/jpg ≤5 МБ).
5. **D:** `client4` → профиль с ИНН `7701000004` → submit → отказ.
6. **E:** `client5` → профиль с ИНН `7701000005` → submit → менеджер «Повторить проверку».
7. На `/app` у клиента с профилем проверить **персонализированные новости**.
8. Обновить страницу / перезапустить compose — черновики и заявки на месте (том).

---

## Тесты

```bash
cd backend
pytest
```

Lock-файлы версий:

- Frontend: [`frontend/package-lock.json`](frontend/package-lock.json)
- Backend: [`backend/requirements.lock`](backend/requirements.lock) (+ pinned [`backend/requirements.txt`](backend/requirements.txt))

---

## Комплект сдачи

| Артефакт | Путь |
| -------- | ---- |
| README (этот файл) | [`README.md`](README.md) |
| THIRD_PARTY_NOTICES | [`THIRD_PARTY_NOTICES`](THIRD_PARTY_NOTICES) |
| Допущения | [`docs/submission/assumptions.md`](docs/submission/assumptions.md) |
| Архитектура + описание API | [`docs/submission/architecture.md`](docs/submission/architecture.md) |
| Модель данных | [`docs/submission/data-model.md`](docs/submission/data-model.md) |
| Диаграмма состояний | [`docs/submission/state-diagram.md`](docs/submission/state-diagram.md) |
| OpenAPI | [`docs/submission/openapi.json`](docs/submission/openapi.json) |
| Коллекция Postman | [`docs/submission/postman_collection.json`](docs/submission/postman_collection.json) |
| Тестовые сценарии | [`docs/submission/test-scenarios.md`](docs/submission/test-scenarios.md) |
| Docker Compose | [`docker-compose.yml`](docker-compose.yml) |
| Синтетика / seed | `backend/app/seed.py`, `backend/app/mocks/data/` |

Живой Swagger после запуска: `/api/docs`.

---

## Структура репозитория

```text
frontend/           # React SPA + nginx image
backend/            # FastAPI app, mocks, tests
docs/submission/    # Артефакты сдачи жюри (отслеживаются git)
docker-compose.yml
README.md
THIRD_PARTY_NOTICES
```

Внутренние материалы агента (`docs/implementation/`, `.cursor/` и т.п.) в gitignore и **не** входят в сдачу жюри.
