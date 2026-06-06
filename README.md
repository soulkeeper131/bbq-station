# BBQ Station

Уеб приложение за **поръчки за вземане** от грил-ресторант. Клиентът разглежда меню,
сглобява поръчка с гарнитури и добавки, оставя име и телефон, и проследява статуса.
При смяна на статус се изпраща **Viber известие** (през Infobip).

Towa е работещ прототип: менюто и потокът на поръчката са пълни, а данните засега
идват от mock слой, оформен като реалния API на **Янак** (`api.eyanak.com`).

---

## Какво е направено до момента

### Архитектура
Приложението е **single-file frontend** (`menu-prototip_8.html`) — HTML, CSS и
vanilla JS в един файл, без build стъпка — сервиран от лек Node HTTP сървър
(`local-server.mjs`), който освен това действа като **proxy към Viber**, за да не
излиза API ключът на клиента.

```
Браузър ── GET / ─────────────▶ local-server.mjs ──▶ menu-prototip_8.html
Браузър ── POST /api/send-viber ─▶ local-server.mjs ──▶ Infobip Viber API
```

### Функционалност
- **Режим Клиент** — категории (Скара, Салати, Напитки, Бира, Добавки), карти на ястия,
  модал за избор на `modifiers` (гарнитури/добавки с доплащане `delta`), кошница.
- **Поръчка и проследяване** — име + телефон, създаване на поръчка, статус-стъпки
  (получена → приготвя се → готова за вземане) с авто-симулация за демо.
- **Режим Администрация** — управление на продукти и модификатори.
- **Известия** — toast в UI + реален Viber към телефона на клиента при смяна на статус.

### Слой данни (`YanakAPI`)
Имитира реалните endpoint-и на Янак: `getGroups`, `getStocks`, `createOrder`.
Идеята е тялото им да се замени с реален `fetch()`, без UI да се пипа.
Полето `modifiers` (комбинации) се управлява **от наша страна** и при поръчка се
превръща в редове/бележка към ордера. Поръчките се пазят локално в `localStorage`.

---

## Файлове

| Файл | Роля |
|------|------|
| `menu-prototip_8.html` | Цялото frontend приложение (UI + логика) |
| `local-server.mjs` | HTTP сървър: сервира менюто, health check, Viber proxy |
| `test-viber.mjs` | Изолиран тест за изпращане на Viber съобщение |
| `Dockerfile` | Контейнер за деплой (Coolify) |
| `package.json` | Скриптове `start` / `test:viber` |
| `secrets.local.json.example` | Шаблон за локални тайни |

---

## Конфигурация (environment променливи)

Сървърът чете конфигурацията **по приоритет**: първо env променливи (продукция),
после `secrets.local.json` (локална разработка).

| Променлива | Описание | Пример |
|------------|----------|--------|
| `INFOBIP_BASE_URL` | Base host от Infobip | `xxxxx.api.infobip.com` |
| `INFOBIP_API_KEY` | App ключът от Infobip | `App ...` (само стойността) |
| `INFOBIP_SENDER` | Одобрен подател (trial: `IBSelfServe`) | `IBSelfServe` |
| `PORT` | Порт за слушане (Coolify го подава) | `3000` |
| `MENU_FILE` | Име на HTML файла | `menu-prototip_8.html` |

> Менюто работи и без Viber конфигурация — тогава реални съобщения просто не се пращат
> (`/api/send-viber` връща `503`), а демо toast-овете се показват нормално.

---

## Локално стартиране

```bash
# 1) (по желание) тайни за реален Viber
cp secrets.local.json.example secrets.local.json
#    после попълни ключовете

# 2) старт
npm start          # или: node local-server.mjs
# → http://localhost:3000

# тест на Viber отделно
npm run test:viber
```

---

## Деплой на Coolify

Приложението няма външни зависимости и се деплойва като Docker контейнер.

1. **Качи кода в Git** (GitHub/GitLab). Увери се, че `secrets.local.json` **не**
   е в репото (вече е в `.gitignore`).
2. В Coolify: **New Resource → Application → Public/Private Repository**.
3. **Build Pack:** `Dockerfile` (Coolify ще го засече автоматично).
4. **Port:** `3000` (стойността от `EXPOSE` / `PORT`).
5. **Environment Variables** (раздел Environment):
   ```
   INFOBIP_BASE_URL=xxxxx.api.infobip.com
   INFOBIP_API_KEY=твоят_ключ
   INFOBIP_SENDER=IBSelfServe
   ```
   `PORT` обикновено се подава от Coolify — не е нужно да го задаваш ръчно.
6. **Health check path:** `/healthz` (връща `{ "ok": true }`).
7. **Deploy.** Закачи домейн от UI; Coolify поема HTTPS-а.

### Бележки
- В Infobip **trial** режим: номерът на получателя трябва да е верифициран, а
  подателят трябва да е `IBSelfServe`.
- `Dockerfile` ползва `node:22-alpine` и копира само нужните за изпълнение файлове.

---

## Какво предстои (TODO)
- Реална интеграция с Янак API вместо mock `YanakAPI`.
- Сигурност/auth за режим Администрация.
- Сървърно (а не само локално) съхранение на поръчки и статуси.
