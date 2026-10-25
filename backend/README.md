# Backend

Стек: **Python 3.12 + FastAPI + SQLAlchemy 2 + SQLite** — [`docs/stack.md`](../docs/stack.md).

Контракты: [`docs/implementation/contracts.md`](../docs/implementation/contracts.md).

## Быстрый старт (Docker)

Из корня репозитория:

```bash
docker compose up --build
```

- UI: http://localhost:8080  
- Health: http://localhost:8000/api/health (или через nginx: http://localhost:8080/api/health)  
- Swagger: http://localhost:8000/api/docs  

SQLite и uploads хранятся в томе `app-data` → `/data` (`/data/app.db`, `/data/uploads`).

## Локальный запуск (без Docker)

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt -r requirements-dev.txt

# опционально: скопировать ../.env.example → ../.env и задать переменные
uvicorn app.main:app --reload --port 8000
```

По умолчанию данные: `backend/.data/app.db` и `backend/.data/uploads`.

Переменные окружения (см. [`.env.example`](../.env.example)):

| Переменная | Назначение |
| ---------- | ---------- |
| `DATA_DIR` | Каталог данных (локально `backend/.data`, в Docker `/data`) |
| `DATABASE_URL` | SQLAlchemy URL; по умолчанию SQLite в `DATA_DIR/app.db` |
| `UPLOADS_DIR` | Вложения (с T07); по умолчанию `DATA_DIR/uploads` |
| `CORS_ORIGINS` | Список origins через запятую |
| `SESSION_SECRET` | Секрет демо-сессий (T02) |

## Тесты

```bash
cd backend
pytest
```

Smoke: `GET /api/health` → `{"status": "ok"}`.  
Auth: login / bad password / me / logout / role 403.

## Демо-аккаунты (seed)

Пароль для всех: **`demo`**.

| Login | Роль | Компания (синтетика) |
| ----- | ---- | -------------------- |
| `client1` | client | ООО «Стабильный поток» |
| `client2` | client | ООО «Большой запрос» |
| `client3` | client | ООО «Средний риск» |
| `client4` | client | ООО «Не действует» |
| `client5` | client | ООО «БКИ пауза» |
| `manager` | manager | — |

Auth API: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me` (Bearer).

## Примечания

- Миграции Alembic не используем: `create_all` + идемпотентный seed при старте.
- Пароли: PBKDF2-HMAC-SHA256 (stdlib); сессии — opaque token в таблице `sessions` (не JWT).
- Бизнес-логика заявок — с T04+.
