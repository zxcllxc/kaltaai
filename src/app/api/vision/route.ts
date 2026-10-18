import { NextResponse } from "next/server";

/** Фото тетради/чека → строки таблицы (vision-модель NVIDIA NIM). Пользователь проверяет и подтверждает строки сам. */

export const maxDuration = 45;

const ENDPOINT = "https://integrate.api.nvidia.com/v1/chat/completions";
const MODEL = process.env.NVIDIA_VISION_MODEL || "nvidia/nemotron-3.5-super-vl-120b-a12b";
const MAX_IMAGE = 2_000_000; // символов base64 (~1,5 МБ)

const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  for (const [key, win, max] of [
    [`ip:${ip}:min`, 60_000, 4],
    [`ip:${ip}:hour`, 3_600_000, 30],
    ["all:min", 60_000, 40],
  ] as [string, number, number][]) {
    const arr = (hits.get(key) ?? []).filter((t) => now - t < win);
    if (arr.length >= max) return true;
    arr.push(now);
    hits.set(key, arr);
  }
  if (hits.size > 5000) hits.clear();
  return false;
}

const PROMPT =
  'На фото — страница тетради или чек малого бизнеса. Перепиши каждую строку с деньгами. Формат строки обычно: название — количество — сумма; ПОСЛЕДНЕЕ число в строке — сумма в тенге, число перед «шт/кг/дана» — количество. Если в строке одно число — это сумма. type: sale (продажа, сатылым), purchase (закуп у поставщика, сатып алу), expense (аренда, зарплата, налоги, коммуналка). Дату из заголовка верни как "ДД.ММ" или null. Если на фото нет записей с деньгами — верни пустой список. Ответ строго JSON без пояснений: {"date":"ДД.ММ","rows":[{"item":"...","qty":число|null,"amount":число,"type":"sale"}]}';

export async function POST(req: Request) {
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return NextResponse.json({ ok: false, reason: "no-key" });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "anon";
  if (limited(ip)) return NextResponse.json({ ok: false, reason: "rate-limit" }, { status: 429 });
  let image = "";
  try {
    const raw = await req.text();
    if (raw.length > MAX_IMAGE + 200) return NextResponse.json({ ok: false, reason: "too-large" }, { status: 413 });
    image = String(JSON.parse(raw).image ?? "");
  } catch {
    return NextResponse.json({ ok: false, reason: "bad-request" }, { status: 400 });
  }
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image)) return NextResponse.json({ ok: false, reason: "bad-image" }, { status: 400 });

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 35_000);
  try {
    const r = await fetch(ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "detailed thinking off" },
          { role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: image } }] },
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
      signal: ctrl.signal,
    });
    if (!r.ok) return NextResponse.json({ ok: false, reason: `http-${r.status}` });
    const j = await r.json();
    const text = String(j.choices?.[0]?.message?.content ?? "");
    const m = text.match(/\{[\s\S]*\}/);
    const parsed = m ? JSON.parse(m[0]) : null;
    if (!parsed || !Array.isArray(parsed.rows)) return NextResponse.json({ ok: false, reason: "bad-json" });
    const rows = (parsed.rows as Record<string, unknown>[])
      .map((x) => ({
        item: String(x.item ?? "").trim().slice(0, 80),
        qty: Number.isFinite(Number(x.qty)) && Number(x.qty) > 0 ? Math.round(Number(x.qty) * 100) / 100 : null,
        amount: Math.round(Math.abs(Number(x.amount))),
        type: ["sale", "purchase", "expense"].includes(String(x.type)) ? String(x.type) : "sale",
      }))
      .filter((x) => x.item && Number.isFinite(x.amount) && x.amount > 0 && x.amount < 1e9)
      .slice(0, 60);
    const date = typeof parsed.date === "string" && /^\d{1,2}\.\d{1,2}$/.test(parsed.date) ? parsed.date : null;
    return NextResponse.json({ ok: true, date, rows, model: MODEL });
  } catch (e) {
    return NextResponse.json({ ok: false, reason: String(e).slice(0, 80) });
  } finally {
    clearTimeout(timer);
  }
}
