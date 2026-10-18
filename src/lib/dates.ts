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

type L = "ru" | "kz";

const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const MONTHS_KZ = ["қаң", "ақп", "нау", "сәу", "мам", "мау", "шіл", "там", "қыр", "қаз", "қар", "жел"];
const MONTHS_RU_GEN = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
const MONTHS_KZ_FULL = ["қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым", "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан"];
const MONTHS_KZ_LOC = ["қаңтарда", "ақпанда", "наурызда", "сәуірде", "мамырда", "маусымда", "шілдеде", "тамызда", "қыркүйекте", "қазанда", "қарашада", "желтоқсанда"];
export const WD_RU = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
export const WD_RU_FULL = ["воскресенье", "понедельник", "вторник", "среда", "четверг", "пятница", "суббота"];
export const WD_RU_ACC = ["воскресенье", "понедельник", "вторник", "среду", "четверг", "пятницу", "субботу"];
export const WD_KZ = ["жс", "дс", "сс", "ср", "бс", "жм", "сб"];
export const WD_KZ_FULL = ["жексенбі", "дүйсенбі", "сейсенбі", "сәрсенбі", "бейсенбі", "жұма", "сенбі"];

/** «27 окт» / «27 қаз» */
export function human(s: string, lang: L = "ru") {
  const d = parseDate(s);
  return `${d.getDate()} ${(lang === "kz" ? MONTHS_KZ : MONTHS_RU)[d.getMonth()]}`;
}

/** «27 окт, вт» */
export function humanWd(s: string, lang: L = "ru") {
  const d = parseDate(s);
  return `${human(s, lang)}, ${(lang === "kz" ? WD_KZ : WD_RU)[d.getDay()]}`;
}

/** «27 октября» / «27 қазан» */
export function longDate(s: string, lang: L = "ru") {
  const d = parseDate(s);
  return `${d.getDate()} ${(lang === "kz" ? MONTHS_KZ_FULL : MONTHS_RU_GEN)[d.getMonth()]}`;
}

/** Обстоятельство времени: «27 октября» / «27 қазанда» */
export function onDate(s: string, lang: L = "ru") {
  const d = parseDate(s);
  return lang === "kz" ? `${d.getDate()} ${MONTHS_KZ_LOC[d.getMonth()]}` : longDate(s, "ru");
}

export function weekdayFull(wd: number, lang: L = "ru") {
  return (lang === "kz" ? WD_KZ_FULL : WD_RU_FULL)[wd];
}

const MONTHS_KZ_DAT = ["қаңтарға", "ақпанға", "наурызға", "сәуірге", "мамырға", "маусымға", "шілдеге", "тамызға", "қыркүйекке", "қазанға", "қарашаға", "желтоқсанға"];
/** Срок «до …»: RU «25 февраля» (после «до»), KZ «25 ақпанға» (перед «дейін») */
export function dueDate(s: string, lang: L = "ru") {
  const d = parseDate(s);
  return lang === "kz" ? `${d.getDate()} ${MONTHS_KZ_DAT[d.getMonth()]}` : longDate(s, "ru");
}
