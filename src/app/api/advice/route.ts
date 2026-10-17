import { NextResponse } from "next/server";

/** LLM (NVIDIA NIM, OpenAI-совместимый endpoint) только переформулирует тексты по готовым агрегатам.
 *  Вызов только на сервере, таймаут 10 с. Нет ключа / ошибка / LLM выдумал число → { ai: false }, клиент берёт шаблон. */

const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
// gpt-oss-20b: быстрый (2–5 с) и хорошо пишет по-русски; reasoning-модель, поэтому просим "Reasoning: low"
const MODEL = process.env.NVIDIA_MODEL || "openai/gpt-oss-20b";

const SYSTEM =
  "Reasoning: low. Ты KaltaAI — финансовый директор малого бизнеса в Таразе. Пиши коротко, по-человечески, без воды и без markdown. " +
  "ЗАПРЕЩЕНО придумывать, пересчитывать или округлять числа: используй только суммы, проценты и даты, которые есть во входных фактах, дословно. Если числа нет в фактах — пиши без числа.";

type Mode = "actions" | "brief" | "ask" | "promo" | "reviews";

function prompt(mode: Mode, facts: unknown, question?: string) {
  const f = `Факты (JSON): ${JSON.stringify(facts)}`;
  switch (mode) {
    case "actions":
      return `${f}\nДля каждого действия из facts.actions напиши одну короткую фразу-совет (до 90 символов, повелительное наклонение, без чисел). Ответ строго JSON без пояснений: {"actions": {"<id>": "<фраза>"}}`;
    case "brief":
      return `${f}\nНапиши 2 коротких сообщения для утреннего брифинга владельцу: 1) главное на сегодня, 2) ободряющий итог с первым шагом. Ответ строго JSON: {"messages": ["...", "..."]}`;
    case "ask":
      return `${f}\nВопрос владельца: ${question}\nОтветь 2–4 короткими предложениями, опираясь только на факты (в facts.computedAnswer — уже посчитанный ответ, его числа можно использовать).`;
    case "promo":
      return `${f}\nНапиши пост для Instagram/WhatsApp об акции: на русском и на казахском языке. До 280 символов каждый, 1–2 эмодзи, призыв написать в WhatsApp. Используй цену, скидку и дату дословно из фактов. Ответ строго JSON: {"ru": "...", "kz": "..."}`;
    case "reviews":
      return `${f}\nЭто сводка жалоб из отзывов клиентов (темы и сколько раз встречаются). Напиши: 1) вежливый ответ клиенту на главную жалобу (2–3 предложения), 2) короткую задачу сотруднику. Ответ строго JSON: {"reply": "...", "task": "..."}`;
  }
}

export async function POST(req: Request) {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return NextResponse.json({ ai: false, reason: "no-key" });
  try {
    const body = await req.json();
    const mode: Mode = body.mode ?? "actions";
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: prompt(mode, body.facts, body.question) },
        ],
        temperature: 0.3,
        max_tokens: 700,
        reasoning_effort: "low",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return NextResponse.json({ ai: false, reason: `http-${r.status}` });
    const j = await r.json();
    const text: string = (j.choices?.[0]?.message?.content ?? "").trim();
    if (!text) return NextResponse.json({ ai: false, reason: "empty" });
    // защита от выдуманных чисел: каждое число ≥ 100 из ответа должно быть в фактах
    const factStr = JSON.stringify(body.facts).replace(/[\s  ]/g, "");
    const invented = (text.replace(/(\d)[\s  ](?=\d{3})/g, "$1").match(/\d{3,}/g) ?? []).filter((n) => !factStr.includes(n));
    if (invented.length) return NextResponse.json({ ai: false, reason: "invented-numbers" });
    if (mode === "ask") return NextResponse.json({ ai: true, answer: text, model: MODEL });
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : null;
    if (!parsed) return NextResponse.json({ ai: false, reason: "bad-json" });
    return NextResponse.json({ ai: true, ...parsed, model: MODEL });
  } catch (e) {
    return NextResponse.json({ ai: false, reason: String(e).slice(0, 80) });
  }
}
