import type { CalendarItem, Dataset } from "../types";
import { addDays, daysBetween, fmtDate, parseDate } from "../dates";
import { DEFAULT_TAX, simplifiedLimit, taxRate, vatThreshold, type TaxSettings } from "./kz2026";

/** «Налоговый конверт»: сколько отложить на налоги и когда платить. Расчёт ориентировочный. */
export interface TaxEnvelope {
  settings: TaxSettings;
  rate: number;
  periodLabel: string;
  /** номер полугодия/квартала и год — для перевода подписи */
  period: { kind: "half" | "quarter"; no: number; year: number };
  periodStart: string;
  dueDate: string;
  daysToDue: number;
  reserve: number; // накоплено к уплате на сегодня
  reserveAtDue: number; // прогноз суммы к дате уплаты (на конец периода)
  estimated: boolean; // часть периода экстраполирована по средней выручке
  socialNext: string | null;
  socialAmount: number;
  ytd: number; // доход с 1 января (оценка)
  limit: number;
  limitShare: number;
  vatThreshold: number;
  vatDate: string | null; // только для ОУР
  vatExceeded: boolean;
  avgDaily: number;
}

function salesBetween(ds: Dataset, from: string, to: string, type: "sale" | "purchase" = "sale") {
  return ds.rows.filter((r) => r.type === type && r.date >= from && r.date < to).reduce((s, r) => s + r.amount, 0);
}

export function taxEnvelope(ds: Dataset, avgDaily: number, purchaseRatio: number): TaxEnvelope {
  const st = { ...DEFAULT_TAX, ...(ds.tax ?? {}) };
  const today = parseDate(ds.today);
  const y = today.getFullYear();
  const m = today.getMonth();
  const dataFrom = ds.rows.map((r) => r.date).sort()[0] ?? ds.today;
  const isOur = st.mode === "our";

  let start: Date, end: Date, due: Date, label: string;
  let period: TaxEnvelope["period"];
  if (isOur) {
    // НДС — поквартально, до 25 числа второго месяца после квартала
    const q = Math.floor(m / 3);
    start = new Date(y, q * 3, 1);
    end = new Date(y, q * 3 + 3, 1);
    due = new Date(y, q * 3 + 4, 25);
    label = `${q + 1}-й квартал ${y}`;
    period = { kind: "quarter", no: q + 1, year: y };
  } else {
    const h2 = m >= 6;
    start = new Date(y, h2 ? 6 : 0, 1);
    end = new Date(h2 ? y + 1 : y, h2 ? 0 : 6, 1);
    due = new Date(h2 ? y + 1 : y, h2 ? 1 : 7, 25);
    label = `${h2 ? "2-е" : "1-е"} полугодие ${y}`;
    period = { kind: "half", no: h2 ? 2 : 1, year: y };
  }
  const s = fmtDate(start);
  const known = salesBetween(ds, s > dataFrom ? s : dataFrom, ds.today);
  const missingDays = Math.max(0, daysBetween(s, dataFrom));
  const accrued = known + missingDays * avgDaily;
  const daysLeft = Math.max(0, daysBetween(ds.today, fmtDate(end)));
  const projected = accrued + daysLeft * avgDaily;
  const rate = taxRate(st);
  let reserve: number, reserveAtDue: number;
  if (isOur) {
    const knownP = salesBetween(ds, s > dataFrom ? s : dataFrom, ds.today, "purchase");
    const accruedP = knownP + missingDays * avgDaily * purchaseRatio;
    const k = rate / (1 + rate);
    reserve = Math.max(0, (accrued - accruedP) * k);
    reserveAtDue = Math.max(0, (projected - accruedP - daysLeft * avgDaily * purchaseRatio) * k);
  } else {
    reserve = accrued * rate;
    reserveAtDue = projected * rate;
  }

  // соцплатежи ИП: до 25 числа
  let socialNext: string | null = null;
  if (st.isIP && st.socialMonthly > 0) {
    const d = today.getDate() <= st.socialDueDay ? new Date(y, m, st.socialDueDay) : new Date(y, m + 1, st.socialDueDay);
    socialNext = fmtDate(d);
  }

  const jan1 = fmtDate(new Date(y, 0, 1));
  const ytd = salesBetween(ds, jan1 > dataFrom ? jan1 : dataFrom, ds.today) + Math.max(0, daysBetween(jan1, dataFrom)) * avgDaily;
  const thr = vatThreshold(st);
  let vatDate: string | null = null;
  if (isOur && ytd < thr && avgDaily > 0) {
    const d = addDays(today, Math.ceil((thr - ytd) / avgDaily));
    if (d.getFullYear() === y) vatDate = fmtDate(d);
  }
  const limit = simplifiedLimit(st);
  return {
    settings: st,
    rate,
    periodLabel: label,
    period,
    periodStart: s,
    dueDate: fmtDate(due),
    daysToDue: daysBetween(ds.today, fmtDate(due)),
    reserve,
    reserveAtDue,
    estimated: missingDays > 0,
    socialNext,
    socialAmount: st.isIP ? st.socialMonthly : 0,
    ytd,
    limit,
    limitShare: limit ? ytd / limit : 0,
    vatThreshold: thr,
    vatDate,
    vatExceeded: isOur && ytd >= thr,
    avgDaily,
  };
}

/** Налоговые платежи как события календаря — автоматически попадают в прогноз. */
export function taxCalendar(env: TaxEnvelope): CalendarItem[] {
  const out: CalendarItem[] = [];
  if (env.socialAmount > 0) out.push({ id: "tax-social", name: "Соцплатежи ИП (ОПВ, СО, ВОСМС)", amount: env.socialAmount, kind: "tax", day: env.settings.socialDueDay });
  out.push({ id: "tax-main", name: env.settings.mode === "our" ? `НДС за ${env.periodLabel}` : `Налог 910 за ${env.periodLabel}`, amount: Math.round(env.reserveAtDue), kind: "tax", date: env.dueDate });
  return out;
}
