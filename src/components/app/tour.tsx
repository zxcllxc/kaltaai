"use client";

import { useEffect, useState } from "react";
import { X, ChevronRight, Pause, Play } from "lucide-react";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { human } from "@/lib/dates";
import type { Tab } from "./shell";

interface Step {
  tab: Tab;
  el?: string;
  text: string;
}

const STEP_MS = 14_000;

export function Tour({ go, onClose }: { go: (t: Tab) => void; onClose: () => void }) {
  const { a } = useApp();
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(true);
  const steps: Step[] = a
    ? [
        { tab: "home", el: "demo-badge", text: "Это демо-магазин в Таразе (сгенерированные данные, помечены). Владелец загрузил 60 дней продаж и закупок — CSV, Excel или выгрузку Kaspi." },
        { tab: "home", el: "found", text: `За секунду финдиректор нашёл ${money(a.found.total)}: замороженный товар, слабый день недели и подорожание у поставщика.` },
        { tab: "home", el: "gap", text: a.gap ? `Главное: ${human(a.gap.date)} денег не хватит ${money(a.gap.shortfall)}. Блокнот этого не покажет — тут считаются будущие платежи.` : "Кассового разрыва в ближайшие 14 дней нет." },
        { tab: "forecast", el: "whatif", text: "«Что если»: двигаем скидку на залежавшийся товар и перенос платежа — прогноз и разрыв пересчитываются мгновенно." },
        { tab: "leaks", text: "Утечки в ₸: мёртвые остатки, слабый вторник, рост закупочных цен, ABC-анализ и маржа по каждому товару." },
        { tab: "todo", el: "roi", text: `3–5 действий на человеческом языке с эффектом в ₸ и сроком. Отмечаете «выполнено» — копится реальная экономия и окупаемость.` },
        { tab: "chat", text: "Каждое утро — брифинг в стиле Telegram. И можно спросить: «что будет, если не заплачу поставщику до пятницы?» — ответ по цифрам." },
        { tab: "more", el: "more-tabs", text: "Ещё: календарь платежей с опасными неделями, генератор акций с постами RU/KZ, паспорт финансового здоровья в PDF для банка." },
      ]
    : [];
  const s = steps[i];

  useEffect(() => {
    if (!s) return;
    go(s.tab);
    let el: Element | null = null;
    const t = setTimeout(() => {
      el = s.el ? document.querySelector(`[data-tour="${s.el}"]`) : null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("tour-hl");
    }, 250);
    return () => {
      clearTimeout(t);
      document.querySelectorAll(".tour-hl").forEach((x) => x.classList.remove("tour-hl"));
    };
  }, [i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!play) return;
    const t = setTimeout(() => (i < steps.length - 1 ? setI(i + 1) : setPlay(false)), STEP_MS);
    return () => clearTimeout(t);
  }, [i, play, steps.length]);

  if (!s) return null;
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 px-3 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-3xl rounded-2xl bg-zinc-900 text-white shadow-2xl p-4 dark:bg-zinc-100 dark:text-zinc-900">
        <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
          <span>
            Демо за 2 минуты · {i + 1}/{steps.length}
          </span>
          <div className="flex-1 h-1 rounded bg-white/20 dark:bg-black/20 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
          </div>
          <button onClick={() => setPlay(!play)} aria-label="Пауза">
            {play ? <Pause className="size-4" /> : <Play className="size-4" />}
          </button>
          <button onClick={onClose} aria-label="Закрыть">
            <X className="size-4" />
          </button>
        </div>
        <p className="text-sm leading-snug">{s.text}</p>
        <div className="mt-2 flex justify-between">
          <button className="text-xs opacity-70 disabled:opacity-30" disabled={i === 0} onClick={() => setI(i - 1)}>
            ← Назад
          </button>
          {i < steps.length - 1 ? (
            <button className="text-sm font-semibold text-emerald-400 dark:text-emerald-700 inline-flex items-center" onClick={() => setI(i + 1)}>
              Далее <ChevronRight className="size-4" />
            </button>
          ) : (
            <button className="text-sm font-semibold text-emerald-400 dark:text-emerald-700" onClick={onClose}>
              Готово ✓
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
