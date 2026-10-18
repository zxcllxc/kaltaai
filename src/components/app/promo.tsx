"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money, sellThrough, type ItemStat } from "@/lib/analytics";
import { addDays, dueDate, fmtDate, human, parseDate } from "@/lib/dates";
import { dn } from "@/lib/demo";
import { DEMO_AI } from "@/lib/demo-ai";
import { FLAGS } from "@/lib/flags";
import { AiBadge, callAI } from "./ai";

function discountFor(d: ItemStat) {
  return d.daysNoSale >= 60 ? 0.4 : d.daysNoSale >= 45 ? 0.3 : 0.25;
}

export function Promo() {
  const { a, ds, t, lang } = useApp();
  if (!a || !ds) return null;
  if (!a.dead.length) return <p className="text-sm text-muted-foreground">{t.noDeadPromo}</p>;
  const until = fmtDate(addDays(parseDate(ds.today), 7));
  const cached = ds.isDemo && FLAGS.aiCache ? DEMO_AI[ds.biz]?.promo : undefined;
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{t.promoIntro}</p>
      {a.dead.slice(0, 3).map((d) => {
        const disc = discountFor(d);
        const pct = Math.round(disc * 100);
        const price = Math.round((d.retail * (1 - disc)) / 10) * 10;
        const st = sellThrough(disc);
        const rev = d.stockQty * price * st;
        const ru = `🔥 Только до ${human(until)}! ${d.name} со скидкой ${pct}% — всего ${money(price)} вместо ${money(d.retail)}. Осталось ${d.stockQty} шт. Ждём вас в Таразе! Пишите в WhatsApp — отложим для вас.`;
        const kz = `🔥 ${dueDate(until, "kz")} дейін ғана! ${dn(d.name, "kz")} — ${pct}% жеңілдікпен, бар болғаны ${money(price)} (${money(d.retail)} орнына). Небәрі ${d.stockQty} дана қалды. Таразда күтеміз! WhatsApp-қа жазыңыз — сізге сақтап қоямыз.`;
        const pre = cached?.[d.name];
        const preset = pre ? { ru: pre.ru.replaceAll("{until}", human(until)), kz: pre.kz.replaceAll("{until}", dueDate(until, "kz")) } : null;
        return (
          <Card key={d.name}>
            <CardContent className="space-y-3">
              <div className="flex justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-semibold break-words">{dn(d.name, lang)}</h2>
                  <div className="text-xs text-muted-foreground">{t.promoCard(d.stockQty, d.daysNoSale, money(d.frozen))}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-red-700 dark:text-red-400">−{pct}%</div>
                  <div className="text-xs text-muted-foreground">{t.days7}</div>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-sm">{t.expected(money(rev), Math.round(st * 100), money(price))}</div>
              <Post label="RU" text={ru} />
              <Post label="KZ" text={kz} />
              <AiPosts preset={preset} facts={{ item: d.name, itemKz: dn(d.name, "kz"), price: money(price), oldPrice: money(d.retail), discount: `${pct}%`, untilRu: human(until), untilKz: dueDate(until, "kz"), left: String(d.stockQty), city: "Тараз" }} />
            </CardContent>
          </Card>
        );
      })}
      <p className="text-xs text-muted-foreground">{t.promoFoot}</p>
    </div>
  );
}

function AiPosts({ facts, preset }: { facts: Record<string, string>; preset: { ru: string; kz: string } | null }) {
  const { t } = useApp();
  const [st, setSt] = useState<"idle" | "loading" | "fail" | { ru: string; kz: string }>(preset ?? "idle");
  if (typeof st === "object")
    return (
      <>
        <Post label="RU" text={st.ru} ai />
        <Post label="KZ" text={st.kz} ai />
      </>
    );
  return (
    <button
      className="w-full rounded-lg border border-violet-500/40 py-2 text-sm text-violet-800 dark:text-violet-300 disabled:opacity-60"
      disabled={st === "loading"}
      onClick={async () => {
        setSt("loading");
        const r = await callAI<{ ru: string; kz: string }>("promo", facts);
        setSt(r?.ru && r?.kz ? { ru: r.ru, kz: r.kz } : "fail");
      }}
    >
      {st === "loading" ? t.aiWriting : st === "fail" ? t.aiFail : t.aiPost}
    </button>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // встроенные браузеры без Clipboard API
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function Post({ label, text, ai = false }: { label: string; text: string; ai?: boolean }) {
  const { t } = useApp();
  const [ok, setOk] = useState(false);
  return (
    <div className="rounded-lg border p-2 text-sm space-y-2">
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground inline-flex items-center gap-1">
          {label} <AiBadge ai={ai} />
        </span>
        <div className="flex gap-3">
          <a className="text-xs text-emerald-800 dark:text-emerald-300 underline" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <button
            className="text-xs inline-flex items-center gap-1"
            onClick={async () => {
              if (await copyText(text)) {
                setOk(true);
                setTimeout(() => setOk(false), 1500);
              }
            }}
          >
            {ok ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />} {ok ? t.copied : t.copy}
          </button>
        </div>
      </div>
      <p className="whitespace-pre-line break-words">{text}</p>
    </div>
  );
}
