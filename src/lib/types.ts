export type Biz = "shop" | "cafe" | "salon" | "auto";

export type RowType = "sale" | "purchase" | "expense";

export interface Row {
  date: string; // YYYY-MM-DD
  type: RowType;
  item: string;
  qty: number;
  amount: number; // always positive, ₸
  supplier?: string;
  category?: string; // for expenses: аренда, зарплата, налоги...
}

export interface CalendarItem {
  id: string;
  name: string;
  amount: number;
  kind: "rent" | "salary" | "tax" | "supplier" | "utilities" | "other";
  /** monthly on this day of month */
  day?: number;
  /** one-off date YYYY-MM-DD */
  date?: string;
}

export interface Dataset {
  biz: Biz;
  isDemo: boolean;
  source: string; // "демо-данные" or file name
  rows: Row[];
  cash: number; // остаток денег на сегодня
  today: string; // YYYY-MM-DD — first forecast day
  calendar: CalendarItem[];
}

export interface WhatIf {
  deadDiscount: number; // 0..0.6
  delayDays: number; // 0..14 delay of largest supplier payment
  priceUp: number; // 0..0.15
}

export const NO_WHATIF: WhatIf = { deadDiscount: 0, delayDays: 0, priceUp: 0 };
