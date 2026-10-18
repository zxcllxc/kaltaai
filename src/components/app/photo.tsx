"use client";

import { useRef, useState } from "react";
import { Camera, Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { fmtDate } from "@/lib/dates";
import { money } from "@/lib/analytics";
import type { Row, RowType } from "@/lib/types";

const L = {
  ru: {
    button: "📷 Фото тетради или чека",
    hint: "Сфотографируйте страницу целиком при хорошем свете. ИИ перепишет строки, а вы проверите их перед записью.",
    reading: "ИИ читает фото… обычно 10–20 секунд",
    check: "Проверьте строки — запишем только после «Да»",
    date: "Дата записей",
    item: "Название",
    qty: "Кол-во",
    amount: "Сумма, ₸",
    type: "Тип",
    sale: "Продажа",
    purchase: "Закупка",
    expense: "Расход",
    yes: "Да, записать",
    no: "Нет",
    empty: "На фото не нашли записей с суммами. Попробуйте другое фото.",
    fail: "Не получилось распознать фото. Попробуйте ещё раз или загрузите файл.",
    limit: "Слишком много фото подряд — подождите минуту.",
    total: (n: number, s: string) => `${n} строк на ${s}`,
    source: "Фото тетради",
  },
  kz: {
    button: "📷 Дәптер немесе чек фотосы",
    hint: "Бетті жарықта толық суретке түсіріңіз. ЖИ жолдарды көшіреді, ал сіз оларды жазбас бұрын тексересіз.",
    reading: "ЖИ фотоны оқып жатыр… әдетте 10–20 секунд",
    check: "Жолдарды тексеріңіз — «Иә» дегеннен кейін ғана жазамыз",
    date: "Жазбалар күні",
    item: "Атауы",
    qty: "Саны",
    amount: "Сомасы, ₸",
    type: "Түрі",
    sale: "Сатылым",
    purchase: "Сатып алу",
    expense: "Шығыс",
    yes: "Иә, жазу",
    no: "Жоқ",
    empty: "Фотодан сомасы бар жазба табылмады. Басқа фото жіберіп көріңіз.",
    fail: "Фотоны тану мүмкін болмады. Қайталап көріңіз немесе файл жүктеңіз.",
    limit: "Фото тым көп — бір минут күтіңіз.",
    total: (n: number, s: string) => `${n} жол, жалпы ${s}`,
    source: "Дәптер фотосы",
  },
};

interface Draft {
  item: string;
  qty: string;
  amount: string;
  type: RowType;
  on: boolean;
}

/** Уменьшаем фото в браузере до ~1280 px, чтобы быстро отправить по мобильному интернету. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const k = Math.min(1, 1280 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toIso(ddmm: string | null) {
  const now = new Date();
  if (!ddmm) return fmtDate(now);
  const [d, m] = ddmm.split(".").map(Number);
  let dt = new Date(now.getFullYear(), m - 1, d);
  if (dt.getTime() > now.getTime() + 86_400_000) dt = new Date(now.getFullYear() - 1, m - 1, d);
  return isNaN(dt.getTime()) ? fmtDate(now) : fmtDate(dt);
}

export function PhotoImport() {
  const { lang, biz, appendRows } = useApp();
  const l = L[lang];
  const ref = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<"idle" | "loading" | "check">("idle");
  const [err, setErr] = useState("");
  const [date, setDate] = useState(fmtDate(new Date()));
  const [rows, setRows] = useState<Draft[]>([]);

  async function onFile(f: File) {
    setErr("");
    setState("loading");
    try {
      const image = await shrink(f);
      // одна автоматическая повторная попытка: vision-модель иногда отвечает ошибкой с первого раза
      let r: Response | null = null;
      let j: { ok?: boolean; rows?: unknown[]; date?: string | null } = {};
      for (let attempt = 0; attempt < 2; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 45_000);
        try {
          r = await fetch("/api/vision", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }), signal: ctrl.signal });
          j = await r.json();
        } catch {
          j = {};
        } finally {
          clearTimeout(timer);
        }
        if (j.ok || r?.status === 429) break;
      }
      if (!r) throw new Error("fail");
      if (r.status === 429) throw new Error("limit");
      if (!j.ok) throw new Error("fail");
      if (!j.rows?.length) {
        setErr(l.empty);
        setState("idle");
        return;
      }
      setDate(toIso(j.date ?? null));
      setRows((j.rows as { item: string; qty: number | null; amount: number; type: RowType }[]).map((x: { item: string; qty: number | null; amount: number; type: RowType }) => ({ item: x.item, qty: x.qty == null ? "" : String(x.qty), amount: String(x.amount), type: x.type, on: true })));
      setState("check");
    } catch (e) {
      setErr((e as Error).message === "limit" ? l.limit : l.fail);
      setState("idle");
    } finally {
      if (ref.current) ref.current.value = "";
    }
  }

  function confirm() {
    const out: Row[] = rows
      .filter((r) => r.on && r.item.trim() && Number(r.amount) > 0)
      .map((r) => ({ date, type: r.type, item: r.item.trim(), qty: Number(r.qty) > 0 ? Number(r.qty) : 1, amount: Math.round(Number(r.amount)), category: r.type === "expense" ? "Прочее" : undefined }));
    if (out.length) appendRows(out, l.source, biz);
    setRows([]);
    setState("idle");
  }

  const upd = (i: number, p: Partial<Draft>) => setRows(rows.map((r, k) => (k === i ? { ...r, ...p } : r)));
  const sum = rows.filter((r) => r.on).reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const inp = "w-full min-w-0 rounded-md border bg-background px-2 py-1.5 text-sm";

  return (
    <div className="space-y-2">
      {state !== "check" && (
        <Button variant="outline" size="lg" className="h-12 w-full" disabled={state === "loading"} onClick={() => ref.current?.click()}>
          <Camera className="size-5" aria-hidden /> {state === "loading" ? l.reading : l.button}
        </Button>
      )}
      <input ref={ref} type="file" accept="image/*" capture="environment" className="hidden" aria-label={l.button} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      {state === "idle" && !err && <p className="text-xs text-muted-foreground text-center">{l.hint}</p>}
      {err && (
        <p role="alert" className="rounded-lg bg-red-500/10 p-2 text-sm text-red-800 dark:text-red-300">
          {err}
        </p>
      )}
      {state === "check" && (
        <Card>
          <CardContent className="space-y-3">
            <div className="font-semibold">{l.check}</div>
            <label className="flex items-center gap-2 text-sm">
              {l.date}
              <input type="date" className={inp + " w-auto"} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            </label>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className={`grid grid-cols-[auto_1fr] gap-2 border-t pt-2 ${r.on ? "" : "opacity-50"}`}>
                  <input type="checkbox" className="mt-2" checked={r.on} aria-label={r.item} onChange={(e) => upd(i, { on: e.target.checked })} />
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <input className={inp + " col-span-2"} aria-label={l.item} value={r.item} onChange={(e) => upd(i, { item: e.target.value })} />
                    <input className={inp + " text-right"} aria-label={l.qty} inputMode="decimal" placeholder={l.qty} value={r.qty} onChange={(e) => upd(i, { qty: e.target.value })} />
                    <input className={inp + " text-right"} aria-label={l.amount} inputMode="numeric" value={r.amount} onChange={(e) => upd(i, { amount: e.target.value.replace(/[^\d]/g, "") })} />
                    <select className={inp + " col-span-2 sm:col-span-4"} aria-label={l.type} value={r.type} onChange={(e) => upd(i, { type: e.target.value as RowType })}>
                      <option value="sale">{l.sale}</option>
                      <option value="purchase">{l.purchase}</option>
                      <option value="expense">{l.expense}</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground">{l.total(rows.filter((r) => r.on).length, money(sum))}</div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={confirm}>
                <Check className="size-4" aria-hidden /> {l.yes}
              </Button>
              <Button variant="outline" onClick={() => (setRows([]), setState("idle"))}>
                <X className="size-4" aria-hidden /> {l.no}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
