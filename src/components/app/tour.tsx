"use client";

import { useEffect, useState } from "react";
import { X, ChevronRight, Pause, Play } from "lucide-react";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { storyText } from "@/lib/texts";
import { FLAGS, TELEGRAM_BOT } from "@/lib/flags";
import type { Tab } from "./shell";

interface Step {
  tab: Tab;
  el?: string;
  text: string;
}

const STEP_MS = 14_000;

export function Tour({ go, onClose }: { go: (t: Tab) => void; onClose: () => void }) {
  const { a, lang } = useApp();
  const [i, setI] = useState(0);
  const [play, setPlay] = useState(true);
  const kz = lang === "kz";
  const st = a ? storyText(a.story, a, lang) : null;
  const tg = FLAGS.telegram ? (kz ? ` Әр таң сайын брифинг Telegram-да келеді — @${TELEGRAM_BOT}.` : ` А каждое утро брифинг приходит в Telegram — @${TELEGRAM_BOT}.`) : "";
  const steps: Step[] =
    a && st
      ? kz
        ? [
            { tab: "home", el: "demo-badge", text: "Бұл — Тараздағы демо-дүкен (жасанды деректер, белгіленген). Иесі 9 аптаның сатылымы мен сатып алуын жүктеді — CSV, Excel немесе Kaspi үзіндісі." },
            { tab: "home", el: "free", text: `Басты сан — «Бүгін бос ақша»: ${money(a.story.free)}. ${st.sentence} Мұнда болашақ төлемдер, салық пен қор ескерілген — дәптер мұны көрсетпейді.` },
            { tab: "home", el: "found", text: `Сондай-ақ KaltaAI ${money(a.found.total)} тапты: қатып қалған тауар, аптаның әлсіз күні және жеткізушінің қымбаттауы.` },
            { tab: "forecast", el: "whatif", text: "«Егер…»: жеткізуші төлемін кейінге қалдырамыз — жетіспеушілік жоғалады, «Бүгін бос ақша» бірден қайта есептеледі." },
            { tab: "leaks", text: "Теңгедегі шығындар: қозғалыссыз қалдық, әлсіз сейсенбі, сатып алу бағасының өсуі, ABC-талдау және әр тауардың маржасы." },
            { tab: "todo", el: "roi", text: "Адам тілімен 3–5 әрекет, әрқайсысының теңгедегі әсері мен мерзімі бар. «Орындалды» деп белгілесеңіз — нақты үнемдеу мен өтелу жиналады." },
            { tab: "chat", text: "Telegram стиліндегі таңғы брифинг. Бес сұрақ батырмасы: «Бүгін қанша ақша алуға болады?», «Салыққа қанша жинау керек?» — жауап сандар бойынша." },
            { tab: "more", el: "more-tabs", text: `2026 салық конверті (Тараз 2%), төлем күнтізбесі, RU/KZ посттары бар акциялар, банкке арналған PDF денсаулық паспорты.${tg}` },
          ]
        : [
            { tab: "home", el: "demo-badge", text: "Это демо-магазин в Таразе (сгенерированные данные, помечены). Владелец загрузил 9 недель продаж и закупок — CSV, Excel или выгрузку Kaspi." },
            { tab: "home", el: "free", text: `Главная цифра — «Свободно сегодня»: ${money(a.story.free)}. ${st.sentence} Здесь учтены будущие платежи, налог и запас — блокнот этого не покажет.` },
            { tab: "home", el: "found", text: `Ещё KaltaAI нашёл ${money(a.found.total)}: замороженный товар, слабый день недели и подорожание у поставщика.` },
            { tab: "forecast", el: "whatif", text: "«Что если»: переносим платёж поставщику — нехватка исчезает, «Свободно сегодня» пересчитывается мгновенно." },
            { tab: "leaks", text: "Утечки в ₸: мёртвые остатки, слабый вторник, рост закупочных цен, ABC-анализ и маржа по каждому товару." },
            { tab: "todo", el: "roi", text: "3–5 действий на человеческом языке с эффектом в ₸ и сроком. Отмечаете «выполнено» — копится реальная экономия и окупаемость." },
            { tab: "chat", text: "Утренний брифинг в стиле Telegram. Пять кнопок-вопросов: «Сколько можно забрать сегодня?», «Сколько отложить на налог?» — ответ по цифрам." },
            { tab: "more", el: "more-tabs", text: `Налоговый конверт 2026 (Тараз 2%), календарь платежей, акции с постами RU/KZ, паспорт финансового здоровья в PDF для банка.${tg}` },
          ]
      : [];
  const s = steps[i];

  useEffect(() => {
    if (!s) return;
    go(s.tab);
    const t = setTimeout(() => {
      const el = s.el ? document.querySelector(`[data-tour="${s.el}"]`) : null;
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.classList.add("tour-hl");
    }, 300);
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
    <div className="fixed inset-x-0 bottom-16 z-40 px-3 pb-[env(safe-area-inset-bottom)]" role="dialog" aria-live="polite" aria-label={kz ? "2 минуттық демо" : "Демо за 2 минуты"}>
      <div className="mx-auto max-w-3xl rounded-2xl bg-zinc-900 text-white shadow-2xl p-4 dark:bg-zinc-100 dark:text-zinc-900">
        <div className="flex items-center gap-2 text-xs opacity-80 mb-1">
          <span>
            {kz ? "2 минуттық демо" : "Демо за 2 минуты"} · {i + 1}/{steps.length}
          </span>
          <div className="flex-1 h-1 rounded bg-white/20 dark:bg-black/20 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
          </div>
          <button onClick={() => setPlay(!play)} aria-label={play ? (kz ? "Кідірту" : "Пауза") : kz ? "Жалғастыру" : "Продолжить"}>
            {play ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
          </button>
          <button onClick={onClose} aria-label={kz ? "Жабу" : "Закрыть"}>
            <X className="size-4" aria-hidden />
          </button>
        </div>
        <p className="text-sm leading-snug">{s.text}</p>
        <div className="mt-2 flex justify-between">
          <button className="text-xs opacity-80 disabled:opacity-30" disabled={i === 0} onClick={() => setI(i - 1)}>
            ← {kz ? "Артқа" : "Назад"}
          </button>
          {i < steps.length - 1 ? (
            <button className="text-sm font-semibold text-emerald-300 dark:text-emerald-800 inline-flex items-center" onClick={() => setI(i + 1)}>
              {kz ? "Әрі қарай" : "Далее"} <ChevronRight className="size-4" aria-hidden />
            </button>
          ) : (
            <button className="text-sm font-semibold text-emerald-300 dark:text-emerald-800" onClick={onClose}>
              {kz ? "Дайын ✓" : "Готово ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
