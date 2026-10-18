import { NextResponse } from "next/server";

/** LLM (NVIDIA NIM, OpenAI-совместимый endpoint) только переформулирует тексты по готовым агрегатам.
 *  Вызов только на сервере, таймаут 10 с. Нет ключа / лимит / ошибка / выдуманное число → { ai: false }, клиент берёт шаблон. */

export const maxDuration = 20;

const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
// gpt-oss-20b: быстрый (1,5–5 с с reasoning_effort=low) и хорошо пишет по-русски
const MODEL = process.env.NVIDIA_MODEL || "openai/gpt-oss-20b";
const MODES = ["actions", "brief", "ask", "promo", "reviews"] as const;
type Mode = (typeof MODES)[number];
type Lang = "ru" | "kz";

const MAX_BODY = 12_000; // символов JSON
const MAX_QUESTION = 300;

/* ---------- лимит запросов: на IP и на инстанс (защита ключа во время оценки) ---------- */
const hits = new Map<string, number[]>();
function limited(ip: string, mode: Mode) {
  const now = Date.now();
  const rules: [string, number, number][] = [
    [`ip:${ip}:min`, 60_000, mode === "ask" ? 8 : 20],
    [`ip:${ip}:hour`, 3_600_000, mode === "ask" ? 60 : 150],
    ["all:min", 60_000, 240],
  ];
  for (const [key, win, max] of rules) {
    const arr = (hits.get(key) ?? []).filter((t) => now - t < win);
    if (arr.length >= max) {
      hits.set(key, arr);
      return true;
    }
    arr.push(now);
    hits.set(key, arr);
  }
  if (hits.size > 5000) hits.clear();
  return false;
}

const SYSTEM: Record<Lang, string> = {
  ru:
    "Reasoning: low. Ты KaltaAI — финансовый директор малого бизнеса в Таразе. Пиши по-русски, коротко, по-человечески, обращайся на «вы», без markdown и без списков с символами *. " +
    "Валюта — только тенге (₸), никогда не рубли. ЗАПРЕЩЕНО придумывать, пересчитывать или округлять числа: используй только суммы, проценты и даты из входных фактов, дословно. Если нужного числа нет в фактах — пиши без числа.",
  kz:
    "Reasoning: low. Сен — KaltaAI, Тараздағы шағын бизнестің қаржы директорысың. Тек қазақ тілінде, қысқа, түсінікті жаз, «сіз» деп сөйле, markdown қолданба. " +
    "Валюта — тек теңге (₸). Сандарды ойдан шығаруға, қайта есептеуге немесе дөңгелектеуге ТЫЙЫМ САЛЫНАДЫ: тек кіріс деректеріндегі сомаларды, пайыздарды және күндерді сол күйінде қолдан.",
};

function prompt(mode: Mode, lang: Lang, facts: unknown, question?: string) {
  const f = `Факты (JSON): ${JSON.stringify(facts)}`;
  const kz = lang === "kz";
  switch (mode) {
    case "actions":
      return `${f}\nДля каждого действия из facts.actions напиши одну короткую фразу-совет на «вы» (до 80 символов, повелительное наклонение, без чисел). Ответ строго JSON без пояснений: {"actions": {"<id>": "<фраза>"}}`;
    case "brief":
      return `${f}\nНапиши 2 коротких сообщения (до 200 символов) для утреннего брифинга владельцу, на «вы». Не повторяй facts.story дословно. 1) Объясни простыми словами, почему так: какой платёж из facts.cause и что такое резерв (налог + запас на 7 дней). 2) Что сделать первым — facts.actions[0] — и какой будет эффект в ₸. Ответ строго JSON: {"messages": ["...", "..."]}`;
    case "ask":
      return kz
        ? `${f}\nИесінің сұрағы: ${question}\nfacts.computedAnswer — кодпен есептелген дайын жауап. Оны 2–4 қысқа сөйлеммен өз сөзіңмен қазақша қайта айт. Жаңа сандар қоспа.`
        : `${f}\nВопрос владельца: ${question}\nВ facts.computedAnswer — готовый ответ, посчитанный кодом. Перескажи его своими словами в 2–4 коротких предложениях на «вы». Можно опустить детали, нельзя добавлять новые числа.`;
    case "promo":
      return `${f}\nНапиши пост для Instagram/WhatsApp об акции на русском (поле ru) и на казахском (поле kz). До 280 символов каждый, 1–2 эмодзи, призыв написать в WhatsApp. В ru используй название item и дату untilRu, в kz — itemKz и untilKz. Цену, старую цену, скидку и остаток (left) пиши дословно. В ru не используй казахские слова, в kz старую цену пиши как «бұрынғы бағасы». Ответ строго JSON: {"ru": "...", "kz": "..."}`;
    case "reviews":
      return kz
        ? `${f}\nБұл — клиенттер пікірлеріндегі шағымдардың жиынтығы. Жаз: 1) басты шағымға клиентке сыпайы жауап (2–3 сөйлем), 2) қызметкерге қысқа тапсырма. Тек қазақша. Жауап қатаң JSON: {"reply": "...", "task": "..."}`
        : `${f}\nЭто сводка жалоб из отзывов клиентов (темы и сколько раз встречаются). Напиши: 1) вежливый ответ клиенту на главную жалобу (2–3 предложения), 2) короткую задачу сотруднику. Ответ строго JSON: {"reply": "...", "task": "..."}`;
  }
}

function ipOf(req: Request) {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "anon";
}

function clean(s: string) {
  return s
    .replace(/₽|руб\.?(лей|ля|ль)?/g, "₸")
    .replace(/\*\*|__|`/g, "")
    .trim();
}

/** Проверка языка: в казахском ответе должны быть казахские буквы, в русском — почти не должно быть латиницы. */
function rightLanguage(text: string, lang: Lang) {
  const words = text.split(/\s+/).filter(Boolean);
  if (!words.length) return false;
  const latin = words.filter((w) => /^[A-Za-z]{3,}/.test(w) && !/^(Kaspi|WhatsApp|Instagram|KaltaAI|QR|ABC|NVIDIA|NIM)/i.test(w)).length;
  if (latin / words.length > 0.25) return false;
  if (lang === "kz") return /[әғқңөұүһі]/i.test(text);
  return true;
}

export async function POST(req: Request) {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return NextResponse.json({ ai: false, reason: "no-key" });
  let body: { mode?: string; facts?: unknown; question?: string; lang?: string };
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY) return NextResponse.json({ ai: false, reason: "too-large" }, { status: 413 });
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ai: false, reason: "bad-request" }, { status: 400 });
  }
  const mode = (MODES as readonly string[]).includes(body.mode ?? "") ? (body.mode as Mode) : "actions";
  const lang: Lang = body.lang === "kz" ? "kz" : "ru";
  const question = typeof body.question === "string" ? body.question.trim() : undefined;
  if (mode === "ask" && (!question || question.length > MAX_QUESTION)) return NextResponse.json({ ai: false, reason: "question-length" }, { status: 400 });
  if (limited(ipOf(req), mode)) return NextResponse.json({ ai: false, reason: "rate-limit" }, { status: 429 });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM[mode === "promo" || mode === "actions" || mode === "brief" ? "ru" : lang] },
          { role: "user", content: prompt(mode, lang, body.facts, question) },
        ],
        temperature: 0.3,
        max_tokens: 700,
        reasoning_effort: "low",
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) return NextResponse.json({ ai: false, reason: `http-${r.status}` });
    const j = await r.json();
    const text = clean(String(j.choices?.[0]?.message?.content ?? ""));
    if (!text) return NextResponse.json({ ai: false, reason: "empty" });
    // защита от выдуманных чисел: каждое число ≥ 100 из ответа должно быть в фактах (или в вопросе)
    const factStr = (JSON.stringify(body.facts ?? {}) + (question ?? "")).replace(/[\s  ]/g, "");
    const invented = (text.replace(/(\d)[\s  ](?=\d{3})/g, "$1").match(/\d{3,}/g) ?? []).filter((n) => !factStr.includes(n));
    if (invented.length) return NextResponse.json({ ai: false, reason: "invented-numbers" });
    if (mode === "ask") {
      if (!rightLanguage(text, lang)) return NextResponse.json({ ai: false, reason: "wrong-language" });
      return NextResponse.json({ ai: true, answer: text.slice(0, 1200), model: MODEL });
    }
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : null;
    if (!parsed || typeof parsed !== "object") return NextResponse.json({ ai: false, reason: "bad-json" });
    if (mode === "promo" && (!rightLanguage(String(parsed.ru ?? ""), "ru") || !rightLanguage(String(parsed.kz ?? ""), "kz"))) return NextResponse.json({ ai: false, reason: "wrong-language" });
    if (mode === "reviews" && !rightLanguage(String(parsed.reply ?? ""), lang)) return NextResponse.json({ ai: false, reason: "wrong-language" });
    return NextResponse.json({ ai: true, ...parsed, model: MODEL });
  } catch (e) {
    return NextResponse.json({ ai: false, reason: String(e).slice(0, 80) });
  } finally {
    clearTimeout(timer);
  }
}
