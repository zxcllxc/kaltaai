import type { Action, Analysis } from "./analytics";
import { kmoney, money } from "./analytics";
import { human, WD_RU_ACC, WD_RU_FULL } from "./dates";
import type { Dataset } from "./types";

export type Lang = "ru" | "kz";

const WD_KZ_FULL = ["жексенбі", "дүйсенбі", "сейсенбі", "сәрсенбі", "бейсенбі", "жұма", "сенбі"];

/** Шаблонные тексты (фолбэк без LLM). Все числа берутся из analytics. */
export function actionText(a: Action, lang: Lang): { title: string; how: string } {
  const f = a.facts;
  if (lang === "kz") {
    switch (a.id) {
      case "dead":
        return { title: `Жатып қалған тауарды ${f.discount} жеңілдікпен сату`, how: `${f.items} — ${f.frozen} қатып тұр. Сөреге алға қойып, WhatsApp-қа жарнама жіберіңіз.` };
      case "delay":
        return { title: `Төлемді 7 күнге кейінге қалдыру туралы келісу`, how: `${f.payment} (${f.amount}, ${human(String(f.due), "kz")}). Жеткізушіге қазір қоңырау шалыңыз.` };
      case "supplier":
        return { title: `${f.supplier}: бағаны талқылау немесе балама табу`, how: `Сатып алу бағасы ${f.pct} өсті: ${f.items}.` };
      case "weak":
        return { title: `${WD_KZ_FULL[Number(f.wd)]} күні акция жасау`, how: `Бұл күні сауда ${f.drop} төмен. «2+1» немесе таңғы жеңілдік беріңіз.` };
      case "citems":
        return { title: `C-тобындағы тауарды 2 апта сатып алмау`, how: `${f.items} — сатылымның 5%-ы ғана, бірақ ақша алады.` };
    }
  }
  switch (a.id) {
    case "dead":
      return { title: `Распродать залежавшийся товар со скидкой ${f.discount}`, how: `${f.items} — заморожено ${f.frozen}. Выставить на кассу, разослать клиентам в WhatsApp.` };
    case "delay":
      return { title: `Договориться о переносе платежа на 7 дней`, how: `${f.payment} (${f.amount}, ${human(String(f.due))}). Позвонить поставщику сегодня, пока не поздно.` };
    case "supplier":
      return { title: `${f.supplier}: обсудить цену или найти замену`, how: `Закупочная цена выросла на ${f.pct}: ${f.items}. Попросить старую цену или скидку за объём.` };
    case "weak":
      return { title: `Сделать акцию ${Number(f.wd) === 2 ? "во" : "в"} ${WD_RU_ACC[Number(f.wd)]}`, how: `В этот день выручка на ${f.drop} ниже обычной. «2+1» или скидка до 12:00.` };
    case "citems":
      return { title: `Две недели не докупать товары группы C`, how: `${f.items} — дают ~5% выручки, но держат деньги.` };
  }
}

export function briefing(a: Analysis, ds: Dataset, lang: Lang, aiActions?: Record<string, string>): string[] {
  const msgs: string[] = [];
  const g = a.gap;
  if (lang === "kz") {
    msgs.push(`Қайырлы таң! ☀️ Бүгінгі қаржы брифингі${ds.isDemo ? " (демо-деректер)" : ""}.`);
    msgs.push(`Кассада қазір: ${money(ds.cash)}. Соңғы 30 күн: түсім ${kmoney(a.sales30)}, пайда ${kmoney(a.profit30)}.`);
    msgs.push(g ? `⚠️ ${human(g.date, "kz")} ақша жетпей қалуы мүмкін: −${money(g.shortfall)}.` : `✅ Алдағы 14 күнде кассалық үзіліс жоқ.`);
    if (a.frozenTotal > 0) msgs.push(`📦 Жатып қалған тауарда ${money(a.frozenTotal)} қатып тұр.`);
    if (a.rises[0]) msgs.push(`📈 ${a.rises[0].supplier} бағаны ${Math.round(a.rises[0].pct * 100)}% көтерді: айына +${money(a.rises[0].overpayMonth)}.`);
    a.actions.slice(0, 3).forEach((x, i) => msgs.push(`${i + 1}) ${actionText(x, "kz").title} → +${money(x.effect)}`));
    if (a.prevented > 0) msgs.push(`Осыны істесеңіз, ${money(a.prevented)} үзілісті болдырмайсыз. 💪`);
    return msgs;
  }
  msgs.push(`Доброе утро! ☀️ Ваш финансовый брифинг${ds.isDemo ? " (демо-данные)" : ""}.`);
  msgs.push(`В кассе сейчас: ${money(ds.cash)}. За 30 дней: выручка ${kmoney(a.sales30)}, прибыль ${kmoney(a.profit30)}.`);
  if (g) {
    const ev = a.forecast.base.find((d) => d.date === g.date)?.events[0];
    msgs.push(`⚠️ ${human(g.date)} остаток опустится ниже резерва на налог и запас: −${money(g.shortfall)}${ev ? ` — в этот день «${ev.name}» на ${money(ev.amount)}` : ""}.`);
  } else msgs.push(`✅ Кассового разрыва в ближайшие 14 дней нет.`);
  if (a.frozenTotal > 0) msgs.push(`📦 В залежавшемся товаре заморожено ${money(a.frozenTotal)} (${a.dead.length} поз.).`);
  if (a.weak) msgs.push(`📉 ${cap(WD_RU_FULL[a.weak.wd])} — слабый день: выручка на ${Math.round(a.weak.dropPct * 100)}% ниже.`);
  if (a.rises[0]) msgs.push(`📈 ${a.rises[0].supplier} поднял цены на ${Math.round(a.rises[0].pct * 100)}%: переплата ${money(a.rises[0].overpayMonth)} в месяц.`);
  msgs.push(`Что сделать сегодня:`);
  a.actions.slice(0, 3).forEach((x, i) => msgs.push(`${i + 1}) ${aiActions?.[x.id] ?? actionText(x, "ru").title} → +${money(x.effect)}`));
  if (a.prevented > 0) msgs.push(`Если сделать первые два шага — разрыв сокращается на ${money(a.prevented)}. 💪`);
  return msgs;
}

export function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Факты для LLM — только готовые числа строками. */
export function factsForLLM(a: Analysis, ds: Dataset) {
  return {
    business: ds.biz,
    demo: ds.isDemo,
    cash: money(ds.cash),
    gap: a.gap ? { date: human(a.gap.date), shortfall: money(a.gap.shortfall) } : null,
    frozen: money(a.frozenTotal),
    deadItems: a.dead.slice(0, 4).map((d) => d.name),
    weakDay: a.weak ? { day: WD_RU_FULL[a.weak.wd], drop: Math.round(a.weak.dropPct * 100) + "%" } : null,
    priceRise: a.rises[0] ? { supplier: a.rises[0].supplier, pct: Math.round(a.rises[0].pct * 100) + "%", overpayMonth: money(a.rises[0].overpayMonth) } : null,
    actions: a.actions.map((x) => ({ id: x.id, effect: money(x.effect), deadlineDays: x.deadlineDays, template: actionText(x, "ru").title, facts: x.facts })),
  };
}

export const T = {
  ru: {
    tagline: "ИИ-финдиректор для бизнеса Тараза",
    pick: "Какой у вас бизнес?",
    shop: "Магазин",
    cafe: "Кафе",
    salon: "Салон красоты",
    auto: "Автосервис",
    demo: "Загрузить демо-данные",
    upload: "Загрузить свой CSV / Excel",
    demoBadge: "демо-данные",
    found: "Мы нашли",
    foundSub: "денег, которые сейчас теряются или заморожены",
    frozen: "Замороженные остатки",
    weak: "Слабые дни (в мес.)",
    rise: "Рост закупок (в мес.)",
    forecast: "Деньги на 14 дней",
    gapAt: "Кассовый разрыв",
    noGap: "Разрыва нет",
    leaks: "Утечки",
    todo: "Что делать",
    chat: "Брифинг",
    plan: "План",
    home: "Главная",
    more: "Ещё",
    prevented: "Предотвращённый разрыв",
    frozenMoney: "Замороженные деньги",
    cash: "Деньги в кассе сейчас",
    effect: "Эффект",
    deadline: "Срок",
    days: "дн.",
    done: "Выполнено",
    deleteData: "Удалить мои данные",
  },
  kz: {
    tagline: "Тараз бизнесіне арналған ЖИ-қаржы директоры",
    pick: "Сіздің бизнесіңіз қандай?",
    shop: "Дүкен",
    cafe: "Кафе",
    salon: "Сұлулық салоны",
    auto: "Автосервис",
    demo: "Демо-деректерді жүктеу",
    upload: "Өз CSV / Excel файлыңызды жүктеу",
    demoBadge: "демо-деректер",
    found: "Біз таптық",
    foundSub: "қазір жоғалып не қатып тұрған ақша",
    frozen: "Қатып қалған қалдық",
    weak: "Әлсіз күндер (айына)",
    rise: "Сатып алу бағасының өсуі (айына)",
    forecast: "14 күнге ақша болжамы",
    gapAt: "Кассалық үзіліс",
    noGap: "Үзіліс жоқ",
    leaks: "Шығындар",
    todo: "Не істеу керек",
    chat: "Брифинг",
    plan: "Жоспар",
    home: "Басты",
    more: "Тағы",
    prevented: "Болдырмаған үзіліс",
    frozenMoney: "Қатып қалған ақша",
    cash: "Кассадағы ақша қазір",
    effect: "Әсері",
    deadline: "Мерзімі",
    days: "күн",
    done: "Орындалды",
    deleteData: "Деректерімді өшіру",
  },
};
export type Dict = (typeof T)["ru"];
