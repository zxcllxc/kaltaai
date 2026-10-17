import type { Biz, CalendarItem, Dataset, Row } from "./types";
import { addDays, fmtDate, parseDate } from "./dates";

/** Детерминированный генератор демо-данных с заложенными закономерностями:
 *  - мёртвые остатки ~90–120 тыс ₸ (товары без продаж 30+ дней)
 *  - слабый вторник (−38% к обычному дню)
 *  - рост закупочной цены у одного поставщика на +12% (последние 30 дней)
 *  - кассовый разрыв ~ через 9 дней (крупный платёж поставщику)
 *  - дорогие платежи в начале месяца (аренда 1-го, налоги/коммуналка 3-го)
 */

interface ItemDef {
  name: string;
  price: number; // цена продажи за ед.
  cost: number; // закупка за ед.
  supplier: string;
  base: number; // продаж в обычный день, шт
  rise?: boolean; // у этого поставщика выросла цена
  dead?: number; // закупили столько шт в начале периода, продажи встали
  service?: boolean; // услуга — без закупки
}

interface BizProfile {
  title: string;
  name: string;
  items: ItemDef[];
  rent: number;
  tax: number;
  salary: number;
  supplierInvoice: { name: string; amount: number };
}

export const BIZ_LIST: { id: Biz; emoji: string }[] = [
  { id: "shop", emoji: "🛒" },
  { id: "cafe", emoji: "☕" },
  { id: "salon", emoji: "💇" },
  { id: "auto", emoji: "🔧" },
];

const PROFILES: Record<Biz, BizProfile> = {
  shop: {
    title: "Магазин продуктов",
    name: "Магазин «Береке», мкр. Аса, Тараз",
    rent: 200_000,
    tax: 70_000,
    salary: 300_000,
    supplierInvoice: { name: "ТОО «Тараз-Опт» — оплата накладной", amount: 520_000 },
    items: [
      { name: "Хлеб «Тараз-Нан»", price: 180, cost: 130, supplier: "Тараз-Нан", base: 60 },
      { name: "Молоко 1 л", price: 520, cost: 410, supplier: "ТОО «Жамбыл-Сут»", base: 30, rise: true },
      { name: "Кефир 1 л", price: 560, cost: 440, supplier: "ТОО «Жамбыл-Сут»", base: 14, rise: true },
      { name: "Сметана 400 г", price: 790, cost: 610, supplier: "ТОО «Жамбыл-Сут»", base: 9, rise: true },
      { name: "Масло подсолнечное 1 л", price: 1150, cost: 900, supplier: "ТОО «Тараз-Опт»", base: 8 },
      { name: "Сахар 1 кг", price: 520, cost: 420, supplier: "ТОО «Тараз-Опт»", base: 12 },
      { name: "Чай «Пиала» 250 г", price: 1450, cost: 1100, supplier: "ТОО «Тараз-Опт»", base: 6 },
      { name: "Яйца С1 10 шт", price: 950, cost: 760, supplier: "Птицефабрика", base: 15 },
      { name: "Кола 1,5 л", price: 690, cost: 480, supplier: "ТОО «Тараз-Опт»", base: 12 },
      { name: "Сигареты", price: 1100, cost: 980, supplier: "ТОО «Тараз-Опт»", base: 18 },
      { name: "Конфеты коробка премиум", price: 6900, cost: 4800, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 9 },
      { name: "Кофе в зёрнах 1 кг", price: 9800, cost: 7200, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 6 },
      { name: "Оливковое масло 0,5 л", price: 4300, cost: 3100, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 8 },
    ],
  },
  cafe: {
    title: "Кафе",
    name: "Кафе «Достар», ул. Толе би, Тараз",
    rent: 380_000,
    tax: 110_000,
    salary: 650_000,
    supplierInvoice: { name: "Мясной цех «Аулие-Ата» — оплата поставки", amount: 640_000 },
    items: [
      { name: "Лагман", price: 1800, cost: 650, supplier: "Мясной цех «Аулие-Ата»", base: 22, rise: true },
      { name: "Плов", price: 1900, cost: 700, supplier: "Мясной цех «Аулие-Ата»", base: 18, rise: true },
      { name: "Манты (5 шт)", price: 1700, cost: 600, supplier: "Мясной цех «Аулие-Ата»", base: 16, rise: true },
      { name: "Самса", price: 450, cost: 170, supplier: "Пекарня", base: 40 },
      { name: "Чай чайник", price: 600, cost: 90, supplier: "ТОО «Тараз-Опт»", base: 35 },
      { name: "Салат «Ачичук»", price: 900, cost: 300, supplier: "Базар", base: 15 },
      { name: "Компот 1 л", price: 800, cost: 200, supplier: "ТОО «Тараз-Опт»", base: 10 },
      { name: "Сыр пармезан (кг)", price: 0, cost: 11_000, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 4 },
      { name: "Вино для соуса (бут.)", price: 0, cost: 6500, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 6 },
      { name: "Сироп для кофе", price: 0, cost: 3800, supplier: "ТОО «Тараз-Опт»", base: 0, dead: 9 },
    ],
  },
  salon: {
    title: "Салон красоты",
    name: "Салон «Аружан», мкр. Жайлау, Тараз",
    rent: 220_000,
    tax: 60_000,
    salary: 380_000,
    supplierInvoice: { name: "Дистрибьютор косметики — оплата партии", amount: 410_000 },
    items: [
      { name: "Стрижка женская", price: 4000, cost: 300, supplier: "Косметика-Опт", base: 6, rise: true, service: true },
      { name: "Окрашивание", price: 15000, cost: 4500, supplier: "Косметика-Опт", base: 2, rise: true, service: true },
      { name: "Маникюр", price: 5000, cost: 600, supplier: "Косметика-Опт", base: 5, rise: true, service: true },
      { name: "Стрижка мужская", price: 2500, cost: 150, supplier: "Косметика-Опт", base: 5, service: true },
      { name: "Шампунь проф. 1 л", price: 7500, cost: 5200, supplier: "Косметика-Опт", base: 1 },
      { name: "Набор для кератина", price: 0, cost: 18_000, supplier: "Косметика-Опт", base: 0, dead: 3 },
      { name: "Гель-лак коллекция", price: 0, cost: 2600, supplier: "Косметика-Опт", base: 0, dead: 20 },
    ],
  },
  auto: {
    title: "Автосервис",
    name: "СТО «Тулпар», трасса Тараз–Шымкент",
    rent: 300_000,
    tax: 90_000,
    salary: 600_000,
    supplierInvoice: { name: "Автозапчасти «Жол» — оплата накладной", amount: 590_000 },
    items: [
      { name: "Замена масла", price: 6000, cost: 3800, supplier: "Автозапчасти «Жол»", base: 6, rise: true },
      { name: "Шиномонтаж (комплект)", price: 8000, cost: 500, supplier: "Шины-Тараз", base: 4, service: true },
      { name: "Диагностика", price: 5000, cost: 0, supplier: "", base: 3, service: true },
      { name: "Замена колодок", price: 9000, cost: 5500, supplier: "Автозапчасти «Жол»", base: 2, rise: true },
      { name: "Фильтр воздушный", price: 3500, cost: 2200, supplier: "Автозапчасти «Жол»", base: 3, rise: true },
      { name: "Аккумулятор 60Ah", price: 0, cost: 32_000, supplier: "Автозапчасти «Жол»", base: 0, dead: 2 },
      { name: "Дефлекторы капота", price: 0, cost: 6000, supplier: "Автозапчасти «Жол»", base: 0, dead: 7 },
    ],
  },
};

export function bizTitle(b: Biz) {
  return PROFILES[b].title;
}
export function bizName(b: Biz) {
  return PROFILES[b].name;
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

// пн..вс → множитель продаж (getDay: 0=вс)
const WEEKDAY_FACTOR = [1.15, 1.0, 0.62, 1.0, 1.02, 1.12, 1.25];

export function generateDemo(biz: Biz, todayStr?: string): Dataset {
  const p = PROFILES[biz];
  const rnd = mulberry32(biz.length * 9973 + 42);
  const today = todayStr ? parseDate(todayStr) : startOfToday();
  const start = addDays(today, -60);
  const rows: Row[] = [];
  const salaryDay = addDays(today, 8).getDate();

  // цены продаж для «мёртвых» товаров, которые не продаются вообще (сырьё) — 0
  for (let d = 0; d < 60; d++) {
    const date = addDays(start, d);
    const ds = fmtDate(date);
    const wf = WEEKDAY_FACTOR[date.getDay()];
    const restock: Record<string, { qty: number; amount: number; supplier: string }> = {};

    for (const it of p.items) {
      if (it.dead) {
        // закупили в первые дни, продали чуть-чуть в первые 2 недели, дальше — ноль
        if (d === 2) {
          rows.push({ date: ds, type: "purchase", item: it.name, qty: it.dead, amount: it.dead * it.cost, supplier: it.supplier });
        }
        if (it.price > 0 && d > 2 && d < 16 && rnd() < 0.12) {
          rows.push({ date: ds, type: "sale", item: it.name, qty: 1, amount: it.price });
        }
        continue;
      }
      const noise = 0.75 + rnd() * 0.5;
      const qty = Math.max(0, Math.round(it.base * wf * noise));
      if (qty > 0) rows.push({ date: ds, type: "sale", item: it.name, qty, amount: qty * it.price });
      if (!it.service || it.cost > 0) {
        const unit = Math.round(it.cost * (it.rise && d >= 30 ? 1.135 : 1));
        const r = (restock[it.name] ??= { qty: 0, amount: 0, supplier: it.supplier });
        r.qty += qty;
        r.amount += qty * unit;
      }
    }
    // закупки — каждые 3 дня, оплата сразу (накладные по мелочи)
    if (d % 3 === 0) {
      for (const [name, r] of Object.entries(pendingRestock)) {
        if (r.qty > 0 && r.supplier) rows.push({ date: ds, type: "purchase", item: name, qty: r.qty, amount: r.amount, supplier: r.supplier });
      }
      pendingRestock = {};
    }
    for (const [name, r] of Object.entries(restock)) {
      const acc = (pendingRestock[name] ??= { qty: 0, amount: 0, supplier: r.supplier });
      acc.qty += r.qty;
      acc.amount += r.amount;
    }

    if (date.getDate() === 1) rows.push({ date: ds, type: "expense", item: "Аренда", qty: 1, amount: p.rent, category: "Аренда" });
    if (date.getDate() === 3) rows.push({ date: ds, type: "expense", item: "Коммуналка и связь", qty: 1, amount: p.tax, category: "Коммуналка" });
    if (date.getDate() === salaryDay) rows.push({ date: ds, type: "expense", item: "Зарплата", qty: 1, amount: p.salary, category: "Зарплата" });
  }
  pendingRestock = {};

  const calendar: CalendarItem[] = [
    { id: "rent", name: "Аренда", amount: p.rent, kind: "rent", day: 1 },
    { id: "utilities", name: "Коммуналка и связь", amount: p.tax, kind: "utilities", day: 3 },
    { id: "salary", name: "Зарплата", amount: p.salary, kind: "salary", day: salaryDay },
    { id: "supplier", name: p.supplierInvoice.name, amount: p.supplierInvoice.amount, kind: "supplier", date: fmtDate(addDays(today, 9)) },
  ];

  const ds: Dataset = {
    biz,
    isDemo: true,
    source: "демо-данные",
    rows,
    cash: 0,
    today: fmtDate(today),
    calendar,
  };
  return ds;
}

let pendingRestock: Record<string, { qty: number; amount: number; supplier: string }> = {};

export function startOfToday() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
