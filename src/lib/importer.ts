import Papa from "papaparse";
import type { Row, RowType } from "./types";
import { fmtDate } from "./dates";

/** Гибкий импорт: CSV/XLSX, выгрузки Kaspi/1С/Excel. Колонки угадываются по синонимам. */

export type Field = "date" | "item" | "qty" | "amount" | "type" | "supplier" | "income" | "expense";
export type Mapping = Partial<Record<Field, string>>;

const SYN: Record<Field, string[]> = {
  date: ["дата", "date", "күні", "дата операции", "дата и время", "день", "период"],
  item: ["товар", "наименование", "номенклатура", "item", "product", "описание", "детали", "назначение", "статья", "позиция", "услуга", "название"],
  qty: ["кол-во", "количество", "qty", "quantity", "шт", "саны", "кол"],
  amount: ["сумма", "amount", "итого", "сумма операции", "total", "сомасы", "стоимость", "выручка"],
  type: ["тип", "type", "операция", "вид операции", "вид", "направление", "категория"],
  supplier: ["поставщик", "контрагент", "supplier", "получатель", "отправитель"],
  income: ["приход", "поступление", "доход", "кредит", "income"],
  expense: ["расход", "списание", "дебет", "expense"],
};

export function guessMapping(headers: string[]): Mapping {
  const m: Mapping = {};
  const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, "").trim();
  for (const f of Object.keys(SYN) as Field[]) {
    const hit =
      headers.find((h) => SYN[f].includes(norm(h))) ??
      headers.find((h) => SYN[f].some((s) => norm(h).startsWith(s) || norm(h).includes(s)));
    if (hit && !Object.values(m).includes(hit)) m[f] = hit;
  }
  return m;
}

export function parseNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null) return NaN;
  let s = String(v).replace(/[\s  ₸тгKZT]/gi, "").replace(/[−–]/g, "-");
  if (/,\d{1,2}$/.test(s) && !/\.\d/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  return parseFloat(s);
}

export function parseAnyDate(v: unknown): string | null {
  if (v instanceof Date && !isNaN(v.getTime())) return fmtDate(v);
  if (typeof v === "number" && v > 20000 && v < 80000) {
    // Excel serial
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return fmtDate(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  const s = String(v ?? "").trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return fmtDate(new Date(+m[1], +m[2] - 1, +m[3]));
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (m) {
    const y = +m[3] < 100 ? 2000 + +m[3] : +m[3];
    return fmtDate(new Date(y, +m[2] - 1, +m[1]));
  }
  return null;
}

const EXPENSE_WORDS: [RegExp, string][] = [
  [/аренд|жалға/i, "Аренда"],
  [/зарплат|з\/п|жалақы|оклад|аванс/i, "Зарплата"],
  [/налог|салық|кгд|опв|осмс|соц/i, "Налоги"],
  [/коммун|свет|электр|газ|вода|интернет|связь/i, "Коммуналка"],
];

export function classify(typeVal: string, item: string, amount: number, hasType: boolean): { type: RowType; category?: string } {
  const t = `${typeVal} ${item}`.toLowerCase();
  for (const [re, cat] of EXPENSE_WORDS) if (re.test(t)) return { type: "expense", category: cat };
  if (/закуп|постав|purchase|приход товара|накладн|оптом|покупка у/.test(typeVal.toLowerCase())) return { type: "purchase" };
  if (/прода|sale|выручк|пополнен|поступлен|оплата от|kaspi qr|сату|доход/.test(typeVal.toLowerCase())) return { type: "sale" };
  if (/расход|списан|перевод|покупка|оплата|платеж|платёж/.test(typeVal.toLowerCase())) return { type: amount < 0 ? "expense" : "purchase" };
  if (!hasType) return { type: amount < 0 ? "purchase" : "sale" };
  return { type: amount < 0 ? "expense" : "sale", category: amount < 0 ? "Прочее" : undefined };
}

export interface ParsedTable {
  headers: string[];
  records: Record<string, unknown>[];
}

export async function readFile(file: File): Promise<ParsedTable> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    const XLSX = await import("xlsx");
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: "" });
    return fromMatrix(raw);
  }
  const text = await file.text();
  const res = Papa.parse<string[]>(text.replace(/^﻿/, ""), { skipEmptyLines: true, delimiter: "" });
  return fromMatrix(res.data);
}

/** Ищем строку-заголовок (в выгрузках Kaspi сверху бывает шапка с реквизитами). */
function fromMatrix(raw: unknown[][]): ParsedTable {
  let hi = 0;
  let best = -1;
  for (let i = 0; i < Math.min(30, raw.length); i++) {
    const cells = (raw[i] ?? []).map((c) => String(c ?? ""));
    const score = Object.keys(guessMapping(cells)).length;
    if (score > best) {
      best = score;
      hi = i;
    }
  }
  const headers = (raw[hi] ?? []).map((c, i) => String(c ?? "").trim() || `Колонка ${i + 1}`);
  const records = raw.slice(hi + 1).map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
  return { headers, records };
}

export function toRows(t: ParsedTable, m: Mapping): { rows: Row[]; skipped: number } {
  const rows: Row[] = [];
  let skipped = 0;
  for (const rec of t.records) {
    const date = parseAnyDate(m.date ? rec[m.date] : undefined);
    let amount = m.amount ? parseNumber(rec[m.amount]) : NaN;
    if (isNaN(amount) && (m.income || m.expense)) {
      const inc = m.income ? parseNumber(rec[m.income]) : NaN;
      const exp = m.expense ? parseNumber(rec[m.expense]) : NaN;
      amount = !isNaN(inc) && inc !== 0 ? Math.abs(inc) : !isNaN(exp) && exp !== 0 ? -Math.abs(exp) : NaN;
    }
    if (!date || isNaN(amount) || amount === 0) {
      skipped++;
      continue;
    }
    const item = String((m.item ? rec[m.item] : "") || "Без названия").trim().slice(0, 80);
    const typeVal = String((m.type ? rec[m.type] : "") ?? "");
    const { type, category } = classify(typeVal, item, amount, !!m.type);
    const q = m.qty ? parseNumber(rec[m.qty]) : NaN;
    rows.push({
      date,
      type,
      item: type === "expense" ? category ?? item : item,
      qty: isNaN(q) || q === 0 ? 1 : Math.abs(q),
      amount: Math.abs(amount),
      supplier: m.supplier ? String(rec[m.supplier] ?? "") || undefined : undefined,
      category,
    });
  }
  return { rows, skipped };
}

export const TEMPLATE_CSV =
  "дата,тип,товар,количество,сумма,поставщик\n" +
  "2026-10-01,продажа,Хлеб,40,7200,\n" +
  "2026-10-01,закупка,Молоко 1 л,30,12300,ТОО «Жамбыл-Сут»\n" +
  "2026-10-01,аренда,Аренда,1,250000,\n" +
  "2026-10-02,продажа,Молоко 1 л,25,13000,\n" +
  "2026-10-05,зарплата,Зарплата,1,420000,\n";
