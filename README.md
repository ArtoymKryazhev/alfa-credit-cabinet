# alfa-credit-cabinet

Прототип трека «Умный кредитный кабинет предпринимателя» (хакатон Альфа-Банк).

Цифровой кредитный конвейер для малого и микробизнеса: клиентский путь в кабинете + внутренняя обработка заявки в едином продукте.

## Быстрый старт (frontend)

Backend пока не выбран. Сейчас поднимается только веб-клиент:

```bash
cd frontend
npm install
npm run dev
```

Сборка:

```bash
cd frontend
npm run build
```

После старта: `/login` (имитация входа) → редирект на `/app` (рабочая область).

## Документация

В GitHub уходит код + этот README. Локально (в `.gitignore`, не в коммитах):

- `docs/` — канон для агента (brief, constraints, decisions…)
- `.cursor/` — rules и commands
- `AGENTS.md`, `current_status.md`

К сдаче жюри отдельные артефакты (схемы, OpenAPI) добавим в отслеживаемый путь, например `docs/submission/`.

## Assumptions / TBD

- **Backend / БД / Docker Compose** — не зафиксированы.
- **Auth** — сейчас тупой редирект с `/login`; demo-login — после решения команды.
- **Границы e2e MVP** — не зафиксированы.
- **Git** — инициализируется отдельно.

## Структура

```text
frontend/   # React + Vite + TypeScript + Tailwind  (в git)
backend/    # stub (стек TBD)                      (в git)
docs/       # канон агента                         (локально)
.cursor/    # rules и commands                     (локально)
```
