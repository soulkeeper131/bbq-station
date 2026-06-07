# Changelog

Форматът следва [Keep a Changelog](https://keepachangelog.com/).

## [1.0.0] - 2026-06-07

### Added
- Admin API защита (`ADMIN_API_KEY`, `X-Admin-Key`)
- `DEMO_MODE` — скрива демо лентата в продукция
- `GET /api/config` за runtime настройки
- Welcome Viber от сървъра при нова поръчка
- Admin login gate в UI (`?admin=1`)
- Документация: `docs/`, `SECURITY.md`, `CONTRIBUTING.md`
- `docker-compose.yml`, `.env.example`, CI workflow
- MIT `LICENSE`

### Changed
- Footer интегриран в меню картата; намален долен padding
- Тракинг по номер дърпа от сървъра
- README синхронизиран с реалната архитектура

### Security
- Защитени admin endpoints при зададен `ADMIN_API_KEY`
- Лимит 8 MB на request body
- `POST /api/log` изключен при `DEMO_MODE=false`
- HTML escaping на ключови потребителски полета

## [0.1.0] - 2026-06-06

### Added
- Първоначален MVP: меню, кошница, Viber, Coolify деплой
- Персистентност orders/images/menu на volume
- Phone landscape block overlay
