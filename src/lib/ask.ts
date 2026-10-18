import { analyze, money, type Analysis } from "./analytics";
import { addDays, daysBetween, dueDate, fmtDate, human, humanWd, longDate, parseDate, weekdayFull, WD_RU_ACC } from "./dates";
import { dn } from "./demo";
import { actionText, cap, q as quote, storyText, T, type Lang } from "./texts";
import type { Dataset } from "./types";
import { NO_WHATIF } from "./types";

/** «Спроси KaltaAI»: ответы строятся кодом по посчитанным цифрам. LLM потом только пересказывает их. */

const WD_RE: [RegExp, number][] = [
  [/понедельн|дүйсенбі/i, 1],
  [/вторн|сейсенбі/i, 2],
  [/сред[ау]|сәрсенбі/i, 3],
  [/четверг|бейсенбі/i, 4],
  [/пятниц|жұма/i, 5],
  [/суббот|сенбі/i, 6],
  [/воскрес|жексенбі/i, 0],
];

export const MAX_QUESTION = 300;

export function answer(q: string, a: Analysis, ds: Dataset, lang: Lang = "ru"): string {
  const s = q.toLowerCase();
  const kz = lang === "kz";
  const t = T[lang];
  const st = storyText(a.story, a, lang);
  const wdHit = WD_RE.find(([re]) => re.test(s))?.[1];
  const top = a.actions.slice(0, 3);

  // 1. перенос платежа поставщику
  if (/не заплач|не плат|перенес|отложить плат|кейінге қалдыр|төлемесем|төлемеу/.test(s) && !/налог|салық/.test(s)) {
    const lp = a.largestPayment;
    if (!lp) return kz ? "Алдағы 14 күнде жеткізушіге ірі төлем жоқ — кейінге қалдыратын ештеңе жоқ." : "В ближайшие 14 дней крупных платежей поставщикам нет — переносить нечего.";
    const target = wdHit ?? 5;
    let d = parseDate(lp.due);
    let k = 0;
    while (d.getDay() !== target && k < 7) {
      d = addDays(d, 1);
      k++;
    }
    if (k === 0) k = 7;
    const after = analyze(ds, { ...NO_WHATIF, delayDays: k });
    const name = dn(lp.name, lang);
    if (kz)
      return [
        `${quote(name)} төлемі ${money(lp.amount)}, жоспар бойынша ${humanWd(lp.due, "kz")}. Оны ${dueDate(fmtDate(d), "kz")} дейін (+${k} күн) кейінге қалдырсаңыз:`,
        `• қазір бүгін бос ақша ${money(a.story.free)}`,
        `• кейін бос ақша ${money(after.story.free)}${after.story.kind === "ok" ? " — 14 күнде жетіспеушілік жоқ ✅" : ""}`,
        "Тәуекел: жеткізуші келесі жүкті ұстап қалуы мүмкін — алдын ала жазбаша келісіңіз.",
      ].join("\n");
    return [
      `Платёж ${quote(name)} на ${money(lp.amount)} по плану ${humanWd(lp.due)}. Если перенести его до ${humanWd(fmtDate(d))} (+${k} дн.):`,
      `• сейчас свободно сегодня ${money(a.story.free)}`,
      `• после переноса ${money(after.story.free)}${after.story.kind === "ok" ? " — нехватки в 14 днях нет ✅" : ""}`,
      "Риск: поставщик может придержать следующую отгрузку — договоритесь заранее и письменно.",
    ].join("\n");
  }

  // 2. налоги
  if (/налог|салық|ндс|ққс|910/.test(s)) {
    const tx = a.tax;
    const days = daysBetween(a.today, tx.dueDate);
    const soc = tx.socialNext ? (kz ? ` ЖК әлеуметтік төлемдері — ${money(tx.socialAmount)}, ${dueDate(tx.socialNext, "kz")} дейін.` : ` Соцплатежи ИП — ${money(tx.socialAmount)} до ${human(tx.socialNext)}.`) : "";
    if (kz) return `Қазір салыққа ${money(tx.reserve)} бөліп қойыңыз. ${dueDate(tx.dueDate, "kz")} дейін (${days} күннен кейін) шамамен ${money(tx.reserveAtDue)} төлеу керек болады.${soc} Бұл сома резервке кіреді — оны жұмсамаңыз. Есеп шамамен жасалған, салық кеңесі емес.`;
    return `Отложите на налог сейчас ${money(tx.reserve)}. До ${longDate(tx.dueDate)} (через ${days} дн.) нужно будет заплатить ≈ ${money(tx.reserveAtDue)}.${soc} Эти деньги входят в резерв — их нельзя тратить. Расчёт ориентировочный, не налоговая консультация.`;
  }

  // 3. сколько можно забрать
  if (/забрать|вывести|снять|потратить|свободн|можно взять|алуға|бос ақша|қанша ақша ал|жұмсауға/.test(s)) {
    if (a.story.free >= 0)
      return kz
        ? `Бүгін ${money(a.story.free)} дейін алуға болады: 14 күндік барлық төлем мен резерв (салық + 7 күндік шығын) жабылған күйде қалады. Ең қиын күн — ${longDate(a.story.critical, "kz")}.`
        : `Сегодня можно забрать до ${money(a.story.free)}: все платежи на 14 дней и резерв (налог + 7 дней расходов) останутся покрыты. Самый трудный день — ${longDate(a.story.critical)}.`;
    const first = top[0];
    const fix = first ? (kz ? ` Алдымен жетіспеушілікті жабыңыз: ${actionText(first, "kz").title.toLowerCase()} (+${money(first.effect)}).` : ` Сначала закройте нехватку: ${actionText(first, "ru").title.toLowerCase()} (+${money(first.effect)}).`) : "";
    return kz ? `Бүгін ақша алмаңыз: бос ақша ${money(a.story.free)}. ${st.sentence}${fix}` : `Сегодня забирать деньги нельзя: свободно ${money(a.story.free)}. ${st.sentence}${fix}`;
  }

  // 4. выручка в конкретный день недели
  if (wdHit != null && /выручк|продаж|прибыл|упал|просел|түсім|сатылым|пайда|төмен/.test(s)) {
    const wd = wdHit;
    const avg = a.wdAvg[wd];
    const others = a.wdAvg.filter((_, i) => i !== wd && a.wdAvg[i] > 0).sort((x, y) => x - y);
    const med = a.weak?.wd === wd ? a.weak.median : others[Math.floor(others.length / 2)] ?? avg;
    const drop = a.weak?.wd === wd ? a.weak.dropPct : med > 0 ? 1 - avg / med : 0;
    if (drop < 0.08) return kz ? `${cap(weekdayFull(wd, "kz"))} — әдеттегі күн: ${money(avg)}, орташа ${money(med)}. Құлдырау жоқ.` : `${cap(weekdayFull(wd))} — обычный день: ${money(avg)} против ${money(med)} в среднем. Провала нет.`;
    const loss = money((med - avg) * 4.3 * a.margin);
    return kz
      ? `${cap(weekdayFull(wd, "kz"))} күнгі түсім орта есеппен ${money(avg)} — әдеттегі күннен ${Math.round(drop * 100)}% төмен (${money(med)}). Бұл айына ≈ ${loss} алынбаған пайда. Тек осы күні акция жасаңыз («2+1», түске дейін жеңілдік) және алдыңғы кеші WhatsApp-қа жазыңыз.`
      : `${wd === 2 ? "Во" : "В"} ${WD_RU_ACC[wd]} выручка в среднем ${money(avg)} — на ${Math.round(drop * 100)}% ниже обычного дня (${money(med)}). Это ≈ ${loss} недополученной прибыли в месяц. Сделайте акцию только в этот день («2+1», скидка до 12:00) и напишите клиентам в WhatsApp накануне вечером.`;
  }

  // 5. почему не хватает
  if (/почему|не хватает|не хватит|нехват|откуда|неге|жетпей|жетіспе/.test(s)) {
    if (a.story.kind === "ok") return kz ? `Ақша жетеді: бүгін бос ${money(a.story.free)}. ${st.reserveLine}` : `Денег хватает: свободно сегодня ${money(a.story.free)}. ${st.reserveLine}`;
    const pays = [...a.story.breakdown.payments].sort((x, y) => y.amount - x.amount).slice(0, 3);
    const list = pays.map((p) => `${dn(p.name, lang)} ${money(p.amount)}`).join(", ");
    return kz
      ? `${st.sentence} ${dueDate(a.story.critical, "kz")} дейін шамамен ${money(a.story.breakdown.inflow)} түсім түседі, бірақ төлемдер кетеді: ${list}. Оған қоса ${money(a.reserve)} резервті сақтау керек: салық ${money(a.taxReserve)} және 7 күндік шығын ${money(a.safety)}.`
      : `${st.sentence} До ${longDate(a.story.critical)} придёт ≈ ${money(a.story.breakdown.inflow)} выручки, но уйдут платежи: ${list}. И нужно сохранить резерв ${money(a.reserve)}: налог ${money(a.taxReserve)} и 7 дней расходов ${money(a.safety)}.`;
  }

  // 6. что сделать на неделе
  if (/недел|сделать|делать|начать|план|апта|істеу|бастау/.test(s)) {
    if (!top.length) return kz ? "Қазір шұғыл әрекет керек емес — бәрі қалыпты." : "Срочных действий нет — всё в порядке.";
    const lines = top.map((x, i) => `${i + 1}) ${actionText(x, lang).title} — +${money(x.effect)}, ${kz ? "мерзімі" : "срок"} ${x.deadlineDays} ${t.days}`);
    const tail = a.prevented > 0 ? (kz ? `1–2 қадам ${money(a.prevented)} жетіспеушілікті жабады.` : `Шаги 1–2 закрывают нехватку ${money(a.prevented)}.`) : "";
    return [kz ? "Осы аптада:" : "На этой неделе:", ...lines, tail].filter(Boolean).join("\n");
  }

  // 7. товар без движения
  if (/лежит|без движ|залеж|остат|склад|не прода|қозғалыссыз|жатыр|қалдық|сатылмай/.test(s)) {
    if (!a.dead.length) return a.hasStock ? (kz ? "30+ күн сатылмаған тауар жоқ." : "Товара без продаж 30+ дней нет.") : kz ? "Файлда сатып алу жоқ — қалдықты есептей алмаймыз." : "В файле нет закупок — остатки посчитать нельзя.";
    const lines = a.dead.map((d) => (kz ? `• ${dn(d.name, "kz")}: ${d.stockQty} дана, ${money(d.frozen)}, ${d.daysNoSale} күн сатылмаған` : `• ${d.name}: ${d.stockQty} шт, ${money(d.frozen)}, ${d.daysNoSale} дн. без продаж`));
    return kz
      ? [`30+ күн сатылмаған тауарда ${money(a.frozenTotal)} қатып тұр:`, ...lines, "Кеңес: 30% жеңілдік ақшаны бір аптада айналымға қайтарады."].join("\n")
      : [`Без продаж 30+ дней лежит товара на ${money(a.frozenTotal)}:`, ...lines, "Совет: скидка 30% вернёт деньги в оборот за неделю."].join("\n");
  }

  // 8. самый выгодный товар
  if (/выгодн|прибыльн|маржин|лучш|тиімді|пайдалы/.test(s)) {
    const best = a.items.filter((i) => i.profit != null).sort((x, y) => y.profit! - x.profit!).slice(0, 3);
    if (!best.length) return kz ? "Пайданы есептеу үшін бір тауардың сатылымы да, сатып алуы да керек." : "Чтобы посчитать выгоду, нужны и продажи, и закупки по одним товарам.";
    return [kz ? "Кезеңдегі ең көп пайда:" : "Больше всего прибыли за период:", ...best.map((i, k) => `${k + 1}) ${dn(i.name, lang)} — ${money(i.profit!)} (${kz ? "маржа" : "маржа"} ${Math.round(i.marginPct! * 100)}%)`)].join("\n");
  }

  // 9. сколько заработал
  if (/сколько|заработ|прибыл|выручк|табыс|пайда|түсім/.test(s)) {
    return kz
      ? `Соңғы 30 күнде (бағалау): түсім ${money(a.sales30)}, сатып алу ${money(a.purchases30)}, басқа шығыс ${money(a.expenses30)}. Пайда ≈ ${money(a.profit30)}.`
      : `За последние 30 дней (оценка): выручка ${money(a.sales30)}, закупки ${money(a.purchases30)}, прочие расходы ${money(a.expenses30)}. Прибыль ≈ ${money(a.profit30)}.`;
  }

  return kz ? `Мен сіздің сандарыңыз бойынша жауап беремін. Қазір ең бастысы: бүгін бос ақша ${money(a.story.free)}. ${st.sentence} Мысалы, сұраңыз: «${t.suggestions[1]}»` : `Я отвечаю по вашим цифрам. Сейчас главное: свободно сегодня ${money(a.story.free)}. ${st.sentence} Спросите, например: «${t.suggestions[1]}»`;
}
