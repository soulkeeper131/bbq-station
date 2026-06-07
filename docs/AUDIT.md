# Одит — MVP readiness (юни 2026)

## Резюме

| Област | Оценка | Бележка |
|--------|--------|---------|
| Клиентски поток | ✅ Готов | Меню → поръчка → статус |
| Кухня / админ | ✅ С ключ | `ADMIN_API_KEY` + `?admin=1` |
| Данни | ✅ Volume | orders, menu, images |
| Viber | ✅ Работи | Welcome от сървъра; готова — от админ |
| Документация | ✅ Обновена | README, API, ARCHITECTURE |
| Сигурност | ⚠️ MVP | Виж SECURITY.md |

## Поправено в този одит

1. **Admin API защита** — `ADMIN_API_KEY` за list/update orders, menu, images
2. **DEMO_MODE** — скрива демо лентата в продукция
3. **Welcome Viber от сървъра** — при нова поръчка
4. **Лимит на body** — 8 MB
5. **Тракинг** — ръчно търсене дърпа от сървъра
6. **XSS** — `esc()` на ключови потребителски полета
7. **Документация** — синхронизирана с кода
8. **CI** — smoke test на push
9. **docker-compose** — локален parity с Coolify

## Остава за v1.1 (не блокира вътрешен MVP)

- Янак API вместо mock
- UUID tracking tokens
- Rate limiting
- Пълно server-side notifications
- Rename `menu-prototip_8.html` → `index.html`

## Production checklist (Coolify)

- [ ] `DEMO_MODE=false`
- [ ] `ADMIN_API_KEY` — дълъг случаен низ
- [ ] `PUBLIC_URL=https://bbqstation.blv.bg`
- [ ] Volume mount на `/data`
- [ ] `INFOBIP_*` env vars
- [ ] Ръчен deploy или webhook след push
