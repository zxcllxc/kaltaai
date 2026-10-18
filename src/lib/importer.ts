import type { Row, RowType } from "./types";
import { fmtDate } from "./dates";

/** Гибкий импорт: CSV/XLSX, выгрузки Kaspi/Kaspi Pay/1С/Excel, русские, казахские и английские заголовки. */

export type Field = "date" | "refund" | "fee" | "item" | "qty" | "amount" | "type" | "supplier" | "income" | "expense";
export type Mapping = Partial<Record<Field, string>>;

export type ImportErrorCode = "empty" | "notTable" | "broken" | "noDates";
export class ImportError extends Error {
  code: ImportErrorCode;
  constructor(code: ImportErrorCode) {
    super(code);
    this.code = code;
  }
}

// порядок важен: возврат и комиссия разбираются раньше «суммы», чтобы не забрать «Сумму комиссии»
const SYN: Record<Field, string[]> = {
  date: ["дата", "date", "күні", "күн", "дата операции", "дата и время", "операция күні", "день", "период"],
  refund: ["возврат", "сумма возврата", "возвраты", "қайтару", "қайтарым", "refund"],
  fee: ["комиссия", "комиссия банка", "комиссия kaspi", "комиссиясы", "fee", "commission"],
  item: ["товар", "наименование", "номенклатура", "тауар", "тауар атауы", "атауы", "өнім", "қызмет", "item", "product", "description", "описание", "детали", "назначение", "статья", "позиция", "услуга", "название"],
  qty: ["кол-во", "количество", "qty", "quantity", "шт", "саны", "мөлшері", "кол"],
  amount: ["сумма", "amount", "итого", "сумма операции", "total", "сомасы", "сома", "стоимость", "выручка", "sum"],
  type: ["тип", "тип операции", "түрі", "операция түрі", "type", "операция", "вид операции", "вид", "направление", "категория", "category"],
  supplier: ["поставщик", "контрагент", "жеткізуші", "supplier", "vendor", "получатель", "отправитель"],
  income: ["приход", "поступление", "доход", "кредит", "кіріс", "income"],
  expense: ["расход", "списание", "дебет", "шығыс", "expense"],
};

const CANON: Record<Field, string> = {
  date: "Дата",
  refund: "Возврат",
  fee: "Комиссия",
  item: "Товар",
  qty: "Количество",
  amount: "Сумма",
  type: "Тип",
  supplier: "Поставщик",
  income: "Приход",
  expense: "Расход",
};

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, "").trim();

export function guessMapping(headers: string[]): Mapping {
  const m: Mapping = {};
  for (const f of Object.keys(SYN) as Field[]) {
    const free = headers.filter((h) => !Object.values(m).includes(h));
    const hit = free.find((h) => SYN[f].includes(norm(h))) ?? free.find((h) => SYN[f].some((s) => s.length > 2 && (norm(h).startsWith(s) || norm(h).includes(s))));
    if (hit) m[f] = hit;
  }
  return m;
}

/** «12 500,00 ₸», «1,234.56», «1.234,56», «−2 000», «85 000 тг» → число */
export function parseNumber(v: unknown): number {
  if (typeof v === "number") return v;
  if (v == null) return NaN;
  let s = String(v)
    .replace(/[\s  ₸]|тг|kzt|тенге|теңге/gi, "")
    .replace(/[−–—]/g, "-");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    // десятичный разделитель — тот, что правее
    s = lastComma > lastDot ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (lastComma >= 0) {
    s = /,\d{1,2}$/.test(s) && (s.match(/,/g) ?? []).length === 1 ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  if (!/^-?\d*\.?\d+$/.test(s)) return NaN;
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
  if (m) return valid(+m[1], +m[2], +m[3]);
  m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
  if (m) return valid(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2], +m[1]);
  return null;
}
function valid(y: number, mo: number, d: number) {
  if (y < 2000 || y > 2100 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return fmtDate(new Date(y, mo - 1, d));
}

// категории расходов: строгие слова, чтобы «Вода минеральная» в магазине не стала коммуналкой
const EXPENSE_WORDS: [RegExp, string][] = [
  [/аренд|жалға|rent\b/i, "Аренда"],
  [/зарплат|з\/п|жалақы|оклад|аванс сотруд|salary|payroll/i, "Зарплата"],
  [/налог|салық|кгд|(^|[^а-яё])опв([^а-яё]|$)|осмс|соцплат|соц\. ?плат|\btax\b/i, "Налоги"],
  [/коммунал|электроэнерг|электричеств|за свет|газоснабж|водоснабж|за воду|интернет|услуги связи|байланыс|utilities/i, "Коммуналка"],
];
const RE_PURCHASE = /закуп|постав|поступление товар|приход товар|приобрет|оприход|накладн|оптом|покупка у|сатып ал|тауар кіріс|purchase|restock/;
const RE_SALE = /прода|реализ|выручк|пополнен|поступлен|оплата от|kaspi qr|(^|\s)сату|сатылым|доход|түсім|\bsale|income|revenue/;
const RE_EXPENSE = /расход|списан|перевод|оплата|платеж|платёж|шығыс|төлем|expense|payment/;

function expenseCategory(text: string) {
  for (const [re, cat] of EXPENSE_WORDS) if (re.test(text)) return cat;
  return null;
}

export function classify(typeVal: string, item: string, amount: number, hasType: boolean): { type: RowType; category?: string } {
  const tv = typeVal.toLowerCase().trim();
  if (tv && RE_PURCHASE.test(tv)) return { type: "purchase" };
  if (tv && RE_SALE.test(tv)) return { type: "sale" };
  // тип указывает на расход или его нет — смотрим на слова (аренда, зарплата, налог…)
  if (!tv || RE_EXPENSE.test(tv) || expenseCategory(tv)) {
    const cat = expenseCategory(`${tv} ${item}`);
    if (cat) return { type: "expense", category: cat };
  }
  if (tv && RE_EXPENSE.test(tv)) return { type: "expense", category: "Прочее" };
  if (/покупка/.test(tv)) return { type: amount < 0 ? "purchase" : "sale" }; // Kaspi Pay: «Покупка» клиента = наша продажа
  if (!hasType || !tv) return { type: amount < 0 ? "purchase" : "sale" };
  return amount < 0 ? { type: "expense", category: "Прочее" } : { type: "sale" };
}

export interface ParsedTable {
  headers: string[];
  records: Record<string, unknown>[];
  sheets?: number;
}

/** Уверены ли мы в колонках: есть дата и сумма (или приход/расход). */
export function isConfident(m: Mapping) {
  return !!m.date && !!(m.amount || m.income || m.expense);
}

const NOT_TABLE = /\.(png|jpe?g|gif|webp|heic|heif|bmp|tiff?|pdf|docx?|pptx?|zip|rar|7z|mp4|mov|mp3|m4a|ogg|opus)$/i;

export async function readFile(file: File): Promise<ParsedTable> {
  const name = file.name.toLowerCase();
  if (!file.size) throw new ImportError("empty");
  if (NOT_TABLE.test(name) || /^(image|video|audio)\//.test(file.type) || file.type === "application/pdf") throw new ImportError("notTable");
  let table: ParsedTable;
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".xlsm")) {
    const XLSX = await import("xlsx");
    let wb: import("xlsx").WorkBook;
    try {
      wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    } catch {
      throw new ImportError("broken");
    }
    // читаем ВСЕ листы (Kaspi Pay кладёт месяцы/точки на разные листы) и объединяем
    const sheets = wb.SheetNames.map((n) => fromMatrix(XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[n], { header: 1, raw: true, defval: "" })));
    const tables = sheets.filter((t) => t.records.length && guessMapping(t.headers).date);
    if (!tables.length) table = sheets[0] ?? { headers: [], records: [] };
    else if (tables.length === 1) table = { ...tables[0], sheets: 1 };
    else {
      // у листов могут быть разные заголовки (Сумма / Сомасы) — приводим к общим названиям
      const canon = tables.map((t) => {
        const m = guessMapping(t.headers);
        const rename = new Map(Object.entries(m).map(([f, h]) => [h as string, CANON[f as Field]]));
        return t.records.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [rename.get(k) ?? k, v])));
      });
      const records = canon.flat();
      table = { headers: [...new Set(records.flatMap((r) => Object.keys(r)))], records, sheets: tables.length };
    }
  } else {
    const text = (await file.text()).replace(/^﻿/, "");
    if (!text.trim()) throw new ImportError("empty");
    // бинарный мусор (картинка или архив с расширением .csv)
    const bad = (text.slice(0, 4000).match(/[\u0000-\u0008\u000e-\u001f�]/g) ?? []).length;
    if (bad > 20) throw new ImportError("notTable");
    const Papa = (await import("papaparse")).default;
    const res = Papa.parse<string[]>(text, { skipEmptyLines: true, delimiter: "" });
    table = fromMatrix(res.data);
  }
  if (!table.records.length) throw new ImportError("empty");
  if (!looksTabular(table)) throw new ImportError("noDates");
  return table;
}

/** Есть ли в таблице вообще даты и числа (иначе это не выгрузка продаж). */
function looksTabular(t: ParsedTable) {
  const sample = t.records.slice(0, 200);
  let withDate = 0;
  let withNum = 0;
  for (const r of sample) {
    const vals = Object.values(r);
    if (vals.some((v) => parseAnyDate(v))) withDate++;
    if (vals.some((v) => !isNaN(parseNumber(v)) && v !== "" && !(v instanceof Date))) withNum++;
  }
  return withDate >= Math.max(1, sample.length * 0.3) && withNum >= Math.max(1, sample.length * 0.3);
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
  const records = raw.slice(hi + 1).map((r) => Object.fromEntries(headers.map((h, i) => [h, (r ?? [])[i]])));
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
    const item = String((m.item ? rec[m.item] : "") || "Выручка").trim().slice(0, 80);
    const typeVal = String((m.type ? rec[m.type] : "") ?? "");
    // Kaspi Pay: комиссия — отдельный расход; возврат — минус к выручке
    const fee = m.fee ? Math.abs(parseNumber(rec[m.fee])) : NaN;
    if (!isNaN(fee) && fee > 0) rows.push({ date, type: "expense", item: "Комиссия Kaspi", qty: 1, amount: fee, category: "Комиссия" });
    const refundCol = m.refund ? Math.abs(parseNumber(rec[m.refund])) : NaN;
    if (/возврат|қайтар|refund|отмена/i.test(typeVal)) {
      rows.push({ date, type: "sale", item: item === "Выручка" ? "Возвраты" : item, qty: 1, amount: -Math.abs(amount) });
      continue;
    }
    const { type, category } = classify(typeVal, item, amount, !!m.type);
    const q = m.qty ? parseNumber(rec[m.qty]) : NaN;
    rows.push({
      date,
      type,
      item: type === "expense" ? category ?? item : item,
      qty: isNaN(q) || q === 0 ? 1 : Math.abs(q),
      amount: type === "sale" && !isNaN(refundCol) ? Math.abs(amount) - refundCol : Math.abs(amount),
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
  "2026-10-01,аренда,Аренда,1,150000,\n" +
  "2026-10-02,продажа,Молоко 1 л,25,13000,\n" +
  "2026-10-05,зарплата,Зарплата,1,160000,\n";
