"use client";

import { Wallet } from "lucide-react";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { human, humanWd } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useGo } from "./shell";
import { openMoreSub } from "./more";

/** Главная цифра: свободно = деньги сейчас − резерв на налог − платежи на 14 дней − страховой запас (7 дней расходов). */
export function FreeMoney() {
  const { a, lang } = useApp();
  const go = useGo();
  if (!a) return null;
  const f = a.free;
  const kz = lang === "kz";
  const tone = f.value < 0 ? "red" : f.value < f.safety ? "amber" : "green";
  const bg = { red: "from-red-600 to-rose-800", amber: "from-amber-500 to-orange-600", green: "from-emerald-600 to-emerald-800" }[tone];
  const rows = [
    { l: kz ? "Қазір ақша" : "Деньги сейчас", v: f.cash, sign: "" },
    { l: kz ? `Салық резерві (${a.tax.periodLabel})` : `Резерв на налог (${a.tax.periodLabel})`, v: f.taxReserve, sign: "−", go: true },
    ...f.payments.map((p) => ({ l: `${p.name} · ${human(p.due, lang)}`, v: p.amount, sign: "−" })),
    { l: kz ? "Сақтық қор (7 күн шығын)" : "Страховой запас (7 дней расходов)", v: f.safety, sign: "−" },
  ];
  return (
    <div className={cn("rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg", bg)} data-tour="free">
      <div className="flex items-center gap-2 text-sm opacity-90">
        <Wallet className="size-4" /> {kz ? "Бүгін бос ақша" : "Свободные деньги сегодня"}
      </div>
      <div className="mt-1 text-4xl sm:text-5xl font-bold tracking-tight tabular-nums">{money(f.value)}</div>
      <div className="text-sm opacity-90 mt-1">
        {tone === "green" && (kz ? "Бұл ақшаны еркін жұмсауға болады" : "Можно тратить без риска для обязательств")}
        {tone === "amber" && (kz ? "Сақ болыңыз: қор аз" : "Осторожно: запас тонкий, крупные траты отложите")}
        {tone === "red" &&
          (a.gap
            ? kz
              ? `Міндеттемелерге жетпейді. Кассалық үзіліс: ${humanWd(a.gap.date, "kz")} (−${money(a.gap.shortfall)})`
              : `Не хватает на обязательства. Кассовый разрыв: ${humanWd(a.gap.date)} (−${money(a.gap.shortfall)})`
            : kz
              ? "Міндеттемелер мен қорға ақша жетпейді — бос ақша жоқ"
              : "На обязательства и запас денег не хватает — свободных денег нет")}
      </div>
      <details className="mt-3 rounded-xl bg-black/15 px-3 py-2 text-sm">
        <summary className="cursor-pointer select-none opacity-90">{kz ? "Неден шегердік" : "Из чего вычли"}</summary>
        <div className="mt-2 space-y-1">
          {rows.map((r, i) => (
            <div key={i} className="flex justify-between gap-3">
              <span className="opacity-90 truncate">
                {r.go ? (
                  <button className="underline underline-offset-2" onClick={() => (openMoreSub("tax"), go("more"))}>
                    {r.l}
                  </button>
                ) : (
                  r.l
                )}
              </span>
              <span className="tabular-nums shrink-0">
                {r.sign}
                {money(r.v)}
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t border-white/30 pt-1 font-semibold">
            <span>{kz ? "Бос" : "Свободно"}</span>
            <span className="tabular-nums">{money(f.value)}</span>
          </div>
        </div>
      </details>
    </div>
  );
}
