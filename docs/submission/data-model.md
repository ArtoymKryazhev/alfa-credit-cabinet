# Модель данных

Источник: SQLAlchemy-модели в `backend/app/models/`. Миграции Alembic не используются.

---

## ER-диаграмма

```mermaid
erDiagram
  users ||--o{ sessions : has
  users ||--o| business_profiles : has
  users ||--o{ applications : owns
  applications ||--o{ application_events : log
  applications ||--o{ offers : has
  applications ||--o{ decisions : has
  applications ||--o{ check_runs : has
  applications ||--o{ risk_assessments : has
  applications ||--o{ clarifications : has
  applications ||--o{ attachments : has
  check_runs ||--o{ risk_assessments : from
  attachments ||--o| clarifications : optional

  users {
    int id PK
    string login UK
    string password_hash
    string role
    string display_name
    string company_inn
    string company_name
  }

  sessions {
    int id PK
    string token UK
    int user_id FK
    datetime expires_at
  }

  business_profiles {
    int id PK
    int user_id UK
    string inn
    string company_name
    string registration_date
    string address
    text activities
    string region
    string industry
    string company_status
    string activity_direction
    text description
    string contact_person
    string contact_phone
    string contact_email
    string completeness
  }

  applications {
    string id PK
    int client_user_id FK
    string product_code
    string status
    string current_step
    json draft_payload
    json snapshot
    int amount
    int term_months
    string purpose
  }

  application_events {
    int id PK
    string application_id FK
    int actor_user_id FK
    string from_status
    string to_status
    text message
  }

  offers {
    string id PK
    string application_id FK
    int amount
    int term_months
    float rate
    int payment
    int version
    bool active
    int created_by FK
  }

  decisions {
    int id PK
    string application_id FK
    string outcome
    json reason_codes
    text comment
    int alternative_amount
    int created_by FK
  }

  check_runs {
    int id PK
    string application_id FK
    int attempt
    json sources
    bool data_complete
  }

  risk_assessments {
    int id PK
    string application_id FK
    int check_run_id FK
    string level
    json factors
    bool data_complete
  }

  attachments {
    string id PK
    string application_id FK
    string filename
    string mime
    int size
    string path
    int uploaded_by FK
  }

  clarifications {
    int id PK
    string application_id FK
    text question
    string status
    text answer_text
    string attachment_id FK
    int created_by FK
  }
```

---

## Таблицы

| Таблица | Назначение |
| ------ | ---------- |
| `users` | Демо-аккаунты: login, PBKDF2-хеш, role (`client`/`manager`/`system`), company_* |
| `sessions` | Opaque Bearer-токены |
| `business_profiles` | Один профиль на клиента; факты реестра + редактируемые поля; `completeness` |
| `applications` | Заявка: draft → конвейер → статусы |
| `application_events` | Журнал переходов (кто, from, to, message) |
| `offers` | Предложения; активное одно (`active=true`) |
| `decisions` | Исход конвейера/менеджера; `alternative_amount` для ветки B |
| `check_runs` | Снимок источников на попытку (`attempt`) |
| `risk_assessments` | 4 фактора + `level`; связано с `check_run` |
| `clarifications` | Уточнения менеджера; ответ клиента + опциональный файл |
| `attachments` | Метаданные файла в `/data/uploads` |

---

## JSON-поля

| Поле | Содержание |
| ---- | ---------- |
| `applications.draft_payload` | Черновик wizard до submit |
| `applications.snapshot` | Снимок профиля + реестра **на момент submit**; правки профиля его не меняют |
| `check_runs.sources` | Результаты моков: registry / finance / bki / product (`ok` / `missing` / `unavailable`) |
| `risk_assessments.factors` | `payment_discipline`, `financial_stability`, `current_load`, `new_request` → `good`/`medium`/`bad`/`unknown` |
| `decisions.reason_codes` | Коды причин (`source_unavailable`, `data_incomplete`, …) |

---

## Мок-файлы (только чтение)

Каталог `backend/app/mocks/data/`:

- `registry.json` — компании по ИНН
- `finance.json` — помесячные потоки
- `bki.json` — кредитная история; у client5 на 1-й попытке `unavailable`
- `products.json` — 13 продуктов витрины
- `news.json` — новости с тегами industry/region

Синтетические seed-пользователи: `client1`…`client5`, `manager`, пароль `demo`. См. [`test-scenarios.md`](test-scenarios.md).
