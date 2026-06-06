// local-server.mjs — пуска целия апп: менюто + реалния Viber (Infobip).
// Изисква Node 18+.
//
// Конфигурация (по приоритет):
//   1) Environment променливи (за Coolify / продукция):
//        INFOBIP_BASE_URL   напр. xxxxx.api.infobip.com
//        INFOBIP_API_KEY    App ключът от Infobip
//        INFOBIP_SENDER     одобреният подател (в trial: IBSelfServe)
//        PORT               порт за слушане (Coolify го подава автоматично)
//        MENU_FILE          име на HTML файла (по подразбиране menu-prototip_8.html)
//   2) secrets.local.json в същата папка (за локална разработка)
//
// Локално стартиране:  node local-server.mjs  →  http://localhost:3000

import { createServer } from "node:http";
import { readFile, readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, normalize } from "node:path";

function loadConfig() {
  let fileCfg = {};
  try {
    fileCfg = JSON.parse(readFileSync(new URL("./secrets.local.json", import.meta.url)));
  } catch {
    // Няма локален файл — разчитаме изцяло на env (нормално в Coolify).
  }
  return {
    baseUrl: process.env.INFOBIP_BASE_URL || fileCfg.baseUrl || "",
    apiKey: process.env.INFOBIP_API_KEY || fileCfg.apiKey || "",
    sender: process.env.INFOBIP_SENDER || fileCfg.sender || "",
    // Публичният адрес на сайта — за да са верни тракинг линковете във Viber,
    // независимо откъде се управлява поръчката (напр. localhost).
    publicUrl: (process.env.PUBLIC_URL || fileCfg.publicUrl || "").replace(/\/+$/, ""),
  };
}

const cfg = loadConfig();
const PORT = Number(process.env.PORT) || 3000;
const MENU_FILE = process.env.MENU_FILE || "menu-prototip_8.html";
const HTML = new URL(`./${MENU_FILE}`, import.meta.url);
const viberReady = Boolean(cfg.baseUrl && cfg.apiKey && cfg.sender);

// ── Логинг ──────────────────────────────────────────────────────
// Единен timeline в терминала. ВНИМАНИЕ: API ключът НИКОГА не се логва.
const ts = () => {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
};
const log = (tag, ...rest) => console.log(`${ts()} ${tag}`, ...rest);

function readBody(req) {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => resolve(body));
  });
}

// Сървърно хранилище на поръчки (в паметта) — за да работи тракинг линкът
// от друго устройство. Бел.: при рестарт/предеплой данните се губят (няма БД/volume).
const orders = new Map();

// ── Снимки на продуктите ────────────────────────────────────────
// Пазят се на диск в DATA_DIR (в Coolify → постоянен volume), за да ги
// виждат всички клиенти и да оцеляват след предеплой.
const DATA_DIR = process.env.DATA_DIR || new URL("./data/", import.meta.url).pathname;
const UPLOAD_DIR = join(DATA_DIR, "uploads");
const IMAGES_JSON = join(DATA_DIR, "product-images.json");
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

let productImages = {}; // { [productId]: "/uploads/pXX.jpg" }
try {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  if (existsSync(IMAGES_JSON)) productImages = JSON.parse(readFileSync(IMAGES_JSON, "utf8")) || {};
} catch (e) {
  console.warn("⚠️  Хранилището за снимки не е достъпно:", String(e));
}
const saveImagesIndex = () => {
  try { writeFileSync(IMAGES_JSON, JSON.stringify(productImages)); }
  catch (e) { console.warn("⚠️  Грешка при запис на индекса със снимки:", String(e)); }
};

log("[boot]", `Viber ${viberReady ? "конфигуриран ✓" : "НЕ е конфигуриран ✗"} | sender=${cfg.sender || "—"} | host=${cfg.baseUrl || "—"}`);
log("[boot]", `Снимки: ${Object.keys(productImages).length} в ${DATA_DIR}`);
log("[boot]", `Публичен адрес за линкове: ${cfg.publicUrl || "— (ползва се origin-ът на клиента)"}`);
if (!viberReady) {
  console.warn("⚠️  Viber не е конфигуриран (липсват INFOBIP_* / secrets.local.json). " +
    "Менюто ще работи, но реални съобщения няма да се пращат.");
}

const server = createServer(async (req, res) => {
  // Health check за Coolify / load balancer.
  if (req.method === "GET" && (req.url === "/healthz" || req.url === "/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ ok: true, viber: viberReady }));
  }

  // Клиентски събития → единен лог в терминала (поръчки, смяна на статус и т.н.).
  if (req.method === "POST" && req.url === "/api/log") {
    const body = await readBody(req);
    try {
      const { tag, data } = JSON.parse(body || "{}");
      log(`[client] ${tag || "event"}`, data !== undefined ? data : "");
    } catch {
      log("[client] (нечетим лог)", body.slice(0, 500));
    }
    res.writeHead(204);
    return res.end();
  }

  // Поръчки: upsert (създаване/обновяване на статус) от клиента/кухнята.
  if (req.method === "POST" && req.url === "/api/orders") {
    const body = await readBody(req);
    try {
      const o = JSON.parse(body || "{}");
      if (!o || o.docID === undefined || o.docID === null) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Required: docID" }));
      }
      const id = String(o.docID);
      orders.set(id, { ...o, updatedAt: Date.now() });
      log(`[orders] upsert #${id} | статус=${o.status}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: String(e) }));
    }
  }

  // Поръчка по номер → за страницата със статуса (тракинг линк).
  if (req.method === "GET" && req.url.startsWith("/api/orders/")) {
    const id = decodeURIComponent(req.url.slice("/api/orders/".length).split("?")[0]);
    const o = orders.get(id);
    if (!o) {
      log(`[orders] GET #${id} → 404`);
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "not found" }));
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(o));
  }

  // Снимки на продуктите: целият индекс (продукт → URL).
  if (req.method === "GET" && req.url === "/api/product-images") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(productImages));
  }

  // Качване/премахване на снимка за продукт.
  if (req.method === "POST" && req.url === "/api/product-image") {
    const body = await readBody(req);
    try {
      const { productId, dataUrl } = JSON.parse(body || "{}");
      if (productId === undefined || productId === null) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Required: productId" }));
      }
      const id = String(productId);
      if (!dataUrl) {
        delete productImages[id];
        saveImagesIndex();
        log(`[images] премахната снимка за #${id}`);
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, url: null }));
      }
      const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/s.exec(dataUrl);
      if (!m) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Невалиден формат на снимката" }));
      }
      const buf = Buffer.from(m[2], "base64");
      if (buf.length > 6 * 1024 * 1024) {
        res.writeHead(413, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Снимката е твърде голяма" }));
      }
      const ext = EXT_BY_MIME[m[1]];
      const file = `p${id}.${ext}`;
      writeFileSync(join(UPLOAD_DIR, file), buf);
      const url = `/uploads/${file}?v=${Date.now()}`;
      productImages[id] = url;
      saveImagesIndex();
      log(`[images] записана снимка за #${id} (${Math.round(buf.length / 1024)} KB)`);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true, url }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: String(e) }));
    }
  }

  // Сервиране на качените снимки от постоянното хранилище.
  if (req.method === "GET" && req.url.startsWith("/uploads/")) {
    const name = normalize(decodeURIComponent(req.url.slice("/uploads/".length).split("?")[0]));
    if (name.includes("..") || name.includes("/")) {
      res.writeHead(400);
      return res.end("bad path");
    }
    const ext = (name.split(".").pop() || "").toLowerCase();
    return readFile(join(UPLOAD_DIR, name), (err, buf) => {
      if (err) {
        res.writeHead(404);
        return res.end("not found");
      }
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "public, max-age=31536000" });
      res.end(buf);
    });
  }

  // Заявка за Viber → препраща към Infobip (ключът е само на сървъра).
  if (req.method === "POST" && req.url === "/api/send-viber") {
    if (!viberReady) {
      log("[viber] ОТКАЗ — Viber не е конфигуриран");
      res.writeHead(503, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "Viber not configured" }));
    }
    const body = await readBody(req);
    try {
      const { to, text: rawText } = JSON.parse(body || "{}");
      if (!to || !rawText) {
        log("[viber] 400 — липсва to/text");
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Required: to, text" }));
      }
      // Нормализираме тракинг линка към публичния домейн (иначе при управление
      // от localhost клиентът получава нерабоещ localhost линк).
      let text = rawText;
      if (cfg.publicUrl) {
        const before = text;
        text = text.replace(/https?:\/\/[^/\s]+(?=\/\?track=)/g, cfg.publicUrl);
        if (before !== text) log(`[viber] линкът е нормализиран към ${cfg.publicUrl}`);
      }
      log(`[viber] → изпращане към ${to} (${text.length} симв.):\n  ${text.replace(/\n/g, "\n  ")}`);
      const r = await fetch(`https://${cfg.baseUrl}/viber/2/messages`, {
        method: "POST",
        headers: {
          "Authorization": `App ${cfg.apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          messages: [{ sender: cfg.sender, destinations: [{ to }], content: { type: "TEXT", text } }],
        }),
      });
      const data = await r.text();
      let summary = data;
      try {
        const j = JSON.parse(data);
        const m = j.messages && j.messages[0];
        if (m) summary = `messageId=${m.messageId} status=${m.status?.name}`;
      } catch { /* остави суровия текст */ }
      log(`[viber] ← Infobip HTTP ${r.status} | ${summary}`);
      res.writeHead(r.status, { "Content-Type": "application/json" });
      res.end(data);
    } catch (e) {
      log("[viber] ГРЕШКА:", String(e));
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: String(e) }));
    }
    return;
  }

  // Всичко друго → връща менюто.
  readFile(HTML, (err, buf) => {
    if (err) {
      log("[http] 404", MENU_FILE);
      res.writeHead(404);
      return res.end(`${MENU_FILE} не е намерен в тази папка.`);
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(buf);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  log("[boot]", `✅ Слуша на http://0.0.0.0:${PORT}  (Ctrl+C за спиране)`);
});
