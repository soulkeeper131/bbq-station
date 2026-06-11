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
//        PUBLIC_URL         публичен домейн за тракинг линкове във Viber
//        DATA_DIR           persistent volume (orders, menu, uploads)
//        DEMO_MODE          false = скрива демо UI и client logging
//        ADMIN_API_KEY      ключ за админ API (menu, images, order updates)
//   2) secrets.local.json в същата папка (за локална разработка)
//
// Локално стартиране:  node local-server.mjs  →  http://localhost:3000

import { createServer } from "node:http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, readdirSync, rmdirSync, copyFileSync, statSync } from "node:fs";
import { join, normalize, basename } from "node:path";
import { timingSafeEqual, createHash } from "node:crypto";
import { gzipSync, brotliCompressSync } from "node:zlib";

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
    adminApiKey: process.env.ADMIN_API_KEY || fileCfg.adminApiKey || "",
    // Публичният адрес на сайта — за да са верни тракинг линковете във Viber,
    // независимо откъде се управлява поръчката (напр. localhost).
    publicUrl: (process.env.PUBLIC_URL || fileCfg.publicUrl || "").replace(/\/+$/, ""),
  };
}

const cfg = loadConfig();
const ADMIN_API_KEY = cfg.adminApiKey;
const DEMO_MODE = !["0", "false", "no"].includes(String(process.env.DEMO_MODE || "").toLowerCase());
const BODY_MAX = 8 * 1024 * 1024;
const PORT = Number(process.env.PORT) || 3000;
const MENU_FILE = process.env.MENU_FILE || "public/index.html";
const HTML = new URL(`./${MENU_FILE}`, import.meta.url);
const CSS_FILE = new URL("./public/style.css", import.meta.url);
const JS_FILE = new URL("./public/app.js", import.meta.url);
const BUILD_VERSION = String(Math.floor(Date.now() / 1000));
const viberReady = Boolean(cfg.baseUrl && cfg.apiKey && cfg.sender);
const startTime = Date.now();
let errorCount = 0;

// ── Логинг ──────────────────────────────────────────────────────
// Единен timeline в терминала. ВНИМАНИЕ: API ключът НИКОГА не се логва.
const ts = () => {
  const d = new Date();
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${p(d.getMilliseconds(), 3)}`;
};
const log = (tag, ...rest) => console.log(`${ts()} ${tag}`, ...rest);

function readBody(req, max = BODY_MAX) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > max) {
        req.destroy();
        reject(new Error("payload too large"));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function adminKeyFrom(req) {
  const h = req.headers["x-admin-key"];
  if (typeof h === "string" && h) return h;
  const auth = req.headers.authorization || "";
  const m = /^Bearer\s+(.+)$/i.exec(auth);
  return m ? m[1] : "";
}

// ── Admin Rate Limiting & Audit ──────────────────────────────────
// Предпазва от brute-force атаки срещу админ ключа.
const ADMIN_FAIL_MAX = 5;          // max грешни опита
const ADMIN_FAIL_WINDOW = 60_000;  // прозорец: 1 минута
const ADMIN_LOCKOUT = 15 * 60_000; // блокировка: 15 минути
const adminFails = new Map();      // ip → {count, firstFail, lockoutUntil}

function tsAudit() {
  const d = new Date();
  return d.toISOString().replace("T", " ").slice(0, 19);
}

function auditLog(action, req, detail = "") {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?";
  const ua = req.headers["user-agent"] || "?";
  console.log(`${ts()} AUDIT [${tsAudit()}] ${action} | IP=${ip} | ${detail} | UA=${ua.slice(0,80)}`);
}

function requireAdmin(req, res) {
  if (!ADMIN_API_KEY) return true;

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?";

  // 📵 Админ достъп САМО през HTTPS
  const proto = req.headers["x-forwarded-proto"] || "";
  if (proto && proto !== "https") {
    auditLog("ADMIN_INSECURE", req, `blocked HTTP (proto=${proto})`);
    res.writeHead(403, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "https_required" }));
    return false;
  }

  // Проверка за lockout
  const rec = adminFails.get(ip);
  if (rec && rec.lockoutUntil > Date.now()) {
    const rem = Math.ceil((rec.lockoutUntil - Date.now()) / 1000);
    auditLog("LOCKOUT", req, `blocked ${rem}s remaining`);
    res.writeHead(429, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "too_many_attempts", retry_after: rem }));
    return false;
  }

  // Timing-safe сравнение (предпазва от timing attacks)
  const provided = adminKeyFrom(req);
  const expected = Buffer.from(ADMIN_API_KEY);
  const actual = Buffer.from(provided || "");

  let isValid = false;
  if (actual.length === expected.length) {
    try {
      isValid = timingSafeEqual(actual, expected);
    } catch {
      isValid = false;
    }
  }

  if (isValid) {
    // Успешен вход — чистим fail брояча
    adminFails.delete(ip);
    auditLog("ADMIN_OK", req, "authenticated");
    return true;
  }

  // Грешен ключ — обновяваме fail брояча
  const now = Date.now();
  if (!rec || rec.firstFail < now - ADMIN_FAIL_WINDOW) {
    // Нов прозорец
    adminFails.set(ip, { count: 1, firstFail: now, lockoutUntil: 0 });
  } else {
    rec.count++;
    if (rec.count >= ADMIN_FAIL_MAX) {
      rec.lockoutUntil = now + ADMIN_LOCKOUT;
      auditLog("LOCKOUT_START", req, `${ADMIN_FAIL_MAX} fails, locked for ${ADMIN_LOCKOUT/60000}min`);
    }
  }
  const remaining = ADMIN_FAIL_MAX - (adminFails.get(ip)?.count || 0);

  auditLog("ADMIN_FAIL", req, `attempt ${adminFails.get(ip)?.count}/${ADMIN_FAIL_MAX}, ${remaining} remaining`);

  res.writeHead(401, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "unauthorized" }));
  return false;
}

// ── General Rate Limiting (sliding window per IP) ─────────────────
// Предпазва от abuse на публичните endpoints.
const RL_WINDOW = 10_000;  // 10 секунди sliding window
const RL_LIMITS = {
  "POST:/api/orders": 5,       // създаване на поръчки
  "GET:/api/orders/list": 10,  // тракинг на поръчка
  "POST:/api/send-viber": 2,   // Viber тестове
  "GET:/healthz": 30,          // health checks
  "GET:/api/config": 30,
  "GET:/api/metrics": 30,
};
const RL_DEFAULT = 60;  // главна страница, статични ресурси
const rlBuckets = new Map();  // ip → [{key, ts}]
let rlCleanCounter = 0;

function getIP(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?").split(",")[0].trim();
}

function rateLimitKey(req) {
  const m = req.method;
  const u = req.url.split("?")[0];
  if (u.startsWith("/api/orders/")) return `${m}:/api/orders/list`;
  return `${m}:${u}`;
}

function checkRateLimit(req, res) {
  const ip = getIP(req);
  const key = rateLimitKey(req);
  const limit = RL_LIMITS[key] ?? RL_DEFAULT;
  const now = Date.now();

  let bucket = rlBuckets.get(ip);
  if (!bucket) { bucket = []; rlBuckets.set(ip, bucket); }

  const cutoff = now - RL_WINDOW;
  const recent = bucket.filter(e => e.ts > cutoff);

  if (recent.length >= limit) {
    const retry = Math.ceil((recent[0].ts + RL_WINDOW - now) / 1000) || 1;
    res.writeHead(429, { "Content-Type": "application/json", "Retry-After": String(retry) });
    res.end(JSON.stringify({ error: "too_many_requests", retry_after: retry }));
    return false;
  }

  recent.push({ key, ts: now });
  rlBuckets.set(ip, recent);

  // Периодично чистене на стари IP-та
  if (++rlCleanCounter > 1000) {
    rlCleanCounter = 0;
    for (const [k, entries] of rlBuckets) {
      const clean = entries.filter(e => e.ts > cutoff);
      if (clean.length === 0) rlBuckets.delete(k);
      else rlBuckets.set(k, clean);
    }
  }

  return true;
}

// Поръчки: в паметта + orders.json на volume (оцеляват след рестарт/деплой).
const orders = new Map();
const ORDERS_MAX = 500;

// ── Снимки на продуктите ────────────────────────────────────────
// Пазят се на диск в DATA_DIR (в Coolify → постоянен volume), за да ги
// виждат всички клиенти и да оцеляват след предеплой.
const DATA_DIR = process.env.DATA_DIR || new URL("./data/", import.meta.url).pathname;
const UPLOAD_DIR = join(DATA_DIR, "uploads");
const IMAGES_JSON = join(DATA_DIR, "product-images.json");
const MENU_JSON = join(DATA_DIR, "menu-overrides.json");
const ORDERS_JSON = join(DATA_DIR, "orders.json");
const MIME = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

let productImages = {}; // { [productId]: "/uploads/pXX.jpg" }
let menuOverrides = { customItems: [], patches: {}, hidden: [] };
try {
  mkdirSync(UPLOAD_DIR, { recursive: true });
  if (existsSync(IMAGES_JSON)) productImages = JSON.parse(readFileSync(IMAGES_JSON, "utf8")) || {};
  if (existsSync(MENU_JSON)) {
    const raw = JSON.parse(readFileSync(MENU_JSON, "utf8")) || {};
    menuOverrides = {
      customItems: Array.isArray(raw.customItems) ? raw.customItems : [],
      patches: raw.patches && typeof raw.patches === "object" ? raw.patches : {},
      hidden: Array.isArray(raw.hidden) ? raw.hidden : [],
    };
  }
} catch (e) {
  console.warn("⚠️  Хранилището за снимки/меню не е достъпно:", String(e));
}
const saveImagesIndex = () => {
  try { writeFileSync(IMAGES_JSON, JSON.stringify(productImages)); }
  catch (e) { console.warn("⚠️  Грешка при запис на индекса със снимки:", String(e)); }
};
const saveMenuOverrides = () => {
  try { writeFileSync(MENU_JSON, JSON.stringify(menuOverrides)); }
  catch (e) { console.warn("⚠️  Грешка при запис на меню overrides:", String(e)); }
};
const ordersList = () =>
  [...orders.values()].sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

// ── Backup система ────────────────────────────────────────────────
const BACKUP_DIR = join(DATA_DIR, "backups");
const BACKUP_MAX = 24;
const BACKUP_INTERVAL = 3600_000;
let lastBackupHash = "";

function hashData() {
  const h = createHash("sha256");
  if (existsSync(ORDERS_JSON)) h.update(readFileSync(ORDERS_JSON));
  if (existsSync(MENU_JSON)) h.update(readFileSync(MENU_JSON));
  if (existsSync(IMAGES_JSON)) h.update(readFileSync(IMAGES_JSON));
  return h.digest("hex");
}

function createBackup() {
  try {
    const now = new Date();
    const tag = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dir = join(BACKUP_DIR, tag);
    const currentHash = hashData();
    if (currentHash === lastBackupHash) { log("[backup]", "няма промени — skip"); return null; }
    lastBackupHash = currentHash;
    mkdirSync(dir, { recursive: true });
    for (const src of [ORDERS_JSON, MENU_JSON, IMAGES_JSON]) {
      if (existsSync(src)) copyFileSync(src, join(dir, basename(src)));
    }
    if (existsSync(UPLOAD_DIR)) {
      const upDst = join(dir, "uploads");
      mkdirSync(upDst, { recursive: true });
      for (const f of readdirSync(UPLOAD_DIR)) {
        const sf = join(UPLOAD_DIR, f);
        if (statSync(sf).isFile()) copyFileSync(sf, join(upDst, f));
      }
    }
    const meta = { created: now.toISOString(), orders: orders.size, images: Object.keys(productImages).length, hash: currentHash };
    writeFileSync(join(dir, "backup.json"), JSON.stringify(meta, null, 2));
    const all = listBackups();
    for (const b of all.slice(BACKUP_MAX)) { try { rmdirSync(b.path, { recursive: true }); } catch {} }
    log("[backup]", `създаден: ${tag} | поръчки=${orders.size} снимки=${Object.keys(productImages).length} | общо=${all.length}`);
    return tag;
  } catch (e) { log("[backup]", "ГРЕШКА:", String(e)); return null; }
}

function listBackups() {
  try {
    if (!existsSync(BACKUP_DIR)) return [];
    return readdirSync(BACKUP_DIR)
      .map(name => ({ name, path: join(BACKUP_DIR, name), meta: readBackupMeta(name) }))
      .filter(b => b.meta).sort((a, b) => b.name.localeCompare(a.name));
  } catch { return []; }
}

function readBackupMeta(tag) {
  try {
    const metaPath = join(BACKUP_DIR, tag, "backup.json");
    return existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, "utf8")) : null;
  } catch { return null; }
}

setTimeout(() => { createBackup(); setInterval(createBackup, BACKUP_INTERVAL); }, 300_000);
const loadOrders = () => {
  try {
    if (!existsSync(ORDERS_JSON)) return;
    const arr = JSON.parse(readFileSync(ORDERS_JSON, "utf8"));
    if (!Array.isArray(arr)) return;
    arr.forEach((o) => {
      if (o && o.docID !== undefined && o.docID !== null) orders.set(String(o.docID), o);
    });
  } catch (e) {
    console.warn("⚠️  Грешка при зареждане на поръчки:", String(e));
  }
};
const saveOrders = () => {
  try {
    writeFileSync(ORDERS_JSON, JSON.stringify(ordersList().slice(0, ORDERS_MAX)));
  } catch (e) {
    console.warn("⚠️  Грешка при запис на поръчки:", String(e));
  }
};

function normalizePhoneServer(p) {
  let d = String(p || "").replace(/[^\d]/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("0")) d = "359" + d.slice(1);
  return d;
}

async function sendViberMessage(to, text) {
  if (!viberReady || !to || !text) return;
  let msg = text;
  if (cfg.publicUrl) msg = msg.replace(/https?:\/\/[^/\s]+(?=\/\?track=)/g, cfg.publicUrl);
  const r = await fetch(`https://${cfg.baseUrl}/viber/2/messages`, {
    method: "POST",
    headers: {
      Authorization: `App ${cfg.apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      messages: [{ sender: cfg.sender, destinations: [{ to }], content: { type: "TEXT", text: msg } }],
    }),
  });
  log(`[viber] server → ${to} HTTP ${r.status}`);
}

function welcomeViberText(o) {
  const id = o.docID;
  const origin = cfg.publicUrl || "";
  const track = origin ? `${origin}/?track=${id}` : `/?track=${id}`;
  return `Получихме поръчката ти #${id}.\nЩе те уведомим, щом е готова.\n🔗 Проследи статуса: ${track}`;
}

loadOrders();

log("[boot]", `Viber ${viberReady ? "конфигуриран ✓" : "НЕ е конфигуриран ✗"} | sender=${cfg.sender || "—"} | host=${cfg.baseUrl || "—"}`);
log("[boot]", `Снимки: ${Object.keys(productImages).length} в ${DATA_DIR}`);
log("[boot]", `Поръчки: ${orders.size} в ${DATA_DIR}`);
log("[boot]", `Меню overrides: ${menuOverrides.customItems.length} ръчни · ${Object.keys(menuOverrides.patches).length} промени · ${menuOverrides.hidden.length} скрити`);
log("[boot]", `Публичен адрес за линкове: ${cfg.publicUrl || "— (ползва се origin-ът на клиента)"}`);
log("[boot]", `Режим: ${DEMO_MODE ? "демо" : "продукция"} | Admin API: ${ADMIN_API_KEY ? "задължителен" : "изключен (dev)"}`);
if (!viberReady) {
  console.warn("⚠️  Viber не е конфигуриран (липсват INFOBIP_* / secrets.local.json). " +
    "Менюто ще работи, но реални съобщения няма да се пращат.");
}

// ── Pre-compressed assets за светкавично сервиране ──────────────
const HTML_RAW = readFileSync(HTML, "utf8");
const HTML_BUF = Buffer.from(HTML_RAW.replace(/__V__/g, BUILD_VERSION));
const HTML_GZIP = gzipSync(HTML_BUF, { level: 6 });
const HTML_BROTLI = brotliCompressSync(HTML_BUF);
const CSS_BUF = readFileSync(CSS_FILE);
const CSS_GZIP = gzipSync(CSS_BUF, { level: 6 });
const CSS_BROTLI = brotliCompressSync(CSS_BUF);
const JS_BUF = readFileSync(JS_FILE);
const JS_GZIP = gzipSync(JS_BUF, { level: 6 });
const JS_BROTLI = brotliCompressSync(JS_BUF);
function fmtKB(n) { return (n/1024).toFixed(0) + "KB"; }
function pct(a, b) { return ((1-a/b)*100).toFixed(0) + "%"; }
log("[init]", `HTML ${fmtKB(HTML_BUF.length)} → gzip ${fmtKB(HTML_GZIP.length)} (${pct(HTML_GZIP.length,HTML_BUF.length)}) / brotli ${fmtKB(HTML_BROTLI.length)} (${pct(HTML_BROTLI.length,HTML_BUF.length)})`);
log("[init]", `CSS  ${fmtKB(CSS_BUF.length)} → gzip ${fmtKB(CSS_GZIP.length)} (${pct(CSS_GZIP.length,CSS_BUF.length)}) / brotli ${fmtKB(CSS_BROTLI.length)} (${pct(CSS_BROTLI.length,CSS_BUF.length)})`);
log("[init]", `JS   ${fmtKB(JS_BUF.length)} → gzip ${fmtKB(JS_GZIP.length)} (${pct(JS_GZIP.length,JS_BUF.length)}) / brotli ${fmtKB(JS_BROTLI.length)} (${pct(JS_BROTLI.length,JS_BUF.length)})`);

function serveCompressed(res, enc, buf, gz, br, ct) {
  let out, cenc;
  if (enc.includes("br")) { out = br; cenc = "br"; }
  else if (enc.includes("gzip")) { out = gz; cenc = "gzip"; }
  else { out = buf; cenc = ""; }
  const h = { "Content-Type": ct, "Cache-Control": "no-cache" };
  if (cenc) h["Content-Encoding"] = cenc;
  res.writeHead(200, h);
  res.end(out);
}

// ── Input Validation ─────────────────────────────────────────────
function san(str, max = 200) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, max).replace(/[\x00-\x1f\x7f]/g, "");
}

function validateOrder(o) {
  if (!san(o.name)) return "Името е задължително";
  if (o.name && o.name.length > 100) return "Името е твърде дълго (макс 100 символа)";
  if (!Array.isArray(o.lines) || o.lines.length === 0) return "Поръчката няма продукти";
  if (o.lines.length > 50) return "Твърде много редове (макс 50)";
  for (const l of o.lines) {
    if (!l.name || !l.qty || l.qty < 1 || l.qty > 99) return `Невалиден продукт: ${l.name || "?"} x${l.qty}`;
  }
  if (o.phone) {
    const raw = o.phone.replace(/[^\d+]/g, "");
    if (raw.length < 6 || raw.length > 20) return "Невалиден телефонен номер";
  }
  // Саниране
  o.name = san(o.name, 100);
  o.phone = san(o.phone, 20);
  if (o.note) o.note = san(o.note, 500);
  return null; // ок
}

const server = createServer(async (req, res) => {
  try {
  // Security: HSTS + basic headers за всеки отговор
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Rate limiting за всички заявки (освен OPTIONS/preflight).
  if (req.method !== "OPTIONS" && !checkRateLimit(req, res)) return;

  // Health check за Coolify / load balancer.
  if (req.method === "GET" && (req.url === "/healthz" || req.url === "/health")) {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const mem = process.memoryUsage();
    const lastOrder = ordersList()[0];
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      ok: true,
      uptime,
      uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
      orders: orders.size,
      lastOrderAt: lastOrder ? new Date(lastOrder.updatedAt).toISOString() : null,
      errors: errorCount,
      memory: { rssMB: Math.round(mem.rss / 1024 / 1024), heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024), heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024) },
      viber: viberReady,
      demoMode: DEMO_MODE,
      node: process.version,
    }));
  }

  // robots.txt — позволява индексиране, забранява /api
  if (req.method === "GET" && req.url === "/robots.txt") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    return res.end("User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nSitemap: https://bbqstation.blv.bg/sitemap.xml\n");
  }

  // sitemap.xml
  if (req.method === "GET" && req.url === "/sitemap.xml") {
    res.writeHead(200, { "Content-Type": "application/xml" });
    return res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>https://bbqstation.blv.bg/</loc><priority>1.0</priority></url>\n</urlset>`);
  }

  if (req.method === "GET" && req.url === "/api/config") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ demoMode: DEMO_MODE, adminRequired: Boolean(ADMIN_API_KEY) }));
  }

  // Metrics endpoint за Uptime Kuma / външен мониторинг.
  if (req.method === "GET" && req.url === "/api/metrics") {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const lastOrder = ordersList()[0];
    const minutesSinceLastOrder = lastOrder ? Math.floor((Date.now() - lastOrder.updatedAt) / 60000) : -1;
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({
      status: "healthy",
      uptime_seconds: uptime,
      orders_total: orders.size,
      minutes_since_last_order: minutesSinceLastOrder,
      errors_total: errorCount,
      memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      viber_ready: viberReady,
      demo_mode: DEMO_MODE,
    }));
  }

  // Клиентски събития → единен лог в терминала (поръчки, смяна на статус и т.н.).
  if (req.method === "POST" && req.url === "/api/log") {
    if (!DEMO_MODE) {
      res.writeHead(204);
      return res.end();
    }
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
    let body;
    try { body = await readBody(req); } catch {
      res.writeHead(413, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "payload too large" }));
    }
    try {
      const o = JSON.parse(body || "{}");
      if (!o || o.docID === undefined || o.docID === null) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Required: docID" }));
      }
      const id = String(o.docID);
      const isNew = !orders.has(id);

      // ── Input validation за нови поръчки ──
      if (isNew) {
        const val = validateOrder(o);
        if (val) {
          res.writeHead(422, { "Content-Type": "application/json" });
          return res.end(JSON.stringify({ error: val }));
        }
      }

      if (!isNew && !requireAdmin(req, res)) return;
      orders.set(id, { ...o, updatedAt: Date.now() });
      saveOrders();
      log(`[orders] upsert #${id} | статус=${o.status}${isNew ? " (нова)" : ""}`);
      if (isNew && o.status === 1 && o.phone) {
        sendViberMessage(normalizePhoneServer(o.phone), welcomeViberText(o)).catch((e) =>
          log("[viber] welcome грешка:", String(e))
        );
      }
      if (!isNew && o.status === 3 && o.phone) {
        const track = cfg.publicUrl ? `${cfg.publicUrl}/?track=${id}` : `/?track=${id}`;
        const text = `Поръчка #${id} е ГОТОВА за вземане ✅\nЗаповядай да я вземеш.\n🔗 Проследи статуса: ${track}`;
        sendViberMessage(normalizePhoneServer(o.phone), text).catch((e) =>
          log("[viber] готова грешка:", String(e))
        );
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: String(e) }));
    }
  }

  // Всички поръчки (за админ / синхронизация между устройства).
  if (req.method === "GET" && (req.url === "/api/orders" || req.url.startsWith("/api/orders?"))) {
    if (!requireAdmin(req, res)) return;
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(ordersList()));
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

  // Ръчни продукти и промени по менюто (постоянно на volume).
  if (req.method === "GET" && req.url === "/api/menu-overrides") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(menuOverrides));
  }
  if (req.method === "POST" && req.url === "/api/menu-overrides") {
    if (!requireAdmin(req, res)) return;
    let body;
    try { body = await readBody(req); } catch {
      res.writeHead(413, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "payload too large" }));
    }
    try {
      const raw = JSON.parse(body || "{}");
      menuOverrides = {
        customItems: Array.isArray(raw.customItems) ? raw.customItems : [],
        patches: raw.patches && typeof raw.patches === "object" ? raw.patches : {},
        hidden: Array.isArray(raw.hidden) ? raw.hidden : [],
      };
      saveMenuOverrides();
      log(`[menu] записани overrides: ${menuOverrides.customItems.length} ръчни, ${Object.keys(menuOverrides.patches).length} patch-а`);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: String(e) }));
    }
  }

  // Снимки на продуктите: целият индекс (продукт → URL).
  if (req.method === "GET" && req.url === "/api/product-images") {
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(productImages));
  }

  // Качване/премахване на снимка за продукт.
  if (req.method === "POST" && req.url === "/api/product-image") {
    if (!requireAdmin(req, res)) return;
    let body;
    try { body = await readBody(req); } catch {
      res.writeHead(413, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "payload too large" }));
    }
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
      for (const oldExt of ["jpg", "jpeg", "png", "webp"]) {
        if (oldExt === ext) continue;
        const oldPath = join(UPLOAD_DIR, `p${id}.${oldExt}`);
        if (existsSync(oldPath)) {
          try { unlinkSync(oldPath); } catch { /* ignore */ }
        }
      }
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
    const filePath = join(UPLOAD_DIR, name);
    try {
      const buf = readFileSync(filePath);
      res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream", "Cache-Control": "public, max-age=31536000" });
      return res.end(buf);
    } catch (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404);
        return res.end("not found");
      }
      throw err;
    }
  }

  // Viber proxy → само за админ (тестове). В продукция Viber се праща от сървъра.
  if (req.method === "POST" && req.url === "/api/send-viber") {
    if (!requireAdmin(req, res)) return;
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

  // Admin dashboard — само с admin key.
  if (req.method === "GET" && (req.url === "/admin" || req.url.startsWith("/admin?"))) {
    if (!requireAdmin(req, res)) return;
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = uptime % 60;
    const mem = process.memoryUsage();
    const rss = Math.round(mem.rss / 1024 / 1024);
    const heap = Math.round(mem.heapUsed / 1024 / 1024);
    const all = ordersList();
    const lastOrder = all[0];
    const html = `<!DOCTYPE html>
<html lang="bg">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>BBQ Station — Admin Dashboard</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,sans-serif;background:#0f0f0f;color:#e0e0e0;padding:20px;min-height:100vh}
h1{font-size:1.4rem;color:#ff6b35;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:24px}
.card{background:#1a1a1a;border-radius:10px;padding:16px;border:1px solid #2a2a2a}
.card .label{font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px}
.card .value{font-size:1.8rem;font-weight:700;color:#fff}
.card .sub{font-size:0.8rem;color:#666;margin-top:4px}
.ok{color:#4caf50}.warn{color:#ff9800}.err{color:#f44336}
table{width:100%;border-collapse:collapse;margin-top:16px}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #2a2a2a;font-size:0.85rem}
th{color:#888;font-weight:600}
.status-1{color:#ff9800}.status-2{color:#2196f3}.status-3{color:#4caf50}.status-4{color:#f44336}
.refresh{font-size:0.75rem;color:#555;text-align:right;margin-bottom:8px}
</style></head>
<body>
<h1>🔥 BBQ Station — Admin Dashboard</h1>
<div class="refresh">Обновено: ${new Date().toLocaleTimeString("bg-BG")} | Авто-опресняване: 30s</div>
<div class="grid">
<div class="card"><div class="label">Uptime</div><div class="value">${h}h ${m}m</div><div class="sub">${s}s</div></div>
<div class="card"><div class="label">Поръчки</div><div class="value">${orders.size}</div><div class="sub">${lastOrder ? "последна: "+new Date(lastOrder.updatedAt).toLocaleTimeString("bg-BG") : "няма"}</div></div>
<div class="card"><div class="label">Памет</div><div class="value">${rss} MB</div><div class="sub">heap: ${heap} MB</div></div>
<div class="card"><div class="label">Грешки</div><div class="value ${errorCount ? 'err' : 'ok'}">${errorCount}</div><div class="sub">от старта</div></div>
<div class="card"><div class="label">Viber</div><div class="value ${viberReady ? 'ok' : 'warn'}">${viberReady ? '✅' : '❌'}</div><div class="sub">${viberReady ? 'конфигуриран' : 'не е'}</div></div>
<div class="card"><div class="label">Режим</div><div class="value ${DEMO_MODE ? 'warn' : 'ok'}">${DEMO_MODE ? 'DEMO' : 'PROD'}</div><div class="sub">Node ${process.version}</div></div>
</div>
<h2 style="font-size:1.1rem;color:#888;margin-top:8px">Последни поръчки</h2>
<table>
<thead><tr><th>#</th><th>Име</th><th>Статус</th><th>Телефон</th><th>Обновена</th></tr></thead>
<tbody>${all.slice(0,20).map(o => {
  const statuses = {1:"🆕 Нова",2:"👨‍🍳 Приготвя",3:"✅ Готова",4:"❌ Отказана"};
  const sc = "status-" + (o.status || 0);
  return `<tr><td>${o.docID}</td><td>${(o.name||"").slice(0,25)}</td><td class="${sc}">${statuses[o.status]||"?"}</td><td>${o.phone||"—"}</td><td>${new Date(o.updatedAt).toLocaleTimeString("bg-BG")}</td></tr>`;
}).join("")}</tbody>
</table>
<script>setTimeout(()=>location.reload(),30000)</script>
</body></html>`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" });
    return res.end(html);
  }

  // ── Backup API (само за админ) ──────────────────────────────────
  // POST /api/admin/backup → ръчен backup
  if (req.method === "POST" && req.url === "/api/admin/backup") {
    if (!requireAdmin(req, res)) return;
    const tag = createBackup();
    res.writeHead(tag ? 200 : 304, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(tag ? { ok: true, backup: tag } : { ok: true, message: "no changes" }));
  }

  // GET /api/admin/backups → списък с налични backup-и
  if (req.method === "GET" && req.url === "/api/admin/backups") {
    if (!requireAdmin(req, res)) return;
    const list = listBackups().map(b => ({ name: b.name, created: b.meta?.created, orders: b.meta?.orders, images: b.meta?.images }));
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify({ backups: list, total: list.length, max: BACKUP_MAX }));
  }

  // POST /api/admin/restore → преглед на backup данни
  if (req.method === "POST" && req.url === "/api/admin/restore") {
    if (!requireAdmin(req, res)) return;
    let body;
    try { body = await readBody(req); } catch {
      res.writeHead(413, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: "payload too large" }));
    }
    try {
      const { backup: tag } = JSON.parse(body || "{}");
      if (!tag) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "Required: backup (timestamp tag)" }));
      }
      const dir = join(BACKUP_DIR, tag);
      if (!existsSync(dir)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "backup not found" }));
      }
      const meta = readBackupMeta(tag);
      const ordersFile = join(dir, "orders.json");
      const orders = existsSync(ordersFile) ? JSON.parse(readFileSync(ordersFile, "utf8")) : [];
      const imagesFile = join(dir, "product-images.json");
      const images = existsSync(imagesFile) ? JSON.parse(readFileSync(imagesFile, "utf8")) : {};
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ backup: tag, meta, orders, images }));
    } catch (e) {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ error: String(e) }));
    }
  }

  // Статични асети — кешират се за 1 година (версионирани са през BUILD_VERSION)
  const ae = req.headers["accept-encoding"] || "";
  if (req.method === "GET" && (req.url === "/style.css" || req.url.startsWith("/style.css?"))) {
    serveCompressed(res, ae, CSS_BUF, CSS_GZIP, CSS_BROTLI, "text/css; charset=utf-8");
    return;
  }
  if (req.method === "GET" && (req.url === "/app.js" || req.url.startsWith("/app.js?"))) {
    serveCompressed(res, ae, JS_BUF, JS_GZIP, JS_BROTLI, "application/javascript; charset=utf-8");
    return;
  }

  // Всичко друго → връща менюто (gzip/brotli ако браузърът поддържа).
  serveCompressed(res, ae, HTML_BUF, HTML_GZIP, HTML_BROTLI, "text/html; charset=utf-8");

  } catch (err) {
    errorCount++;
    log("[server] unhandled error:", err.message || String(err));
    if (!res.headersSent) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "internal" }));
    }
  }
});

server.listen(PORT, "0.0.0.0", () => {
  log("[boot]", `✅ Слуша на http://0.0.0.0:${PORT}  (Ctrl+C за спиране)`);
});
