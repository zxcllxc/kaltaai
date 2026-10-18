"use client";

import { Wallet } from "lucide-react";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { dueDate, human, longDate } from "@/lib/dates";
import { dn } from "@/lib/demo";
import { storyText } from "@/lib/texts";
import { cn } from "@/lib/utils";
import { useGo } from "./shell";
import { openMoreSub } from "./more";

/** Главная цифра: свободно сегодня = самая низкая точка остатка за 14 дней − резерв (налог + 7 дней расходов). */
export function FreeMoney() {
  const { a, lang, t } = useApp();
  const go = useGo();
  if (!a) return null;
  const s = a.story;
  const st = storyText(s, a, lang);
  const tone = s.free < 0 ? "red" : s.free < a.safety * 0.5 ? "amber" : "green";
  const bg = { red: "from-red-700 to-rose-900", amber: "from-amber-600 to-orange-700", green: "from-emerald-700 to-emerald-900" }[tone];
  const b = s.breakdown;
  const until = s.criticalIndex >= 0 ? (lang === "kz" ? dueDate(s.critical, "kz") : human(s.critical, lang)) : null;
  return (
    <section className={cn("rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg", bg)} data-tour="free" aria-labelledby="free-title">
      <h2 id="free-title" className="flex items-center gap-2 text-sm font-medium opacity-95">
        <Wallet className="size-4" aria-hidden /> {t.freeTitle}
      </h2>
      <div className="mt-1 text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">{money(s.free)}</div>
      <p className="mt-2 text-base font-medium leading-snug">{st.sentence}</p>
      {st.cause && <p className="mt-1 text-sm opacity-90">{st.cause}</p>}
      <p className="mt-2 text-xs opacity-85">{st.reserveLine}</p>
      <details className="mt-3 rounded-xl bg-black/20 px-3 py-2 text-sm">
        <summary className="cursor-pointer select-none font-medium">{t.breakdownTitle}</summary>
        <div className="mt-2 space-y-1">
          <Row l={t.bdCash} v={money(b.cash)} />
          {until && (
            <>
              <Row l={t.bdInflow(until)} v={"+" + money(b.inflow)} />
              <Row l={t.bdPurch(until)} v={"−" + money(b.purchases)} />
              {b.payments.map((p, i) => (
                <Row key={i} l={`− ${dn(p.name, lang)} · ${human(p.due, lang)}`} v={"−" + money(p.amount)} />
              ))}
            </>
          )}
          {b.taxReserve > 0 && (
            <Row
              l={
                <button className="text-left underline underline-offset-2" onClick={() => (openMoreSub("tax"), go("more"))}>
                  {t.bdTax}
                </button>
              }
              v={"−" + money(b.taxReserve)}
            />
          )}
          <Row l={t.bdSafety} v={"−" + money(b.safety)} />
          <div className="flex justify-between gap-3 border-t border-white/30 pt-1 font-semibold">
            <span>{t.bdResult}</span>
            <span className="tabular-nums shrink-0">{money(s.free)}</span>
          </div>
          {until && <p className="pt-1 text-xs opacity-85">{t.bdHardest(longDate(s.critical, lang))}</p>}
        </div>
      </details>
    </section>
  );
}

function Row({ l, v }: { l: React.ReactNode; v: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="opacity-95 min-w-0 break-words">{l}</span>
      <span className="tabular-nums shrink-0">{v}</span>
    </div>
  );
}
