import type { CalendarItem, Dataset, Row, WhatIf } from "./types";
import { NO_WHATIF } from "./types";
import { addDays, daysBetween, fmtDate, parseDate } from "./dates";

/** Все цифры продукта считаются здесь — детерминированно, без LLM. */

export function money(n: number) {
  const r = Math.round(n);
  return r.toLocaleString("ru-RU").replace(/ | /g, " ") + " ₸";
}
export function kmoney(n: number) {
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(".", ",") + " млн ₸";
  if (a >= 1000) return Math.round(n / 1000) + " тыс ₸";
  return Math.round(n) + " ₸";
}

export interface ItemStat {
  name: string;
  revenue: number;
  qty: number;
  priceUnit: number;
  costUnit: number | null;
  marginPct: number | null;
  profit: number | null;
  abc: "A" | "B" | "C";
  share: number;
  stockQty: number;
  frozen: number;
  retail: number; // за сколько можно продать остаток
  lastSale: string | null;
  daysNoSale: number;
  supplier?: string;
  purchased30: number; // ₸ закуплено за 30 дней
}

export interface PriceRise {
  supplier: string;
  items: { name: string; oldCost: number; newCost: number; pct: number }[];
  pct: number;
  overpayMonth: number;
}

export interface Day {
  date: string;
  inflow: number;
  outflow: number;
  purchases: number;
  balance: number;
  events: { name: string; amount: number }[];
}

export interface Gap {
  date: string;
  dayIndex: number;
  shortfall: number; // максимальная нехватка, ₸ (положительное число)
  minDate: string;
}

export interface Action {
  id: "dead" | "delay" | "supplier" | "weak" | "citems";
  effect: number;
  deadlineDays: number;
  facts: Record<string, string | number>;
}

export interface Analysis {
  from: string;
  to: string;
  days: number;
  sales30: number;
  purchases30: number;
  expenses30: number;
  profit30: number;
  margin: number; // валовая маржа 0..1
  purchaseRatio: number;
  wdAvg: number[]; // 0=вс
  weak: { wd: number; avg: number; median: number; dropPct: number; lossMonth: number } | null;
  items: ItemStat[];
  dead: ItemStat[];
  frozenTotal: number;
  rises: PriceRise[];
  riseTotal: number;
  forecast: { base: Day[]; pess: Day[]; opt: Day[] };
  gap: Gap | null;
  gapPess: Gap | null;
  gapOpt: Gap | null;
  found: { total: number; frozen: number; weak: number; rise: number };
  actions: Action[];
  prevented: number;
  largestPayment: (CalendarItem & { due: string }) | null;
  hasStock: boolean;
}

const sum = (a: number[]) => a.reduce((s, x) => s + x, 0);

function median(a: number[]) {
  const s = [...a].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function inRange(r: Row, from: string, to: string) {
  return r.date >= from && r.date < to;
}

export function sellThrough(d: number) {
  return Math.min(1, 0.15 + d * 2.2);
}

/** Платежи календаря, попадающие в окно [from, from+n) */
export function calendarEvents(cal: CalendarItem[], from: string, n: number, delay?: { id: string; days: number }) {
  const out: { item: CalendarItem; due: string }[] = [];
  const start = parseDate(from);
  for (let i = 0; i < 62; i++) {
    const d = addDays(start, i - 31);
    const ds = fmtDate(d);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    for (const c of cal) {
      let hit = false;
      if (c.date) hit = c.date === ds;
      else if (c.day) hit = Math.min(c.day, lastDay) === d.getDate();
      if (!hit) continue;
      let due = ds;
      if (delay && delay.id === c.id && delay.days > 0) due = fmtDate(addDays(d, delay.days));
      const k = daysBetween(from, due);
      if (k >= 0 && k < n) out.push({ item: c, due });
    }
  }
  return out;
}

function largestPayment(ds: Dataset) {
  const ev = calendarEvents(ds.calendar, ds.today, 14);
  const sup = ev.filter((e) => e.item.kind === "supplier");
  const pool = sup.length ? sup : ev;
  if (!pool.length) return null;
  const best = pool.reduce((a, b) => (b.item.amount > a.item.amount ? b : a));
  return { ...best.item, due: best.due };
}

interface Base {
  wdAvg: number[];
  purchaseRatio: number;
  dead: ItemStat[];
}

export function runForecast(ds: Dataset, b: Base, wi: WhatIf, salesMult: number, lp: { id: string } | null): Day[] {
  const p = wi.priceUp;
  const priceFactor = (1 + p) * (1 - 0.5 * p);
  const volFactor = 1 - 0.5 * p;
  const deadCash = sum(b.dead.map((d) => d.stockQty * d.retail * (1 - wi.deadDiscount))) * (wi.deadDiscount > 0 ? sellThrough(wi.deadDiscount) : 0);
  const events = calendarEvents(ds.calendar, ds.today, 14, lp && wi.delayDays ? { id: lp.id, days: wi.delayDays } : undefined);
  const out: Day[] = [];
  let bal = ds.cash;
  for (let i = 0; i < 14; i++) {
    const date = fmtDate(addDays(parseDate(ds.today), i));
    const wd = parseDate(date).getDay();
    let inflow = b.wdAvg[wd] * salesMult * priceFactor;
    if (i < 7) inflow += deadCash / 7;
    const purchases = b.wdAvg[wd] * salesMult * volFactor * b.purchaseRatio;
    const evs = events.filter((e) => e.due === date).map((e) => ({ name: e.item.name, amount: e.item.amount }));
    const outflow = purchases + sum(evs.map((e) => e.amount));
    bal += inflow - outflow;
    out.push({ date, inflow, outflow, purchases, balance: bal, events: evs });
  }
  return out;
}

export function findGap(days: Day[]): Gap | null {
  const i = days.findIndex((d) => d.balance < 0);
  if (i < 0) return null;
  const min = days.reduce((a, d) => (d.balance < a.balance ? d : a));
  return { date: days[i].date, dayIndex: i, shortfall: -min.balance, minDate: min.date };
}

export function analyze(ds: Dataset, wi: WhatIf = NO_WHATIF): Analysis {
  const rows = ds.rows;
  const today = ds.today;
  const dates = rows.map((r) => r.date).sort();
  const from = dates[0] ?? today;
  const to = dates[dates.length - 1] ?? today;
  const days = Math.max(1, daysBetween(from, today));
  const d30 = fmtDate(addDays(parseDate(today), -30));
  const d60 = fmtDate(addDays(parseDate(today), -60));
  const d28 = fmtDate(addDays(parseDate(today), -28));
  const scale30 = days < 30 ? 30 / days : 1;

  const sales30 = sum(rows.filter((r) => r.type === "sale" && inRange(r, d30, today)).map((r) => r.amount)) * scale30;
  const purchases30 = sum(rows.filter((r) => r.type === "purchase" && inRange(r, d30, today)).map((r) => r.amount)) * scale30;
  const expenses30 = sum(rows.filter((r) => r.type === "expense" && inRange(r, d30, today)).map((r) => r.amount)) * scale30;

  // средние продажи по дням недели (последние 4 недели или всё, что есть)
  const winFrom = days >= 28 ? d28 : from;
  const salesByDate = new Map<string, number>();
  for (const r of rows) if (r.type === "sale" && inRange(r, winFrom, today)) salesByDate.set(r.date, (salesByDate.get(r.date) ?? 0) + r.amount);
  const wdSum = Array(7).fill(0);
  const wdCnt = Array(7).fill(0);
  for (let d = parseDate(winFrom); fmtDate(d) < today; d = addDays(d, 1)) {
    wdSum[d.getDay()] += salesByDate.get(fmtDate(d)) ?? 0;
    wdCnt[d.getDay()]++;
  }
  const wdAvg = wdSum.map((s, i) => (wdCnt[i] ? s / wdCnt[i] : 0));
  const purchWin = sum(rows.filter((r) => r.type === "purchase" && inRange(r, winFrom, today)).map((r) => r.amount));
  const salesWin = sum([...salesByDate.values()]);
  const purchaseRatio = salesWin > 0 ? Math.min(1.2, purchWin / salesWin) : 0;
  const margin = sales30 > 0 && purchases30 > 0 ? Math.min(0.8, Math.max(0.08, 1 - purchases30 / sales30)) : 0.25;

  // слабый день
  let weak: Analysis["weak"] = null;
  const active = wdAvg.map((v, i) => ({ v, i })).filter((x) => x.v > 0);
  if (active.length >= 5) {
    const w = active.reduce((a, b) => (b.v < a.v ? b : a));
    const med = median(active.filter((x) => x.i !== w.i).map((x) => x.v));
    const dropPct = med > 0 ? 1 - w.v / med : 0;
    if (dropPct >= 0.12) weak = { wd: w.i, avg: w.v, median: med, dropPct, lossMonth: (med - w.v) * 4.3 * margin };
  }

  // товары
  const map = new Map<string, ItemStat & { pq: number; pa: number; lastCost: number; firstPurchase: string | null; soldAll: number; boughtAll: number; p30q: number; p30a: number; old: { q: number; a: number }; neu: { q: number; a: number } }>();
  const get = (name: string) => {
    let m = map.get(name);
    if (!m) {
      m = { name, revenue: 0, qty: 0, priceUnit: 0, costUnit: null, marginPct: null, profit: null, abc: "C", share: 0, stockQty: 0, frozen: 0, retail: 0, lastSale: null, daysNoSale: 0, purchased30: 0, pq: 0, pa: 0, lastCost: 0, firstPurchase: null, soldAll: 0, boughtAll: 0, p30q: 0, p30a: 0, old: { q: 0, a: 0 }, neu: { q: 0, a: 0 } };
      map.set(name, m);
    }
    return m;
  };
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const r of sorted) {
    if (r.type === "sale") {
      const m = get(r.item);
      m.revenue += r.amount;
      m.qty += r.qty;
      m.soldAll += r.qty;
      m.lastSale = r.date;
    } else if (r.type === "purchase") {
      const m = get(r.item);
      m.boughtAll += r.qty;
      m.pq += r.qty;
      m.pa += r.amount;
      if (r.qty > 0) m.lastCost = r.amount / r.qty;
      m.firstPurchase ??= r.date;
      m.supplier = r.supplier || m.supplier;
      if (r.date >= d30) {
        m.p30q += r.qty;
        m.p30a += r.amount;
        m.neu.q += r.qty;
        m.neu.a += r.amount;
      } else if (r.date >= d60) {
        m.old.q += r.qty;
        m.old.a += r.amount;
      }
    }
  }
  const hasStock = rows.some((r) => r.type === "purchase" && r.qty > 0);
  const all = [...map.values()];
  const totalRev = sum(all.map((m) => m.revenue));
  for (const m of all) {
    m.priceUnit = m.qty > 0 ? m.revenue / m.qty : 0;
    m.costUnit = m.pq > 0 ? (m.p30q > 0 ? m.p30a / m.p30q : m.pa / m.pq) : null;
    if (m.costUnit != null && m.priceUnit > 0) {
      m.marginPct = (m.priceUnit - m.costUnit) / m.priceUnit;
      m.profit = m.revenue - m.costUnit * m.qty;
    }
    m.stockQty = Math.max(0, m.boughtAll - m.soldAll);
    m.frozen = m.stockQty * (m.lastCost || m.costUnit || 0);
    m.retail = m.priceUnit > 0 ? m.priceUnit : (m.lastCost || 0) * 1.25;
    const ref = m.lastSale ?? m.firstPurchase ?? from;
    m.daysNoSale = daysBetween(ref, today);
    m.purchased30 = m.p30a * scale30;
    m.share = totalRev > 0 ? m.revenue / totalRev : 0;
  }
  const byRev = all.filter((m) => m.revenue > 0).sort((a, b) => b.revenue - a.revenue);
  let cum = 0;
  for (const m of byRev) {
    cum += m.share;
    m.abc = cum <= 0.8 + 1e-9 || m === byRev[0] ? "A" : cum <= 0.95 ? "B" : "C";
  }
  const items = [...byRev, ...all.filter((m) => m.revenue <= 0)];
  const dead = all.filter((m) => m.stockQty > 0 && m.daysNoSale >= 30 && m.frozen > 0).sort((a, b) => b.frozen - a.frozen);
  const frozenTotal = sum(dead.map((d) => d.frozen));

  // рост закупочных цен по поставщикам
  const bySup = new Map<string, PriceRise>();
  for (const m of all) {
    if (m.old.q <= 0 || m.neu.q <= 0) continue;
    const oldC = m.old.a / m.old.q;
    const newC = m.neu.a / m.neu.q;
    const pct = newC / oldC - 1;
    if (pct < 0.04) continue;
    const s = m.supplier || "Без поставщика";
    const pr = bySup.get(s) ?? { supplier: s, items: [], pct: 0, overpayMonth: 0 };
    pr.items.push({ name: m.name, oldCost: oldC, newCost: newC, pct });
    pr.overpayMonth += (newC - oldC) * m.neu.q * scale30;
    bySup.set(s, pr);
  }
  const rises = [...bySup.values()]
    .map((r) => ({ ...r, pct: sum(r.items.map((i) => i.pct)) / r.items.length }))
    .sort((a, b) => b.overpayMonth - a.overpayMonth);
  const riseTotal = sum(rises.map((r) => r.overpayMonth));

  const base: Base = { wdAvg, purchaseRatio, dead };
  const lp = largestPayment(ds);
  const fBase = runForecast(ds, base, wi, 1, lp);
  const fPess = runForecast(ds, base, wi, 0.85, lp);
  const fOpt = runForecast(ds, base, wi, 1.1, lp);
  const gap = findGap(fBase);

  // эффект «если сделать действия 1 и 2» — для метрики «предотвращённый разрыв»
  const fixed = findGap(runForecast(ds, base, { ...wi, deadDiscount: Math.max(wi.deadDiscount, 0.3), delayDays: Math.max(wi.delayDays, 7) }, 1, lp));
  const baseNoWi = findGap(runForecast(ds, base, NO_WHATIF, 1, lp));
  const prevented = baseNoWi ? baseNoWi.shortfall - (fixed?.shortfall ?? 0) : 0;

  // действия
  const actions: Action[] = [];
  if (dead.length) {
    const rec = sum(dead.map((d) => d.stockQty * d.retail * 0.7)) * sellThrough(0.3);
    actions.push({ id: "dead", effect: rec, deadlineDays: 7, facts: { items: dead.slice(0, 3).map((d) => d.name).join(", "), frozen: money(frozenTotal), discount: "30%" } });
  }
  if (baseNoWi && lp) {
    const g2 = findGap(runForecast(ds, base, { ...NO_WHATIF, delayDays: 7 }, 1, lp));
    const eff = baseNoWi.shortfall - (g2?.shortfall ?? 0);
    if (eff > 0) actions.push({ id: "delay", effect: eff, deadlineDays: Math.max(1, daysBetween(today, lp.due) - 1), facts: { payment: lp.name, amount: money(lp.amount), due: lp.due } });
  }
  if (rises.length) {
    const r = rises[0];
    actions.push({ id: "supplier", effect: r.overpayMonth, deadlineDays: 3, facts: { supplier: r.supplier, pct: Math.round(r.pct * 100) + "%", items: r.items.map((i) => i.name).slice(0, 3).join(", ") } });
  }
  if (weak) {
    actions.push({ id: "weak", effect: weak.lossMonth / 3, deadlineDays: 28, facts: { wd: weak.wd, drop: Math.round(weak.dropPct * 100) + "%" } });
  }
  const cItems = items.filter((m) => m.abc === "C" && m.purchased30 > 0);
  const cCash = sum(cItems.map((m) => m.purchased30)) / 2;
  if (cCash > 5000) actions.push({ id: "citems", effect: cCash, deadlineDays: 14, facts: { items: cItems.slice(0, 3).map((m) => m.name).join(", ") } });
  // сначала то, что закрывает разрыв, потом по эффекту
  const prio = (a: Action) => (a.id === "delay" ? 2 : a.id === "dead" && baseNoWi ? 1 : 0);
  actions.sort((a, b) => prio(b) - prio(a) || b.effect - a.effect);

  return {
    from,
    to,
    days,
    sales30,
    purchases30,
    expenses30,
    profit30: sales30 - purchases30 - expenses30,
    margin,
    purchaseRatio,
    wdAvg,
    weak,
    items,
    dead,
    frozenTotal,
    rises,
    riseTotal,
    forecast: { base: fBase, pess: fPess, opt: fOpt },
    gap,
    gapPess: findGap(fPess),
    gapOpt: findGap(fOpt),
    found: { total: frozenTotal + (weak?.lossMonth ?? 0) + riseTotal, frozen: frozenTotal, weak: weak?.lossMonth ?? 0, rise: riseTotal },
    actions: actions.slice(0, 5),
    prevented: Math.max(0, prevented),
    largestPayment: lp,
    hasStock,
  };
}

/** Для демо: остаток в кассе ≥150 тыс ₸, а крупный платёж поставщику на 9-й день даёт разрыв ≈ −180 тыс ₸. */
export function calibrateDemoCash(ds: Dataset): Dataset {
  const a = analyze({ ...ds, cash: 0 });
  const bal = a.forecast.base.map((d) => d.balance);
  const need = Math.max(...bal.slice(0, 9).map((b) => -b)) + 60_000;
  const cash = Math.round(Math.max(150_000, need) / 1000) * 1000;
  const extra = Math.round((cash + bal[9] + 180_000) / 1000) * 1000;
  const calendar = ds.calendar.map((c) => (c.kind === "supplier" && c.date ? { ...c, amount: Math.max(50_000, c.amount + extra) } : c));
  return { ...ds, cash, calendar };
}
