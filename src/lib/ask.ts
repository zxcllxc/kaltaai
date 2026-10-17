import { analyze, money, type Analysis } from "./analytics";
import { addDays, daysBetween, fmtDate, human, humanWd, parseDate, WD_RU_FULL } from "./dates";
import type { Dataset } from "./types";
import { NO_WHATIF } from "./types";

/** «Спроси финдиректора»: ответы строятся по посчитанным цифрам (без LLM). */

export const SUGGESTED = [
  "Почему упала выручка во вторник?",
  "Что будет, если не заплачу поставщику до пятницы?",
  "Когда закончатся деньги?",
  "Какой товар самый выгодный?",
  "Что залежалось на складе?",
];

const WD_RE: [RegExp, number][] = [
  [/понедельн|дүйсенбі/i, 1],
  [/вторн|сейсенбі/i, 2],
  [/сред|сәрсенбі/i, 3],
  [/четверг|бейсенбі/i, 4],
  [/пятниц|жұма/i, 5],
  [/суббот|сенбі/i, 6],
  [/воскрес|жексенбі/i, 0],
];

export function answer(q: string, a: Analysis, ds: Dataset): string {
  const s = q.toLowerCase();
  const wdHit = WD_RE.find(([re]) => re.test(s))?.[1];

  if (/не заплач|не плат|перенес|отложи|задерж|кейін/.test(s)) {
    const lp = a.largestPayment;
    if (!lp) return "В ближайшие 14 дней крупных платежей поставщикам в календаре нет — переносить нечего.";
    let target = wdHit ?? 5;
    let d = parseDate(lp.due);
    let k = 0;
    while (d.getDay() !== target && k < 7) {
      d = addDays(d, 1);
      k++;
    }
    if (k === 0) k = 7;
    const after = analyze(ds, { ...NO_WHATIF, delayDays: k });
    const before = a.gap;
    const g = after.gap;
    return [
      `Платёж «${lp.name}» на ${money(lp.amount)} по плану ${humanWd(lp.due)}. Если перенести его до ${humanWd(fmtDate(d))} (+${k} дн.):`,
      before ? `• сейчас разрыв ${human(before.date)} −${money(before.shortfall)}` : "• сейчас разрыва нет",
      g ? `• после переноса разрыв ${human(g.date)} −${money(g.shortfall)}` : "• после переноса разрыва в 14 днях нет ✅",
      `Риск: поставщик может придержать следующую отгрузку — договоритесь заранее и письменно.`,
    ].join("\n");
  }

  if (/почему|упал|просел|меньше|неге/.test(s) && (wdHit != null || /прибыл|выручк|продаж/.test(s))) {
    const wd = wdHit ?? a.weak?.wd;
    if (wd == null) return `За последние 4 недели выручка по дням недели ровная — сильных провалов нет. Средняя выручка в день: ${money(a.sales30 / 30)}.`;
    const avg = a.wdAvg[wd];
    const others = a.wdAvg.filter((_, i) => i !== wd && a.wdAvg[i] > 0);
    const med = others.sort((x, y) => x - y)[Math.floor(others.length / 2)] ?? avg;
    const drop = med > 0 ? 1 - avg / med : 0;
    if (drop < 0.08) return `${cap(WD_RU_FULL[wd])} — обычный день: ${money(avg)} против ${money(med)} в среднем. Провала нет.`;
    return [
      `В ${acc(wd)} выручка в среднем ${money(avg)} — на ${Math.round(drop * 100)}% ниже обычного дня (${money(med)}).`,
      `Это ≈ ${money((med - avg) * 4.3 * a.margin)} недополученной прибыли в месяц.`,
      `Что сделать: акция только в этот день («2+1», скидка до 12:00, комбо) и пост в WhatsApp накануне вечером.`,
    ].join("\n");
  }

  if (/когда|законч|кончат|разрыв|хватит|жетпе/.test(s)) {
    if (!a.gap) return `В ближайшие 14 дней кассового разрыва нет. Через 14 дней в кассе будет ≈ ${money(a.forecast.base[13].balance)}.`;
    const ev = a.forecast.base[a.gap.dayIndex].events;
    return [
      `Деньги закончатся ${humanWd(a.gap.date)} (через ${daysBetween(ds.today, a.gap.date)} дн.). Максимальная нехватка — ${money(a.gap.shortfall)}.`,
      ev.length ? `Причина: ${ev.map((e) => `${e.name} — ${money(e.amount)}`).join(", ")}.` : "",
      a.prevented > 0 ? `Распродажа залежавшегося и перенос платежа на неделю закрывают ${money(a.prevented)}.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (/выгодн|прибыльн|маржин|лучш|тиімді/.test(s)) {
    const top = a.items.filter((i) => i.profit != null).sort((x, y) => y.profit! - x.profit!).slice(0, 3);
    if (!top.length) return "Чтобы посчитать выгоду, нужны и продажи, и закупки по одним товарам.";
    const low = a.items.filter((i) => i.marginPct != null && i.revenue > 0).sort((x, y) => x.marginPct! - y.marginPct!)[0];
    return [
      `Больше всего прибыли за период:`,
      ...top.map((i, k) => `${k + 1}) ${i.name} — ${money(i.profit!)} (маржа ${Math.round(i.marginPct! * 100)}%)`),
      low ? `Самая низкая маржа: ${low.name} — ${Math.round(low.marginPct! * 100)}%.` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (/залеж|остат|склад|не прода|қалдық/.test(s)) {
    if (!a.dead.length) return "Залежавшегося товара (без продаж 30+ дней) нет.";
    return [`Без продаж 30+ дней лежит товара на ${money(a.frozenTotal)}:`, ...a.dead.map((d) => `• ${d.name}: ${d.stockQty} шт, ${money(d.frozen)}, ${d.daysNoSale} дн. без продаж`), `Совет: скидка 30% вернёт деньги в оборот за неделю.`].join("\n");
  }

  if (/постав|цен|подорож|закуп/.test(s)) {
    if (!a.rises.length) return "Заметного роста закупочных цен за последний месяц нет.";
    const r = a.rises[0];
    return `${r.supplier} поднял цены в среднем на ${Math.round(r.pct * 100)}% (${r.items.map((i) => i.name).join(", ")}). Переплата ≈ ${money(r.overpayMonth)} в месяц. Попросите старую цену или скидку за объём, параллельно запросите прайс у 2 конкурентов.`;
  }

  if (/сколько|заработ|прибыл|выручк|табыс/.test(s)) {
    return `За последние 30 дней: выручка ${money(a.sales30)}, закупки ${money(a.purchases30)}, прочие расходы ${money(a.expenses30)}. Прибыль ≈ ${money(a.profit30)}.`;
  }

  return `Я отвечаю по вашим цифрам. Сейчас главное: ${a.gap ? `разрыв ${human(a.gap.date)} на ${money(a.gap.shortfall)}` : "разрыва нет"}, заморожено ${money(a.frozenTotal)}. Спросите, например: «${SUGGESTED[1]}»`;
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function acc(wd: number) {
  return ["воскресенье", "понедельник", "вторник", "среду", "четверг", "пятницу", "субботу"][wd];
}
