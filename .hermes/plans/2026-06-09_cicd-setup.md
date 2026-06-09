# BBQ Station — CI/CD Setup (Coolify)

> Създаден от Hermes Agent, 09.06.2026 (обновен с CI/CD)

## Девелопмент среда

| Компонент | Prod | Dev |
|-----------|------|-----|
| **Домейн** | [bbqstation.blv.bg](https://bbqstation.blv.bg) | [dev.bbqstation.blv.bg](https://dev.bbqstation.blv.bg) |
| **Branch** | `main` | `develop` |
| **Деплой** | Ръчен (безопасност) | Автоматичен (при push) |
| **DEMO_MODE** | `false` | `true` |
| **Viber** | ✅ активен | ❌ (няма ключове) |
| **Coolify UUID** | `vm29p2flro22dxtuinhni3qq` | `yfgudm7tqitfczyzlm42lz17` |

## Workflow

```
local ──commit──▶ main ──(merge)──▶ develop ──push──▶ GitHub
                    │                      │
                    │ (ръчен деплой)        │ (auto-deploy)
                    ▼                      ▼
              bbqstation.blv.bg    dev.bbqstation.blv.bg
```

### Как се работи

```bash
cd /root/bbq-station

# 1. Работиш в develop или feature бранч
git checkout develop

# 2. Локален dev сървър (auto-reload)
npm run dev
# → http://localhost:3000

# 3. Commit + push → auto-deploy на dev
git add .
git commit -m "feat: ..."
git push origin develop
# → https://dev.bbqstation.blv.bg се обновява автоматично

# 4. Когато си готов за продукция
git checkout main
git merge develop
git push origin main
# → РЪЧНО деплойваш от Coolify UI или API:
#    curl -X POST https://coolify.blv.bg/api/v1/applications/vm29p2flro22dxtuinhni3qq/restart
```

## Важни бележки

### git_repository в Coolify
**Трябва да е `owner/repo` (къса форма), НЕ пълен URL!**
Coolify сам добавя `https://github.com/` пред нея. Пълен URL води до:
```
https://github.com/https://github.com/owner/repo  →  build FAIL
```

### Env vars разлики между prod и dev
- `DEMO_MODE`: true в dev, false в prod
- `PUBLIC_URL`: https://dev.bbqstation.blv.bg / https://bbqstation.blv.bg
- `NODE_ENV`: development / production
- Infobip ключове: само в prod

### Health checks
Dockerfile HEALTHCHECK използва `node -e "fetch(...)"` (няма нужда от curl в Alpine).

### Локален dev
```bash
npm run dev        # Node 22 --watch, auto-reload
npm run dev:debug  # с --inspect за debug
```

## Свързани файлове
- Dev среда: `.hermes/plans/2026-06-09_dev-env-setup.md`
- Архитектура: `docs/ARCHITECTURE.md`
- Coolify референция: `.hermes/skills/coolify/references/bbq-station.md`
