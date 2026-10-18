import type { Biz, CalendarItem, Dataset, Row } from "./types";
import { addDays, fmtDate } from "./dates";

/** Демо-данные маленьких точек Тараза. Детерминированные и «не едут» по датам:
 *  - история 9 полных недель; шум продаж зависит от (день недели, номер недели назад),
 *    поэтому любые суммы за 4 недели одинаковы в любой день;
 *  - все платежи стоят относительно сегодняшнего дня: крупная оплата поставщику — через 9 дней;
 *  - остаток в кассе подбирается точно под целевую «Свободно сегодня» (см. demoDataset в analytics.ts).
 *  Заложенные закономерности: мёртвые остатки 95–117 тыс ₸, слабый вторник (−38%),
 *  рост закупочной цены у одного поставщика на +13,5% за последние 4 недели. */

interface ItemDef {
  name: string;
  kz: string;
  price: number; // цена продажи за ед. (0 — сырьё, не продаётся)
  cost: number; // закупка за ед.
  supplier: string;
  base: number; // продаж в обычный день, шт
  rise?: boolean; // у этого поставщика выросла цена
  dead?: number; // закупили столько шт 9 недель назад, продажи встали
}

interface BizProfile {
  title: string;
  titleKz: string;
  name: string;
  nameKz: string;
  items: ItemDef[];
  rent: number;
  utilities: number;
  salary: number;
  supplierInvoice: { name: string; nameKz: string; amount: number };
  scale: number; // множитель объёма продаж
  /** целевая «Свободно сегодня», ₸ (отрицательная: через 9 дней деньги уйдут в налоговый резерв) */
  targetFree: number;
}

export const BIZ_LIST: { id: Biz; emoji: string }[] = [
  { id: "shop", emoji: "🛒" },
  { id: "cafe", emoji: "☕" },
  { id: "salon", emoji: "💇" },
  { id: "auto", emoji: "🔧" },
];

/** Через сколько дней крупный платёж поставщику (момент нехватки) */
export const DEMO_GAP_DAY = 9;
/** Длина истории: 9 полных недель */
export const DEMO_HISTORY_DAYS = 63;

export const PROFILES: Record<Biz, BizProfile> = {
  shop: {
    title: "Магазин продуктов",
    titleKz: "Азық-түлік дүкені",
    name: "Магазин «Береке», мкр. Аса, Тараз",
    nameKz: "«Береке» дүкені, Аса ш/а, Тараз",
    rent: 120_000,
    utilities: 35_000,
    salary: 160_000,
    scale: 0.65,
    targetFree: -47_300,
    supplierInvoice: { name: "ТОО «Тараз-Опт» — оплата накладной", nameKz: "«Тараз-Опт» ЖШС — жүкқұжат төлемі", amount: 260_000 },
    items: [
      { name: "Хлеб «Тараз-Нан»", kz: "«Тараз-Нан» наны", price: 180, cost: 130, supplier: "Тараз-Нан", base: 60 },
      { name: "Молоко 1 л", kz: "Сүт 1 л", price: 520, cost: 410, supplier: "ТОО «Жамбыл-Сут»", base: 30, rise: true },
      { name: "Кефир 1 л", kz: "Кефир 1 л", price: 560, cost: 440, supplier: "ТОО «Жамбыл-Сут»", base: 14, rise: true },
      { name: "Сметана 400 г", kz: "Қаймақ 400 г", price: 790, cost: 610, supplier: "ТОО «Жамбыл-Сут»", base: 9, rise: true },
      { name: "Масло подсолнечное 1 л", kz: "Күнбағыс майы 1 л", price: 1150, cost: 900, supplier: "ТОО «Тараз-Опт»", base: 8 },
      { name: "Сахар 1 кг", kz: "Қант 1 кг", price: 520, cost: 420, supplier: "ТОО «Тараз-Опт»", base: 12 },
      { name: "Чай «Пиала» 250 г", kz: "«Пиала» шайы 250 г", price: 1450, cost: 1100, supplier: "ТОО «Тараз-Опт»", base: 6 },
      { name: "Яйца С1 10 шт", kz: "Жұмыртқа С1, 10 дана", price: 950, cost: 760, supplier: "Птицефабрика", base: 15 },
      { name: "Кола 1,5 л", kz: "Кола 1,5 л", price: 690, cost: 480, supplier: "ТОО «Тараз-Опт»", base: 12 },
      { name: "Сигареты", kz: "Темекі", price: 1100, cost: 980, supplier: "ТОО «Тараз-Опт»", base: 18 },
      { name: "Конфеты коробка премиум", kz: "Премиум кәмпит қорабы", price: 6900, cost: 4800, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 9 },
      { name: "Кофе в зёрнах 1 кг", kz: "Дәнді кофе 1 кг", price: 9800, cost: 7200, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 6 },
      { name: "Оливковое масло 0,5 л", kz: "Зәйтүн майы 0,5 л", price: 4300, cost: 3100, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 8 },
    ],
  },
  cafe: {
    title: "Кафе",
    titleKz: "Кафе",
    name: "Кафе «Достар», ул. Толе би, Тараз",
    nameKz: "«Достар» кафесі, Төле би к-сі, Тараз",
    rent: 250_000,
    utilities: 70_000,
    salary: 400_000,
    scale: 0.4,
    targetFree: -63_800,
    supplierInvoice: { name: "Мясной цех «Аулие-Ата» — оплата поставки", nameKz: "«Әулие-Ата» ет цехы — жеткізілім төлемі", amount: 420_000 },
    items: [
      { name: "Лагман", kz: "Лағман", price: 1800, cost: 650, supplier: "Мясной цех «Аулие-Ата»", base: 22, rise: true },
      { name: "Плов", kz: "Палау", price: 1900, cost: 700, supplier: "Мясной цех «Аулие-Ата»", base: 18, rise: true },
      { name: "Манты (5 шт)", kz: "Манты (5 дана)", price: 1700, cost: 600, supplier: "Мясной цех «Аулие-Ата»", base: 16, rise: true },
      { name: "Самса", kz: "Самса", price: 450, cost: 170, supplier: "Пекарня", base: 40 },
      { name: "Чай чайник", kz: "Шай (шәйнек)", price: 600, cost: 90, supplier: "ТОО «Тараз-Опт»", base: 35 },
      { name: "Салат «Ачичук»", kz: "«Ачичук» салаты", price: 900, cost: 300, supplier: "Базар", base: 15 },
      { name: "Компот 1 л", kz: "Компот 1 л", price: 800, cost: 200, supplier: "ТОО «Тараз-Опт»", base: 10 },
      { name: "Сыр пармезан (кг)", kz: "Пармезан ірімшігі (кг)", price: 0, cost: 11_000, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 4 },
      { name: "Вино для соуса (бут.)", kz: "Тұздыққа арналған шарап (бөтелке)", price: 0, cost: 6500, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 6 },
      { name: "Сироп для кофе", kz: "Кофеге арналған сироп", price: 0, cost: 3800, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 9 },
    ],
  },
  salon: {
    title: "Салон красоты",
    titleKz: "Сұлулық салоны",
    name: "Салон «Аружан», мкр. Жайлау, Тараз",
    nameKz: "«Аружан» салоны, Жайлау ш/а, Тараз",
    rent: 180_000,
    utilities: 50_000,
    salary: 850_000, // мастера получают ~40% от услуг
    scale: 0.7,
    targetFree: -38_900,
    supplierInvoice: { name: "Дистрибьютор косметики — оплата партии", nameKz: "Косметика дистрибьюторы — партия төлемі", amount: 360_000 },
    items: [
      { name: "Стрижка женская", kz: "Әйелдер шаш қиюы", price: 4000, cost: 300, supplier: "Косметика-Опт", base: 6, rise: true },
      { name: "Окрашивание", kz: "Шаш бояу", price: 15000, cost: 4500, supplier: "Косметика-Опт", base: 2, rise: true },
      { name: "Маникюр", kz: "Маникюр", price: 5000, cost: 600, supplier: "Косметика-Опт", base: 5, rise: true },
      { name: "Стрижка мужская", kz: "Ерлер шаш қиюы", price: 2500, cost: 150, supplier: "Косметика-Опт", base: 5 },
      { name: "Шампунь проф. 1 л", kz: "Кәсіби сусабын 1 л", price: 7500, cost: 5200, supplier: "Косметика-Опт", base: 1 },
      { name: "Набор для кератина", kz: "Кератин жиынтығы", price: 0, cost: 18_000, supplier: "Косметика-Опт", base: 0, dead: 3 },
      { name: "Гель-лак коллекция", kz: "Гель-лак топтамасы", price: 0, cost: 2600, supplier: "Косметика-Опт", base: 0, dead: 20 },
    ],
  },
  auto: {
    title: "Автосервис",
    titleKz: "Автосервис",
    name: "СТО «Тулпар», трасса Тараз–Шымкент",
    nameKz: "«Тұлпар» ТҚС, Тараз–Шымкент жолы",
    rent: 250_000,
    utilities: 70_000,
    salary: 450_000,
    scale: 0.7,
    targetFree: -54_600,
    supplierInvoice: { name: "Автозапчасти «Жол» — оплата накладной", nameKz: "«Жол» автобөлшектері — жүкқұжат төлемі", amount: 380_000 },
    items: [
      { name: "Замена масла", kz: "Май ауыстыру", price: 6000, cost: 3800, supplier: "Автозапчасти «Жол»", base: 6, rise: true },
      { name: "Шиномонтаж (комплект)", kz: "Шиномонтаж (жиынтық)", price: 8000, cost: 500, supplier: "Шины-Тараз", base: 4 },
      { name: "Диагностика", kz: "Диагностика", price: 5000, cost: 0, supplier: "", base: 3 },
      { name: "Замена колодок", kz: "Тежегіш қалыптарын ауыстыру", price: 9000, cost: 5500, supplier: "Автозапчасти «Жол»", base: 2, rise: true },
      { name: "Фильтр воздушный", kz: "Ауа сүзгісі", price: 3500, cost: 2200, supplier: "Автозапчасти «Жол»", base: 3, rise: true },
      { name: "Аккумулятор 60Ah", kz: "Аккумулятор 60Ah", price: 0, cost: 32_000, supplier: "Автозапчасти «Жол»", base: 0, dead: 2 },
      { name: "Дефлекторы капота", kz: "Капот дефлекторлары", price: 0, cost: 6000, supplier: "Автозапчасти «Жол»", base: 0, dead: 7 },
    ],
  },
};

export function bizTitle(b: Biz, lang: "ru" | "kz" = "ru") {
  return lang === "kz" ? PROFILES[b].titleKz : PROFILES[b].title;
}
export function bizName(b: Biz, lang: "ru" | "kz" = "ru") {
  return lang === "kz" ? PROFILES[b].nameKz : PROFILES[b].name;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// множитель продаж по дню недели (getDay: 0=вс): слабый вторник, сильные выходные
const WEEKDAY_FACTOR = [1.15, 1.0, 0.62, 1.0, 1.02, 1.12, 1.25];
const WEEKS = DEMO_HISTORY_DAYS / 7;

export function generateDemo(biz: Biz, todayStr?: string): Dataset {
  const p = PROFILES[biz];
  const seed = [...biz].reduce((s, c) => s * 31 + c.charCodeAt(0), 7);
  const today = todayStr ? new Date(+todayStr.slice(0, 4), +todayStr.slice(5, 7) - 1, +todayStr.slice(8, 10)) : startOfToday();
  // шум продаж: таблица [товар][неделя назад][день недели] — не зависит от даты
  const noise = p.items.map((_, i) => {
    const r = mulberry32(seed + i * 101);
    return Array.from({ length: WEEKS }, () => Array.from({ length: 7 }, () => 0.75 + r() * 0.5));
  });
  const rows: Row[] = [];
  const dayOf = (offset: number) => addDays(today, offset).getDate();
  const rentDay = dayOf(-10);
  const utilDay = dayOf(-27);
  const salaryDay = dayOf(DEMO_GAP_DAY - 1);
  const monthly = (date: Date, day: number) => Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()) === date.getDate();

  for (let k = DEMO_HISTORY_DAYS; k >= 1; k--) {
    const date = addDays(today, -k);
    const ds = fmtDate(date);
    const wd = date.getDay();
    const week = Math.floor((k - 1) / 7);
    p.items.forEach((it, i) => {
      if (it.dead) {
        // закупили за 61 день до сегодня, продали чуть-чуть в первые 2 недели, дальше — ноль
        if (k === DEMO_HISTORY_DAYS - 2) rows.push({ date: ds, type: "purchase", item: it.name, qty: it.dead, amount: it.dead * it.cost, supplier: it.supplier });
        // первые две «мёртвые» позиции продались по 1 шт. за 55 дней до сегодня, потом — ни одной
        if (k === 55 && it.price > 0 && p.items.filter((x) => x.dead).indexOf(it) < 2) rows.push({ date: ds, type: "sale", item: it.name, qty: 1, amount: it.price });
        return;
      }
      const qty = Math.max(0, Math.round(it.base * p.scale * WEEKDAY_FACTOR[wd] * noise[i][week][wd]));
      if (qty <= 0) return;
      rows.push({ date: ds, type: "sale", item: it.name, qty, amount: qty * it.price });
      if (it.cost > 0 && it.supplier) {
        // докупаем каждый день столько, сколько продали (маленькая точка возит товар с опта ежедневно)
        const unit = Math.round(it.cost * (it.rise && k <= 28 ? 1.135 : 1));
        rows.push({ date: ds, type: "purchase", item: it.name, qty, amount: qty * unit, supplier: it.supplier });
      }
    });
    if (monthly(date, rentDay)) rows.push({ date: ds, type: "expense", item: "Аренда", qty: 1, amount: p.rent, category: "Аренда" });
    if (monthly(date, utilDay)) rows.push({ date: ds, type: "expense", item: "Коммуналка и связь", qty: 1, amount: p.utilities, category: "Коммуналка" });
    if (monthly(date, salaryDay)) rows.push({ date: ds, type: "expense", item: "Зарплата", qty: 1, amount: p.salary, category: "Зарплата" });
  }

  const calendar: CalendarItem[] = [
    { id: "rent", name: "Аренда", amount: p.rent, kind: "rent", day: rentDay },
    { id: "utilities", name: "Коммуналка и связь", amount: p.utilities, kind: "utilities", day: utilDay },
    { id: "salary", name: "Зарплата", amount: p.salary, kind: "salary", day: salaryDay },
    { id: "supplier", name: p.supplierInvoice.name, amount: p.supplierInvoice.amount, kind: "supplier", date: fmtDate(addDays(today, DEMO_GAP_DAY)) },
  ];

  return { biz, isDemo: true, source: "демо-данные", rows, cash: 0, today: fmtDate(today), calendar };
}

/** Русское название из демо → казахское (для KZ-интерфейса). */
const KZ_NAMES: Record<string, string> = (() => {
  const m: Record<string, string> = {
    Аренда: "Жалға алу",
    "Коммуналка и связь": "Коммуналдық төлемдер және байланыс",
    Зарплата: "Жалақы",
    "Тараз-Нан": "Тараз-Нан",
    "ТОО «Жамбыл-Сут»": "«Жамбыл-Сүт» ЖШС",
    "ТОО «Тараз-Опт»": "«Тараз-Опт» ЖШС",
    Птицефабрика: "Құс фабрикасы",
    "Мясной цех «Аулие-Ата»": "«Әулие-Ата» ет цехы",
    Пекарня: "Наубайхана",
    Базар: "Базар",
    "Косметика-Опт": "Косметика-Опт",
    "Шины-Тараз": "Шины-Тараз",
    "Автозапчасти «Жол»": "«Жол» автобөлшектері",
    "Без поставщика": "Жеткізушісіз",
    "Комиссия Kaspi": "Kaspi комиссиясы",
    Возвраты: "Қайтарулар",
    Выручка: "Түсім",
    "Соцплатежи ИП (ОПВ, СО, ВОСМС)": "ЖК әлеуметтік төлемдері (МЗЖ, ӘА, МӘМС)",
    "демо-данные": "демо-деректер",
  };
  for (const p of Object.values(PROFILES)) {
    for (const it of p.items) m[it.name] = it.kz;
    m[p.supplierInvoice.name] = p.supplierInvoice.nameKz;
    m[p.name] = p.nameKz;
  }
  return m;
})();

export function dn(name: string, lang: "ru" | "kz"): string {
  if (lang !== "kz" || !name) return name;
  if (KZ_NAMES[name]) return KZ_NAMES[name];
  let m = name.match(/^Налог 910 за (\d)-е полугодие (\d{4})$/);
  if (m) return `910 салығы, ${m[2]} ж. ${m[1]}-жартыжылдық`;
  m = name.match(/^НДС за (\d)-й квартал (\d{4})$/);
  if (m) return `ҚҚС, ${m[2]} ж. ${m[1]}-тоқсан`;
  return name;
}

export function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
