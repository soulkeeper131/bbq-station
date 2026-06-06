// test-viber.mjs — локален тест на Viber през Infobip (без Vercel).
// Изисква Node 18+ (има вграден fetch).
// Стартиране:  node test-viber.mjs
// Тайните се четат от secrets.local.json в същата папка (НЕ го качвай в Git).

import { readFileSync } from "node:fs";

let fileCfg = {};
try {
  fileCfg = JSON.parse(readFileSync(new URL("./secrets.local.json", import.meta.url)));
} catch {
  // Няма локален файл — разчитаме на env.
}
const cfg = {
  baseUrl: process.env.INFOBIP_BASE_URL || fileCfg.baseUrl || "",
  apiKey: process.env.INFOBIP_API_KEY || fileCfg.apiKey || "",
  sender: process.env.INFOBIP_SENDER || fileCfg.sender || "",
  to: process.env.VIBER_TEST_TO || fileCfg.to || "",
  text: process.env.VIBER_TEST_TEXT || fileCfg.text || "",
};

const res = await fetch(`https://${cfg.baseUrl}/viber/2/messages`, {
  method: "POST",
  headers: {
    "Authorization": `App ${cfg.apiKey}`,
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  body: JSON.stringify({
    messages: [
      {
        sender: cfg.sender,
        destinations: [{ to: cfg.to }],
        content: { type: "TEXT", text: cfg.text || "Тест от Грил & Бистро ✅" },
      },
    ],
  }),
});

const data = await res.json().catch(() => ({}));
console.log("HTTP статус:", res.status);
console.log(JSON.stringify(data, null, 2));

// Подсказка при чести грешки:
if (!res.ok) {
  console.log("\n⚠️  Нещо не е наред. Чести причини:");
  console.log("  • Грешен/изтекъл ключ или липсва scope viber-bm:message:send");
  console.log("  • В trial: номерът 'to' не е верифициран в Infobip");
  console.log("  • Грешен подател (в trial трябва да е IBSelfServe)");
}
