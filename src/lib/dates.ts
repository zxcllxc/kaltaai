export function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function fmtDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDate(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function daysBetween(a: string, b: string) {
  return Math.round((parseDate(b).getTime() - parseDate(a).getTime()) / 86_400_000);
}

const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS_KZ = ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"];
export const WD_RU = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
export const WD_RU_FULL = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
export const WD_RU_ACC = ["воскресенье", "понедельник", "вторник", "среду", "четверг", "пятницу", "субботу"];
export const WD_KZ = ["жс", "дс", "сс", "ср", "бс", "жм", "сн"];

export function human(s: string, lang: "ru" | "kz" = "ru") {
  const d = parseDate(s);
  return `${d.getDate()} ${(lang === "kz" ? MONTHS_KZ : MONTHS_RU)[d.getMonth()]}`;
}

export function humanWd(s: string, lang: "ru" | "kz" = "ru") {
  const d = parseDate(s);
  return `${human(s, lang)}, ${(lang === "kz" ? WD_KZ : WD_RU)[d.getDay()]}`;
}
