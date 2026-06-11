# BBQ Station — AI Deployment Guide

> За AI агенти (Hermes, Claude, etc.). Кратък, изпълним, без излишни обяснения.

---

## 1. Git Workflow

```
develop  →  feature branches, auto-deploy to DEV
main     →  manual merge from develop, manual deploy to PROD
```

**Правило:** Никога не пипай `main` директно. Всичко минава през `develop` → тестване → merge → push → deploy PROD.

---

## 2. Push to GitHub

### 2.1 Unlock Bitwarden (ако няма BW_SESSION)

```bash
bw unlock '9-.$JsZ5#Vt5Xd_' 2>&1
# export BW_SESSION="..."
```

> Паролата е в единични кавички ЗАДЪЛЖИТЕЛНО — съдържа `$` и `#`.

### 2.2 Get GitHub token

```bash
export BW_SESSION="..."
TOKEN=$(bw get notes "GITHUB_TOKEN")
```

### 2.3 Push

```bash
cd /root/bbq-station
git push "https://soulkeeper131:${TOKEN}@github.com/soulkeeper131/bbq-station.git" develop
```

> **Pitfall:** `${TOKEN}` в URL — НЕ `$(bw get notes ...)` inline. Hermes redact-ва credential variable names.

---

## 3. Deploy to DEV

### Автоматично (предпочитан път)

Push към `develop` би трябвало да trigger-не auto-deploy. **Но НЕ разчитай на това** — често не сработва.

### Ръчно (винаги работи)

```bash
python3 << 'PYEOF'
import urllib.request, json

with open('/root/.hermes/state/coolify_api_key') as f:
    api_key = f.read().strip()

req = urllib.request.Request(
    "https://coolify.blv.bg/api/v1/deploy",
    data=json.dumps({"uuid": "yfgudm7tqitfczyzlm42lz17"}).encode(),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    method="POST"
)
with urllib.request.urlopen(req, timeout=10) as resp:
    print(resp.read().decode())
PYEOF
```

### Проверка

```bash
# Изчакай 60-90 секунди за build + container restart
sleep 90
curl -sS https://dev.bbqstation.blv.bg/healthz | python3 -m json.tool
```

Очакван отговор: `"ok": true`, `"demoMode": true`

---

## 4. Deploy to PROD

> **Правило:** PROD се деплойва САМО когато DEV е проверен и работи.

### 4.1 Merge develop → main

```bash
cd /root/bbq-station
git checkout main
git pull origin main
git merge develop
git push "https://soulkeeper131:${TOKEN}@github.com/soulkeeper131/bbq-station.git" main
git checkout develop
```

### 4.2 Deploy via Coolify API

```bash
python3 << 'PYEOF'
import urllib.request, json

with open('/root/.hermes/state/coolify_api_key') as f:
    api_key = f.read().strip()

req = urllib.request.Request(
    "https://coolify.blv.bg/api/v1/deploy",
    data=json.dumps({"uuid": "vm29p2flro22dxtuinhni3qq"}).encode(),
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    },
    method="POST"
)
with urllib.request.urlopen(req, timeout=10) as resp:
    print(resp.read().decode())
PYEOF
```

### 4.3 Проверка

```bash
sleep 90
curl -sS https://bbqstation.blv.bg/healthz | python3 -m json.tool
```

Очакван отговор: `"ok": true`, `"demoMode": false`

---

## 5. Smoke Tests (DEV + PROD)

```bash
cd /root/bbq-station
bash smoke-test.sh dev.bbqstation.blv.bg
bash smoke-test.sh bbqstation.blv.bg
```

14 проверки. Всички трябва да са `✅`.

---

## 6. Reference

| Нещо | Стойност |
|------|----------|
| **Repo** | `soulkeeper131/bbq-station` |
| **DEV branch** | `develop` |
| **PROD branch** | `main` |
| **DEV URL** | `https://dev.bbqstation.blv.bg` |
| **PROD URL** | `https://bbqstation.blv.bg` |
| **DEV Coolify UUID** | `yfgudm7tqitfczyzlm42lz17` |
| **PROD Coolify UUID** | `vm29p2flro22dxtuinhni3qq` |
| **Coolify API** | `https://coolify.blv.bg/api/v1` |
| **Coolify API key** | `/root/.hermes/state/coolify_api_key` |
| **GitHub token** | Bitwarden → `GITHUB_TOKEN` |
| **BW password** | `9-.$JsZ5#Vt5Xd_` (единични кавички!) |
| **BW server** | `vault.bitwarden.eu` |
| **BW user** | `vladimir.jotov@gmail.com` |
| **Local dir** | `/root/bbq-station/` |
| **Smoke test** | `/root/bbq-station/smoke-test.sh` |

---

## 7. Pitfalls

| Pitfall | Fix |
|---------|-----|
| **BW locked** | `bw unlock '9-.$JsZ5#Vt5Xd_'` — единични кавички |
| **Git push fail (auth)** | Използвай `https://soulkeeper131:${TOKEN}@github.com/...` |
| **Auto-deploy не trigger-ва** | Ръчен deploy: `POST /api/v1/deploy {"uuid":"..."}` |
| **`/applications/{uuid}/deploy` → 404** | Правилният endpoint е `POST /deploy` с body |
| **`running:unknown`** | Health check изключен → `PATCH` с `health_check_enabled: true` |
| **DEV env vars shadow new defaults** | Ако смениш default в кода, провери Coolify env vars |
| **Dockerfile build fail** | Провери дали `public/` съществува, `curl` е в `apk add` |
| **Hermes redact-ва inline credentials** | Ползвай Python heredoc (`<< 'PYEOF'`) или `${VAR}` interpolation |
| **Patch tool double-escape** | След patch на HTML, провери за `\\\"` → `\"` |
| **Deploy не се вижда веднага** | 60-120s build + container restart. Провери с `/healthz` |
