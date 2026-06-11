# BBQ Station — CI/CD

## Преглед

- **DEV:** `develop` branch → auto-deploy на `dev.bbqstation.blv.bg`
- **PROD:** `main` branch → manual deploy на `bbqstation.blv.bg`
- **Платформа:** Coolify (self-hosted Docker PaaS)
- **Health check:** `/healthz` (Coolify ползва за zero-downtime deploy)
- **Smoke test:** `bash smoke-test.sh [BASE_URL]`

## Workflow

```
feature branch → develop → auto-deploy DEV → тест → merge main → manual deploy PROD
```

## Deploy команди (чрез Coolify API)

```bash
# DEV (auto-deploy enabled, но може manual trigger)
curl -X POST https://coolify.blv.bg/api/v1/deploy \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"yfgudm7tqitfczyzlm42lz17"}'

# PROD (manual only)
curl -X POST https://coolify.blv.bg/api/v1/deploy \
  -H "Authorization: Bearer $COOLIFY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"vm29p2flro22dxtuinhni3qq"}'
```

## Проверка след деплой

```bash
# Health + metrics
curl -s https://dev.bbqstation.blv.bg/healthz | jq .
curl -s https://dev.bbqstation.blv.bg/api/metrics | jq .

# Smoke test
bash smoke-test.sh https://dev.bbqstation.blv.bg
```

## Environment променливи

| Key | DEV | PROD |
|-----|-----|------|
| `DEMO_MODE` | `true` | `false` |
| `ADMIN_API_KEY` | `dev-***` | `prod-***` |
| `DATA_DIR` | `/data/` | `/data/` |
| `PUBLIC_URL` | `https://dev.bbqstation.blv.bg` | `https://bbqstation.blv.bg` |

## Мониторинг

- **Uptime Kuma:** `https://uptime.blv.bg` → HTTP(s) monitor на `/api/metrics`
- **Admin dashboard:** `/admin` (изисква admin key)
- **Backup:** автоматичен на всеки час + ръчен чрез `/api/admin/backup`
