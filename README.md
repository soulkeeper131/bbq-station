# BBQ Station

[![CI](https://github.com/soulkeeper131/bbq-station/actions/workflows/ci.yml/badge.svg)](https://github.com/soulkeeper131/bbq-station/actions/workflows/ci.yml)

Уеб приложение за **поръчки за вземане** от грил ресторант. Клиентът разглежда меню, сглобява поръчка с гарнитури и добавки, оставя име и телефон, и проследява статуса. При ключови стъпки се изпраща **Viber известие** (Infobip).

**Production:** [bbqstation.blv.bg](https://bbqstation.blv.bg)

---

## Характеристики (MVP)

| Област | Статус |
|--------|--------|
| Меню с категории и модификатори | ✅ |
| Кошница + checkout | ✅ |
| Проследяване `?track=<номер>` | ✅ |
| Viber (приета / готова) | ✅ |
| Админ: продукти, снимки, поръчки | ✅ |
| Персистентност на volume | ✅ |
| Docker / Coolify | ✅ |
| Янак POS интеграция | 🔜 mock |

---

## Архитектура (накратко)

```
Browser ── GET / ──────────────▶ local-server.mjs ──▶ menu-prototip_8.html
Browser ── POST /api/orders ───▶ local-server.mjs ──▶ orders.json (volume)
Browser ── POST /api/send-viber ▶ local-server.mjs ──▶ Infobip Viber API
```

- **Frontend:** един HTML файл, vanilla JS, без build
- **Backend:** Node 22 HTTP, без npm dependencies в prod
- **Данни:** seed mock (`YanakAPI`) + server overrides/images/orders

Подробно: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · API: [docs/API.md](docs/API.md)

---

## Бърз старт

```bash
git clone https://github.com/soulkeeper131/bbq-station.git
cd bbq-station
cp .env.example .env   # или secrets.local.json.example → secrets.local.json

npm start
# → http://localhost:3000
```

**Docker (с volume):**

```bash
docker compose up --build
```

**Viber тест:**

```bash
npm run test:viber
```

---

## Конфигурация

| Променлива | Описание |
|------------|----------|
| `INFOBIP_BASE_URL` | Infobip host |
| `INFOBIP_API_KEY` | App ключ |
| `INFOBIP_SENDER` | Подател (trial: `IBSelfServe`) |
| `PUBLIC_URL` | Публичен домейн за тракинг линкове |
| `DATA_DIR` | Volume път (`/data` в Docker) |
| `DEMO_MODE` | `false` в продукция — скрива демо лентата |
| `ADMIN_API_KEY` | Ключ за админ API и кухня |
| `PORT` | Порт (по подразбиране 3000) |

Пълен списък: [.env.example](.env.example)

### Продукция (Coolify)

1. Volume mount → `/data`
2. Env: `DEMO_MODE=false`, `ADMIN_API_KEY`, `PUBLIC_URL`, `INFOBIP_*`
3. Health check: `/healthz`
4. Админ: `https://your-domain/?admin=1` + admin ключ
5. Deploy след push (ръчно или webhook)

---

## Файлове

| Файл | Роля |
|------|------|
| `menu-prototip_8.html` | Frontend (UI + логика) |
| `local-server.mjs` | HTTP сървър + API + Viber |
| `test-viber.mjs` | Изолиран Viber тест |
| `Dockerfile` | Production контейнер |
| `docker-compose.yml` | Локален dev с volume |
| `docs/` | Архитектура, API, roadmap, одит |

---

## Roadmap

Виж [docs/ROADMAP.md](docs/ROADMAP.md) — следваща стъпка: **реална Янак интеграция**.

---

## Лиценз

[MIT](LICENSE) · Разработено от [BLV Systems](https://blv.bg)
