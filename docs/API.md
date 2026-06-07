# HTTP API

Base URL: същият хост като приложението (напр. `https://bbqstation.blv.bg`).

## Публични

| Method | Path | Описание |
|--------|------|----------|
| `GET` | `/` | HTML приложението |
| `GET` | `/healthz` | Health check `{ ok, viber, demoMode, adminRequired }` |
| `GET` | `/api/config` | Runtime конфиг `{ demoMode, adminRequired }` |
| `GET` | `/api/orders/:id` | Една поръчка по номер (тракинг) |
| `POST` | `/api/orders` | **Създаване** на нова поръчка (без admin ключ) |
| `GET` | `/api/menu-overrides` | Текущи промени по менюто |
| `GET` | `/api/product-images` | Индекс продукт → URL на снимка |
| `GET` | `/uploads/:file` | Статична продуктова снимка |

### Създаване на поръчка

```http
POST /api/orders
Content-Type: application/json

{
  "docID": 12345,
  "name": "Иван",
  "phone": "+359888123456",
  "time": "asap",
  "status": 1,
  "lines": [...],
  "total": 16.90,
  "notifs": []
}
```

При **нова** поръчка (`status: 1`) сървърът автоматично изпраща Viber welcome (ако Infobip е конфигуриран).

## Защитени (изискват `X-Admin-Key` или `Authorization: Bearer`)

Задължителни когато `ADMIN_API_KEY` е зададен в средата.

| Method | Path | Описание |
|--------|------|----------|
| `GET` | `/api/orders` | Всички поръчки (кухня) |
| `POST` | `/api/orders` | **Обновяване** на съществуваща поръчка |
| `POST` | `/api/menu-overrides` | Запис на промени по менюто |
| `POST` | `/api/product-image` | Качване/премахване на снимка |

```http
X-Admin-Key: your-admin-api-key
```

## Viber proxy

```http
POST /api/send-viber
Content-Type: application/json

{ "to": "359888123456", "text": "..." }
```

Използва се от кухнята при смяна на статус (готова за вземане). Infobip ключът **никога** не излиза в браузъра.

## Логване (само при `DEMO_MODE=true`)

```http
POST /api/log
{ "tag": "order:created", "data": { ... } }
```

В продукция (`DEMO_MODE=false`) endpoint-ът връща `204` без запис.
