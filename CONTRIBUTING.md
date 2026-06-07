# Contributing

## Локална разработка

```bash
cp .env.example .env
# Попълни .env или secrets.local.json

npm start
# → http://localhost:3000
```

С volume (като продукция):

```bash
docker compose up --build
```

## Структура

| Файл | Променяй когато |
|------|-----------------|
| `menu-prototip_8.html` | UI, клиентска логика |
| `local-server.mjs` | API, персистентност, Viber |
| `docs/` | Документация при промяна на поведение |

## Правила

1. **Без тайни в Git** — `.env`, `secrets.local.json`
2. **Минимален diff** — не рефакторирай несвързан код
3. **Документирай API промени** в `docs/API.md`
4. **Тествай** — `npm start` + smoke на healthz
5. Commit съобщения на английски, императив: `fix:`, `feat:`, `docs:`

## Pull requests

- Опиши какво и защо
- Test plan: стъпки за ръчна проверка
- CI трябва да мине (syntax + healthz)

## Coolify deploy

Coolify няма auto-deploy по подразбиране — след merge в `main` пусни deploy от dashboard или API.
