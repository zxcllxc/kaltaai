/**
 * Налоговые параметры Казахстана на 2026 год — ЕДИНСТВЕННОЕ место, где они заданы.
 * Пользователь может переопределить любое значение в «Ещё → Налоги».
 * Расчёт ориентировочный, не налоговая консультация.
 *
 * Источники (проверять перед использованием):
 * - МРП 2026 = 4 325 ₸ — Закон РК «О республиканском бюджете на 2026–2028 годы».
 * - Ставка упрощённой декларации в Таразе 2% — решение Таразского городского маслихата № 33-4
 *   (НК РК 2026 разрешает маслихатам корректировать базовую ставку 4% в диапазоне ±50%).
 * - Базовая ставка упрощёнки 4% — Налоговый кодекс РК (ред. 2026).
 * - НДС 16% — Налоговый кодекс РК (ред. 2026).
 * - Порог регистрации по НДС 10 000 МРП = 43 250 000 ₸ — НК РК 2026.
 * - Лимит дохода для упрощёнки 600 000 МРП = 2 595 000 000 ₸ — НК РК 2026.
 * - Соцплатежи ИП «за себя» (ОПВ, СО, ВОСМС, ОПВР) — минимум 21 675 ₸/мес, срок до 25 числа следующего месяца.
 * - Упрощённая декларация (ф. 910) — налог за полугодие платится до 25 числа второго месяца после полугодия:
 *   за 2-е полугодие 2026 — до 25.02.2027, за 1-е полугодие — до 25.08.
 */

export const KZ2026 = {
  mrp: 4325,
  tarazSimplifiedRate: 0.02,
  baseSimplifiedRate: 0.04,
  vatRate: 0.16,
  vatThresholdMrp: 10_000,
  simplifiedLimitMrp: 600_000,
  socialMinMonthly: 21_675,
  socialDueDay: 25,
  halfYearDueDay: 25,
} as const;

export type TaxMode = "taraz2" | "simp4" | "our" | "custom";

export interface TaxSettings {
  mode: TaxMode;
  customRate: number; // доля, 0.03 = 3%
  mrp: number;
  socialMonthly: number;
  socialDueDay: number;
  isIP: boolean;
}

export const DEFAULT_TAX: TaxSettings = {
  mode: "taraz2",
  customRate: 0.03,
  mrp: KZ2026.mrp,
  socialMonthly: KZ2026.socialMinMonthly,
  socialDueDay: KZ2026.socialDueDay,
  isIP: true,
};

export const TAX_MODES: { id: TaxMode; label: string }[] = [
  { id: "taraz2", label: "Упрощёнка, Тараз 2%" },
  { id: "simp4", label: "Упрощёнка 4%" },
  { id: "our", label: "ОУР с НДС 16%" },
  { id: "custom", label: "Своя ставка" },
];

export function taxRate(t: TaxSettings) {
  switch (t.mode) {
    case "taraz2":
      return KZ2026.tarazSimplifiedRate;
    case "simp4":
      return KZ2026.baseSimplifiedRate;
    case "custom":
      return t.customRate;
    case "our":
      return KZ2026.vatRate;
  }
}

export const vatThreshold = (t: TaxSettings) => KZ2026.vatThresholdMrp * t.mrp;
export const simplifiedLimit = (t: TaxSettings) => KZ2026.simplifiedLimitMrp * t.mrp;
