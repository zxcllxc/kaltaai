/**
 * Генерация заранее готовых ИИ-текстов для 4 демо-профилей → src/lib/demo-ai.ts
 * Запуск: npx tsx scripts/gen-demo-ai.mts http://localhost:3100   (нужен запущенный сервер с NVIDIA_API_KEY)
 * Даты в текстах заменяются плейсхолдерами {date}/{until}, поэтому тексты не устаревают — цифры демо от даты не зависят.
 */
import fs from "fs";
import { analyze, demoDataset, money, sellThrough } from "../src/lib/analytics.ts";
import { dn } from "../src/lib/demo.ts";
import { factsForLLM, storyText } from "../src/lib/texts.ts";
import { onDate } from "../src/lib/dates.ts";
import type { Biz } from "../src/lib/types.ts";

const BASE = process.argv[2] ?? "http://localhost:3100";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function call(mode: string, facts: unknown, tries = 3): Promise<Record<string, unknown> | null> {
  for (let i = 0; i < tries; i++) {
    const r = await fetch(BASE + "/api/advice", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, facts }) }).then((x) => x.json()).catch(() => null);
    await sleep(3500);
    if (r?.ai) return r;
    console.log("  retry", mode, r?.reason);
  }
  return null;
}

const out: Record<string, unknown> = {};
for (const biz of ["shop", "cafe", "salon", "auto"] as Biz[]) {
  const ds = demoDataset(biz);
  const a = analyze(ds);
  const f = factsForLLM(a, ds, "ru") as Record<string, unknown>;
  const date = a.story.date ? onDate(a.story.date) : "";
  // без дат: они подставятся на сайте в день показа
  const facts = { ...f, today: "сегодня", story: storyText(a.story, a, "ru").sentence.replace(date, "{date}"), tax: { ...(f.tax as object), social: undefined }, paymentsUntilHardestDay: undefined };
  const actions = await call("actions", facts);
  const brief = await call("brief", facts);
  const promo: Record<string, { ru: string; kz: string }> = {};
  for (const d of a.dead.slice(0, 3)) {
    const disc = d.daysNoSale >= 60 ? 0.4 : d.daysNoSale >= 45 ? 0.3 : 0.25;
    const price = Math.round((d.retail * (1 - disc)) / 10) * 10;
    void sellThrough;
    const r = await call("promo", { item: d.name, itemKz: dn(d.name, "kz"), price: money(price), oldPrice: money(d.retail), discount: `${Math.round(disc * 100)}%`, untilRu: "{until}", untilKz: "{until}", left: String(d.stockQty), city: "Тараз" });
    if (r && typeof r.ru === "string" && typeof r.kz === "string" && r.ru.includes("{until}") && r.kz.includes("{until}")) promo[d.name] = { ru: r.ru, kz: r.kz };
    else console.log("  promo skipped (нет плейсхолдера даты)", biz, d.name);
  }
  const msgs = Array.isArray(brief?.messages) ? (brief!.messages as string[]).filter((m) => typeof m === "string") : [];
  // в брифинге допускаем только плейсхолдер {date} — никаких конкретных дат
  const okBrief = msgs.length >= 2 && msgs.every((m) => !/\d{1,2}\s+(январ|феврал|март|апрел|ма[яй]|июн|июл|август|сентябр|октябр|ноябр|декабр)/i.test(m));
  out[biz] = { model: String(actions?.model ?? brief?.model ?? ""), actions: (actions?.actions as Record<string, string>) ?? {}, brief: okBrief ? msgs.slice(0, 2) : [], promo };
  console.log(biz, "actions", Object.keys((actions?.actions as object) ?? {}).length, "brief", okBrief ? msgs.length : 0, "promo", Object.keys(promo).length);
}

const file = `import type { Biz } from "./types";

/** Заранее сгенерированные ИИ-тексты для демо-профилей (NVIDIA NIM), чтобы на питче всё появлялось мгновенно и одинаково.
 *  Сгенерировано scripts/gen-demo-ai.mts; числа проверены сервером (выдуманные отбрасываются), даты — плейсхолдеры {date}/{until}. */
export interface DemoAI {
  model: string;
  actions: Record<string, string>;
  brief: string[];
  promo: Record<string, { ru: string; kz: string }>;
}

export const DEMO_AI: Partial<Record<Biz, DemoAI>> = ${JSON.stringify(out, null, 2)};
`;
fs.writeFileSync("src/lib/demo-ai.ts", file);
console.log("written src/lib/demo-ai.ts");
