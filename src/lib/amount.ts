/** Разбор сумм, как их говорят и пишут: «85к», «85 тысяч», «85 мың», «1,2 млн», «1 200 000 ₸». */
export function parseAmount(input: string): number | null {
  if (!input) return null;
  const s = input.toLowerCase().replace(/[  ]/g, " ").replace(/₸|тг|тенге|теңге|kzt/g, "").trim();
  const m = s.match(/(-?\d[\d\s]*(?:[.,]\d+)?)\s*([a-zа-яёәғқңөұүһі.]*)/);
  if (!m) return null;
  let num = m[1].trim().replace(/\s/g, "");
  // «1 200,5» или «1,2»: запятая — десятичный разделитель, если после неё 1–2 цифры
  if (/,\d{1,2}$/.test(num)) num = num.replace(",", ".");
  else num = num.replace(/,/g, "");
  let v = parseFloat(num);
  if (!Number.isFinite(v)) return null;
  const unit = (m[2] ?? "").replace(/\.$/, "");
  if (/^(млрд|миллиард)/.test(unit)) v *= 1e9;
  else if (/^(млн|миллион)/.test(unit)) v *= 1e6;
  else if (/^(тыс|мың|мын)/.test(unit) || unit === "к" || unit === "k") v *= 1e3;
  return Math.round(v);
}

/** Число месяца: «25», «25-го», «25 числа», «25-күні» */
export function parseDay(input: string): number | null {
  const m = String(input ?? "").match(/(\d{1,2})/);
  if (!m) return null;
  const d = +m[1];
  return d >= 1 && d <= 31 ? d : null;
}
