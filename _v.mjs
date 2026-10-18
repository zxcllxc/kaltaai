import fs from "fs";
const key = fs.readFileSync(".env.local","utf8").match(/NVIDIA_API_KEY\s*=\s*["']?([^"'\r\n\s]+)/)?.[1];
const img = fs.readFileSync(process.argv[2]).toString("base64");
const prompt = 'На фото — страница тетради или чек малого бизнеса. Перепиши каждую строку с деньгами. Формат строки обычно: название — количество — сумма; ПОСЛЕДНЕЕ число в строке — сумма в тенге, число перед «шт/кг» — количество. Если в строке одно число — это сумма. type: sale (продажа), purchase (закуп у поставщика), expense (аренда, зарплата, налоги, коммуналка). Дату из заголовка верни как "ДД.ММ" или null. Ответ строго JSON без пояснений: {"date":"ДД.ММ","rows":[{"item":"...","qty":число|null,"amount":число,"type":"sale"}]}';
const runs = [
  ["meta/llama-3.2-11b-vision-instruct", [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }] }], {}],
  ["nvidia/nemotron-3.5-super-vl-120b-a12b", [{ role: "system", content: "detailed thinking off" }, { role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }] }], { max_tokens: 1500 }],
  ["nvidia/nemotron-3.5-super-vl-120b-a12b", [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: `data:image/jpeg;base64,${img}` } }] }], { max_tokens: 1500, reasoning_effort: "low", chat_template_kwargs: { enable_thinking: false } }],
];
await Promise.all(runs.map(async ([m, messages, extra], i) => {
  const t = Date.now();
  try {
    const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: m, messages, max_tokens: 900, temperature: 0.1, ...extra }), signal: AbortSignal.timeout(50000) });
    const j = await r.json(); const c = j.choices?.[0]?.message?.content;
    console.log("==", i, m, r.status, Date.now() - t + "ms\n", String(c ?? JSON.stringify(j).slice(0, 300)).replace(/\s+/g, " ").slice(0, 600));
  } catch (e) { console.log("==", i, m, "ERR", String(e).slice(0, 60), Date.now() - t); }
}));
