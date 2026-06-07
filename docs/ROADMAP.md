# Roadmap

## MVP (текущо) ✅

- [x] Меню с категории, модификатори, гарнитури
- [x] Кошница и checkout
- [x] Проследяване на статус (`?track=`)
- [x] Viber известия (Infobip)
- [x] Админ: продукти, снимки, поръчки
- [x] Персистентност: orders, menu, images на volume
- [x] Docker + Coolify деплой
- [x] Admin API ключ, DEMO_MODE

## v1.1 — Продукционна твърдина

- [ ] Реална интеграция с **Янак API** (`getStocks`, `createOrder`, статус)
- [ ] UUID tracking token вместо 5-цифрен `docID`
- [ ] Server-only Viber (премахни client `/api/send-viber`)
- [ ] Rate limiting на публични endpoints
- [ ] CSP + security headers
- [ ] Пълно HTML escaping навсякъде
- [ ] Автоматичен deploy webhook в Coolify

## v1.2 — Операции

- [ ] Резервно копие на `/data`
- [ ] Експорт на поръчки (CSV/JSON)
- [ ] Роли: кухня vs меню-редактор
- [ ] PWA + „Добави на началния екран“

## v2 — Разширения

- [ ] Плащане онлайн
- [ ] Доставка (не само takeaway)
- [ ] Многоезичност
- [ ] Split frontend на модули / framework
