# Архитектура

## Преглед

```
┌─────────────┐     GET /              ┌──────────────────┐
│   Browser   │ ──────────────────────▶│  local-server    │
│  (vanilla)  │     POST /api/*        │  Node 22 HTTP    │
└─────────────┘ ◀──────────────────────│  + DATA_DIR      │
                                       └────────┬─────────┘
                                                │
                        ┌───────────────────────┼───────────────────────┐
                        ▼                       ▼                       ▼
                 orders.json            menu-overrides.json        Infobip Viber
                 product-images.json    uploads/
```

## Frontend (`menu-prototip_8.html`)

Един HTML файл (~1 700 реда): CSS + vanilla JS, без build стъпка.

| Режим | Описание |
|-------|----------|
| **Клиент** | Меню, кошница, checkout, проследяване на статус |
| **Администрация** | Продукти, модификатори, снимки, входящи поръчки |

**Състояние:** in-memory `state` + `localStorage` (`gb_orders`) за последните 10 поръчки на устройството.

**Данни за меню:** seed от `YanakAPI` mock → merge с `/api/menu-overrides` от сървъра.

## Backend (`local-server.mjs`)

Лек HTTP сървър без framework. Отговаря за:

- Сервиране на HTML
- Персистентност на volume (`DATA_DIR`)
- Viber proxy (Infobip)
- Admin API защита с `ADMIN_API_KEY`

## Поток на поръчка

1. Клиент сглобява кошница → checkout (име, телефон, час)
2. `YanakAPI.createOrder()` → mock `docID` (бъдеще: реален Янак)
3. `POST /api/orders` → запис на сървъра + welcome Viber
4. Клиент показва екран „Благодарим“ + `?track=<id>`
5. Кухнята (админ) сменя статус → `POST /api/orders` (admin) + Viber при „готова“

## Интеграция с Янак (планирана)

`YanakAPI` в клиента е thin mock със същите методи като `api.eyanak.com`:

- `getGroups()` / `getStocks()` — меню
- `createOrder(payload)` — създаване на поръчка

Замяната е само в тялото на тези функции; UI остава непокътнат.

## Деплой

Docker (`node:22-alpine`) на Coolify. Задължителен **persistent volume** на `/data`.

## Сигурност (MVP)

| Област | Статус |
|--------|--------|
| Infobip ключ на сървъра | ✅ |
| Admin write API | ✅ с `ADMIN_API_KEY` |
| Демо UI в продукция | ✅ `DEMO_MODE=false` |
| Тракинг по 5-цифрен ID | ⚠️ приемливо за MVP, смени с UUID за prod |
| `/api/send-viber` отворен | ⚠️ ограничи с rate limit / server-only в v2 |

Виж [SECURITY.md](../SECURITY.md).
