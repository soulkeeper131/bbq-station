# BBQ Station — Dev Environment Setup

> Създадена от Hermes Agent, 09.06.2026

## Създадени/променени файлове

| Файл | Действие |
|------|----------|
| `.env` | Създаден — dev конфигурация (DEMO_MODE=true, локално DATA_DIR) |
| `package.json` | Обновен — добавени `dev` и `dev:debug` скриптове |
| `.vscode/launch.json` | Създаден — VS Code debug конфигурации |
| `data/uploads/` | Създадена — локално хранилище |

## Как се ползва

```bash
cd /root/bbq-station

# Dev с auto-reload (Node 22 built-in --watch)
npm run dev

# С debug инспектор
npm run dev:debug

# Само проверка на синтаксис
npm run check

# Viber тест (ако има Infobip ключове)
npm run test:viber
```

Сървърът слуша на `http://localhost:3000`.

## Health check

```bash
curl http://localhost:3000/healthz
# {"ok":true,"viber":false,"demoMode":true,"adminRequired":false}
```

- `viber:false` — Infobip не е конфигуриран локално (нормално)
- `demoMode:true` — демо лентата е видима, улеснява разработка
- `adminRequired:false` — админ достъп без ключ в demo режим

## Как работи hot-reload

Node 22+ има вграден `--watch` флаг. Следи `local-server.mjs` и всички import-нати файлове. При промяна рестартира автоматично. **Не е нужен nodemon.**

## Конфигурация

### `.env` (локален dev)
```
DEMO_MODE=true
PORT=3000
NODE_ENV=development
DATA_DIR=./data
PUBLIC_URL=http://localhost:3000
ADMIN_API_KEY=dev-se...-123
INFOBIP_BASE_URL=
INFOBIP_API_KEY=***
```

### VS Code Debug
Две конфигурации в `.vscode/launch.json`:
1. **🚀 BBQ Station (watch)** — стартира с `--watch`, auto-reload при промени
2. **🐛 BBQ Station (debug)** — `--inspect` без watch, за breakpoints

## Архитектура (напомняне)

```
Browser (vanilla) → local-server.mjs (Node 22 HTTP)
                    ├── orders.json
                    ├── menu-overrides.json
                    ├── uploads/
                    └── Infobip Viber (disabled в dev)
```

## Свързани ресурси

- **Продукция:** https://bbqstation.blv.bg (Coolify)
- **Dev:** https://dev.bbqstation.blv.bg (Coolify)
- **Репозитори:** https://github.com/soulkeeper131/bbq-station
- **Архитектура:** `docs/ARCHITECTURE.md`
