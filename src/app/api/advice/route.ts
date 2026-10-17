import { NextResponse } from "next/server";

/** LLM (NVIDIA NIM) только переформулирует действия по готовым цифрам.
 *  Нет ключа / ошибка / LLM выдумал число → { ai: false }, клиент берёт шаблоны. */
export async function POST(req: Request) {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return NextResponse.json({ ai: false, reason: "no-key" });
  try {
    const { facts, mode, question } = await req.json();
    const system =
      "Ты финансовый директор малого бизнеса в Таразе. Пиши по-русски, коротко, по-человечески, без воды. " +
      "ЗАПРЕЩЕНО придумывать или пересчитывать числа: используй только суммы и проценты, которые есть во входных фактах, дословно.";
    const user =
      mode === "ask"
        ? `Факты (JSON): ${JSON.stringify(facts)}\nВопрос владельца: ${question}\nОтветь 2–4 короткими предложениями, опираясь только на факты.`
        : `Факты (JSON): ${JSON.stringify(facts)}\nДля каждого действия из facts.actions напиши одну короткую фразу-совет (до 90 символов, повелительное наклонение, без чисел). Ответ строго JSON: {"actions": {"<id>": "<фраза>"}}`;
    const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.NVIDIA_MODEL || "meta/llama-3.3-70b-instruct",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!r.ok) return NextResponse.json({ ai: false, reason: `http-${r.status}` });
    const j = await r.json();
    const text: string = j.choices?.[0]?.message?.content ?? "";
    // проверка: все числа ≥ 100 в ответе должны встречаться в фактах
    const factStr = JSON.stringify(facts).replace(/\s/g, "");
    const nums = (text.replace(/(\d)\s(?=\d{3})/g, "$1").match(/\d{3,}/g) ?? []).filter((n) => !factStr.includes(n));
    if (nums.length) return NextResponse.json({ ai: false, reason: "invented-numbers" });
    if (mode === "ask") return NextResponse.json({ ai: true, answer: text.trim() });
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : null;
    if (!parsed?.actions) return NextResponse.json({ ai: false, reason: "bad-json" });
    return NextResponse.json({ ai: true, actions: parsed.actions });
  } catch (e) {
    return NextResponse.json({ ai: false, reason: String(e).slice(0, 100) });
  }
}
