# Security Policy

## Поддръжка

За уязвимости: **security@blv.bg** или issue в GitHub (без публично споделяне на експлойти).

## Известни ограничения (MVP)

| Риск | Митигация | План |
|------|-----------|------|
| Тракинг по 5-цифрен номер | Линкът идва от Viber | UUID token в v1.1 |
| `/api/send-viber` без auth | Само за статус „готова“ от админ с ключ | Server-only в v1.1 |
| Admin ключ в sessionStorage | Приемливо за вътрешна кухня | HttpOnly cookie / SSO |
| XSS в някои admin полета | `esc()` на клиентски изгледи | Пълно escaping |

## Препоръки за продукция

```env
DEMO_MODE=false
ADMIN_API_KEY=<64+ random chars>
PUBLIC_URL=https://your-domain.bg
```

- Админ панел: `https://your-domain.bg/?admin=1` — не публикувай линка
- Coolify volume на `/data` — backup периодично
- Infobip ключ **само** в environment, никога в Git

## Admin API

Защитени endpoints при зададен `ADMIN_API_KEY`:

- `GET /api/orders`
- `POST /api/orders` (обновяване)
- `POST /api/menu-overrides`
- `POST /api/product-image`

Header: `X-Admin-Key: <ADMIN_API_KEY>`

Създаването на **нова** поръчка остава публично (необходимо за клиенти).
