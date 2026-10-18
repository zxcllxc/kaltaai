import type { Action, Analysis, Story } from "./analytics";
import { kmoney, money } from "./analytics";
import { human, longDate, onDate, WD_RU_ACC, WD_KZ_FULL, weekdayFull } from "./dates";
import { bizName, dn } from "./demo";
import type { Dataset } from "./types";

export type Lang = "ru" | "kz";

/** Название в кавычках «…», если оно ещё не в кавычках */
export function q(name: string) {
  return /[«»"]/.test(name) ? name : `«${name}»`;
}

export function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ------------------------------------------------------------------ */
/* Словарь интерфейса. KZ обязан содержать все ключи RU (проверка TS). */
/* ------------------------------------------------------------------ */

const RU = {
  tagline: "ИИ-финдиректор для бизнеса Тараза",
  demoBadge: "демо-данные",
  langToggle: "ҚАЗ",
  themeAria: "Сменить тему",
  deleteData: "Удалить мои данные",
  deleteConfirm: "Точно удалить?",
  yes: "Да",
  no: "Нет",
  // старт
  heroTitle: "Финдиректор, который находит деньги в ₸",
  heroText: "Загрузите продажи и закупки — увидите, сколько денег свободно сегодня, когда их не хватит и что сделать.",
  pick: "Какой у вас бизнес?",
  shop: "Магазин",
  cafe: "Кафе",
  salon: "Салон красоты",
  auto: "Автосервис",
  demo: "Попробовать на демо",
  demoNote: "Сгенерированные данные за 9 недель — помечены «демо-данные», это не реальный бизнес.",
  upload: "Загрузить свой CSV / Excel / Kaspi",
  reading: "Читаю файл…",
  template: "Скачать шаблон CSV",
  pitchLink: "Режим питча для жюри →",
  privacy: "Файлы обрабатываются в вашем браузере и хранятся только в нём. ИИ получает лишь итоговые цифры. Удалить данные — одной кнопкой.",
  quickStart: "Быстрый старт без файла — 5 вопросов",
  noscript: "Для работы KaltaAI нужен JavaScript — включите его в настройках браузера.",
  mapTitle: "Сопоставьте колонки",
  mapRows: (file: string, n: number, sheets: number) => `${file}: ${n} строк${sheets > 1 ? ` с ${sheets} листов` : ""}. Укажите, где дата и сумма; возвраты и комиссии вычтем из выручки.`,
  fDate: "Дата *",
  fAmount: "Сумма *",
  fItem: "Товар / описание",
  fQty: "Количество",
  fType: "Тип операции",
  fSupplier: "Поставщик",
  fRefund: "Возврат / қайтару",
  fFee: "Комиссия",
  fIncome: "Приход (если нет «Суммы»)",
  fExpense: "Расход (если нет «Суммы»)",
  none: "— нет —",
  preview: (n: number, total: number, s: number, p: number, e: number) => `Распознано: ${n} из первых ${total} строк · продажи ${s}, закупки ${p}, расходы ${e}`,
  mapHint: "Без колонки «Тип»: плюс — продажа, минус — закупка. Аренда, зарплата и налоги определяются по словам.",
  analyze: "Анализировать",
  errEmpty: "Файл пустой — в нём нет строк.",
  errNotTable: "Это не таблица. Загрузите CSV или Excel (.xlsx, .xls).",
  errBroken: "Файл повреждён или это не Excel. Сохраните его заново как .xlsx или .csv.",
  errNoDates: "Не нашли в файле дат и сумм. Проверьте, что это выгрузка продаж.",
  errFew: (n: number, skipped: number) => `Распознано только ${n} строк (пропущено ${skipped}). Проверьте колонки «Дата» и «Сумма».`,
  errUnsure: "Не уверены в колонках — проверьте сопоставление ниже.",
  errRead: "Не удалось прочитать файл.",
  // навигация
  navHome: "Главная",
  navForecast: "14 дней",
  navLeaks: "Утечки",
  navPlan: "План",
  navChat: "Брифинг",
  navMore: "Ещё",
  // главная
  demoBanner1: "Это ",
  demoBanner2: "демо-данные",
  demoBanner3: ": сгенерированный пример точки в Таразе с заложенными проблемами. Загрузите свой файл, чтобы увидеть реальные цифры.",
  freeTitle: "Свободно сегодня",
  breakdownTitle: "Из чего посчитано",
  bdCash: "Деньги в кассе сейчас",
  bdInflow: (d: string) => `+ выручка до ${d} (прогноз)`,
  bdPurch: (d: string) => `− закупки до ${d}`,
  bdTax: "− резерв на налог",
  bdSafety: "− запас: 7 дней аренды, зарплаты, коммуналки",
  bdResult: "= свободно сегодня",
  bdHardest: (d: string) => `Самый трудный день — ${d}.`,
  foundTitle: "Мы нашли",
  foundSub: "денег, которые сейчас теряются или заморожены",
  foundFrozen: "Замороженные остатки",
  foundWeak: "Слабые дни (в мес.)",
  foundRise: "Рост закупок (в мес.)",
  prevented: "Предотвращённый разрыв",
  preventedHint: "если сделать шаги 1–2",
  noShortfall: "нехватки нет",
  frozenMoney: "Замороженные деньги",
  frozenHint: (n: number) => `${n} поз. без продаж 30+ дней`,
  forecastTitle: "Деньги на 14 дней",
  details: "Подробно →",
  todoTitle: "Что делать",
  allN: (n: number) => `Все ${n} →`,
  savedLine: (s: string, x: number) => `Реально сэкономлено: ${s} · окупаемость сервиса: ×${x}`,
  dataFooter: (from: string, to: string, days: number, src: string) => `Данные: ${from} — ${to} (${days} дн.), источник: ${src}. Все суммы посчитаны кодом по вашим данным; ИИ только формулирует советы.`,
  cashLabel: "Деньги в кассе сейчас",
  cashCheck: " (уточните)",
  // история денег
  okSentence: (x: string) => `Можно спокойно потратить до ${x}: все платежи на 14 дней и резерв покрыты.`,
  reserveSentence: (d: string, x: string) => `${d} деньги уйдут в налоговый резерв: не хватит ${x}.`,
  reserveToday: (x: string) => `Уже сегодня в кассе меньше резерва: не хватает ${x}.`,
  cashSentence: (d: string, x: string, pay: string) => `${d} не хватит ${x} на ${pay} — касса уйдёт в минус.`,
  cause: (pay: string, amt: string) => `Причина — ${pay}: ${amt}.`,
  reserveLine: (r: string, tax: string, safe: string) => `Резерв ${r} — деньги, которые нельзя тратить: налог ${tax} + 7 дней аренды, зарплаты и коммуналки ${safe}.`,
  reserveLineNoTax: (r: string) => `Резерв ${r} — 7 дней аренды, зарплаты и коммуналки: их нельзя тратить.`,
  extraReserve: (r: string) => `Ещё ${r} нужно сохранить на налог и запас.`,
  shortShortfall: (d: string, x: string) => `${d}: не хватит ${x}`,
  noShortfallShort: "Нехватки нет",
  // прогноз
  legendBase: "базовый",
  legendPess: "пессимистичный",
  legendOpt: "оптимистичный",
  legendWas: "без изменений",
  legendReserve: "резерв",
  scPess: "Пессимистичный",
  scBase: "Базовый",
  scOpt: "Оптимистичный",
  scPessHint: "выручка −15%",
  scBaseHint: "как последние 4 недели",
  scOptHint: "выручка +10%",
  in14: (x: string) => `Через 14 дней в кассе: ${x}`,
  whatIfTitle: "Что если…",
  whatIfSub: "Двигайте ползунки — прогноз и «Свободно сегодня» пересчитываются сразу",
  reset: "сбросить",
  knobDiscount: "Скидка на залежавшийся товар",
  noteDiscount: (x: string, pct: number) => `Вернёт ≈ ${x} за неделю (продастся ~${pct}%)`,
  noteDiscount0: "Чем больше скидка, тем быстрее уйдёт остаток",
  noDead: "Залежавшегося товара нет",
  knobDelay: (n: string) => `Перенести платёж ${n}`,
  knobDelayGeneric: "Перенести крупный платёж",
  noteDelay: (amt: string, d: string) => `${amt}, по плану ${d}`,
  noBigPayments: "Крупных платежей в окне нет",
  daysUnit: "дн.",
  knobPrice: "Поднять цены",
  notePrice: "Допущение: при +10% цены продажи падают на 5% в штуках",
  freeNow: "Свободно сегодня",
  was: (x: string) => `было ${x}`,
  returns: (x: string) => `Вернёте в оборот за 14 дней: ${x}`,
  shortfallLess: (x: string) => `Нехватка меньше на ${x}`,
  delayedOut: "⚠️ Перенесённый платёж ушёл за горизонт 14 дней — деньги на него всё равно понадобятся.",
  byDays: "По дням",
  method: (r: string, ratio: number) => `Жёлтая линия — резерв ${r}: налог + 7 дней фиксированных расходов. Ниже неё — нехватка. Прогноз: средняя выручка по дням недели за 4 недели; закупки в той же доле от выручки (${ratio}%); плюс платежи из календаря.`,
  // утечки
  leaksTitle: "Утечки",
  deadTitle: "📦 Мёртвые остатки",
  deadSub: "товар без продаж 30+ дней — деньги лежат на полке",
  noPurchases: "В файле нет закупок — остатки посчитать нельзя.",
  noDeadStock: "Залежавшегося товара нет 👍",
  deadLine: (q: number, d: number) => `${q} шт · без продаж ${d} дн.`,
  weakTitle: "📉 Слабые дни недели",
  weakSub: "недополученная прибыль в месяц против обычного дня",
  weakLine: (day: string, avg: string, med: string, pct: number) => `${day}: в среднем ${avg} против ${med} в обычный день (−${pct}%).`,
  noWeak: "Провалов по дням недели нет.",
  riseTitle: "📈 Рост закупочных цен",
  riseSub: "переплата в месяц: последние 4 недели против предыдущих 4",
  noRise: "Заметного роста цен (больше 4%) нет.",
  overpay: (x: string) => `Переплата: ${x} в месяц`,
  abcTitle: "🅰️ ABC-анализ товаров",
  abcSub: "A — 80% выручки (не допускать дефицита), B — 15%, C — 5% (кандидаты на сокращение закупок).",
  noItems: "В файле нет названий товаров — ABC и маржу посчитать нельзя.",
  marginTitle: "💰 Маржа по товарам",
  marginNeed: "Нужны и продажи, и закупки одного товара.",
  marginNote: "Красным — маржа ниже 15%: проверьте цену или поставщика.",
  // план
  saved: "Реально сэкономлено",
  savedHint: "отмечайте ✓ выполненное",
  roi: "Окупаемость сервиса",
  roiHint: (x: string) => `при подписке ${x}/мес (допущение)`,
  effect: "Эффект",
  perMonth: " / мес",
  deadline: "Срок",
  days: "дн.",
  done: "Выполнено",
  footAi: "Формулировки — ИИ (NVIDIA NIM), все суммы и сроки посчитаны кодом.",
  footTpl: "Формулировки — шаблоны, все суммы и сроки посчитаны кодом.",
  aiBadge: "ИИ",
  tplBadge: "шаблон",
  aiThinking: "ИИ думает…",
  // чат
  typing: "печатает…",
  bot: "бот",
  today: "Сегодня",
  placeholder: "Спросите KaltaAI…",
  send: "Отправить",
  tooLong: "Вопрос слишком длинный — до 300 символов.",
  suggestions: ["Сколько можно забрать сегодня?", "Почему не хватает денег?", "Что сделать на этой неделе?", "Сколько отложить на налог?", "Какой товар лежит без движения?"],
  // ещё
  subTax: "Налоги",
  subCalendar: "Платежи",
  subPromo: "Акции",
  subHealth: "Паспорт",
  subReviews: "Отзывы",
  subData: "Данные",
  dataSource: (s: string, n: number) => `Источник: ${s} · строк: ${n}`,
  uploadOther: "Загрузить другой файл",
  privacyData: "Сырые данные хранятся только в этом браузере. На сервер для ИИ уходят лишь итоговые цифры.",
  // налоги
  envTitle: "✉️ Налоговый конверт",
  setAsideNow: "отложить сейчас",
  taxForPeriod: (d: string) => `Налог за полугодие до ${d}`,
  vatForPeriod: (d: string) => `НДС к уплате до ${d}`,
  daysToDue: "До срока уплаты",
  simpNote: (rate: string, start: string) => `${rate}% от дохода с начала полугодия (${start}).`,
  vatNote: "НДС 16% «внутри» разницы продаж и закупок с начала квартала.",
  estNote: " Часть периода до начала ваших данных оценена по средней выручке.",
  socialLine: (d: string) => `Соцплатежи ИП за себя · до ${d}`,
  inForecast: "Соцплатежи и налог автоматически стоят в прогнозе на 14 дней и учтены в «Свободно сегодня».",
  limitTitle: "Лимит упрощёнки",
  limitText: (x: string) => `600 000 МРП = ${x}`,
  ytdLine: (x: string, pct: string) => `Доход с 1 января ≈ ${x} — ${pct}% лимита`,
  estimate: " (оценка)",
  vatThr: (x: string) => `Порог НДС 10 000 МРП = ${x}: `,
  vatExceeded: "уже превышен в этом году",
  vatDate: (d: string) => `при текущей выручке превысите ≈ ${d}`,
  vatNo: "в этом году не превысите",
  settings: "Настройки",
  mode: "Режим",
  modeTaraz: "Упрощёнка, Тараз 2%",
  modeSimp4: "Упрощёнка 4%",
  modeOur: "ОУР с НДС 16%",
  modeCustom: "Своя ставка",
  customRate: "Своя ставка, %",
  mrp: "МРП, ₸",
  socialMonthly: "Соцплатежи в месяц, ₸",
  isIP: (d: number) => `Я ИП (платить соцплатежи за себя до ${d} числа)`,
  reset2026: "Вернуть значения 2026",
  taxDisclaimer: "⚠️ Расчёт ориентировочный, не налоговая консультация. Ставки 2026: МРП 4 325 ₸, упрощёнка в Таразе 2% (решение Таразского гормаслихата № 33-4), базовая 4%, НДС 16%. Перед уплатой сверьте суммы с бухгалтером или в кабинете налогоплательщика.",
  periodHalf: (h: number, y: number) => `${h}-е полугодие ${y}`,
  periodQuarter: (q: number, y: number) => `${q}-й квартал ${y}`,
  // календарь
  upcomingTitle: "🗓️ Ближайшие 2 недели",
  upcomingSub: "Красным — дни ниже резерва. Неделя с нехваткой — опасная.",
  thisWeek: "Эта неделя",
  nextWeek: "Следующая неделя",
  danger: "⚠️ опасно · ",
  paymentsSum: (x: string) => `платежи ${x}`,
  listTitle: "Регулярные и разовые платежи",
  listSub: "Суммы и даты — ваши. Налоги считает налоговый конверт — сюда их не добавляйте.",
  kRent: "Аренда",
  kSalary: "Зарплата",
  kTax: "Налоги",
  kSupplier: "Поставщик",
  kUtilities: "Коммуналка",
  kOther: "Другое",
  everyMonth: "каждое",
  dayOfMonth: "число",
  addMonthly: "Ежемесячный",
  addOnce: "Разовый",
  newMonthlyName: "Новый ежемесячный платёж",
  newOnceName: "Оплата поставщику",
  del: "Удалить",
  // акции
  promoIntro: "Акции по мёртвым остаткам: скидка зависит от того, сколько товар лежит. Тексты готовы для Instagram и WhatsApp.",
  noDeadPromo: "Залежавшегося товара нет — акция не нужна 👍",
  promoCard: (q: number, d: number, x: string) => `${q} шт · лежит ${d} дн. · заморожено ${x}`,
  days7: "7 дней",
  expected: (x: string, pct: number, price: string) => `Ожидаемая выручка: ${x} (продастся ~${pct}% остатка по ${price})`,
  copy: "Копировать",
  copied: "Скопировано",
  aiPost: "✨ Написать пост с ИИ (RU + KZ)",
  aiWriting: "ИИ пишет пост…",
  aiFail: "ИИ недоступен — используйте шаблон выше",
  promoFoot: "Допущение: при скидке 25% уходит ~70% остатка за неделю, при 40% — весь. Сверьте с опытом своей точки.",
  // паспорт
  healthTitle: "Паспорт финансового здоровья",
  healthPeriod: (f: string, t: string, today: string) => `Период: ${f} — ${t} · сформирован ${today}`,
  demoNotBank: "ДЕМО-ДАННЫЕ — не для банка",
  hStab: "Стабильность выручки",
  hStabNote: (x: number) => `разброс по дням ${x}%`,
  hCash: "Запас денег",
  hCashGap: (d: string) => `нехватка ${d}`,
  hCashDays: (n: number) => `≈ ${n} дн. расходов`,
  hDep: "Независимость от поставщика",
  hDepNote: (s: string, pct: number) => `${s} — ${pct}% закупок`,
  hNoData: "нет данных",
  hMargin: "Маржа",
  hMarginNote: (pct: number) => `валовая ${pct}%`,
  hTurn: "Оборачиваемость товара",
  hTurnNote: (x: string) => `заморожено ${x}`,
  kSales30: "Выручка 30 дн.",
  kProfit30: "Прибыль 30 дн.",
  kCash: "Деньги сейчас",
  healthFoot: "Оценка по 5 понятным критериям, рассчитана автоматически по загруженным данным. Не является кредитным решением.",
  print: "Сохранить в PDF / распечатать",
  printFail: "Печать недоступна в этом браузере — откройте сайт в Chrome или Safari.",
  // отзывы
  revTitle: "💬 Разбор отзывов",
  revIntro: "Вставьте отзывы из 2ГИС, Instagram, WhatsApp — по одному на строку. Мы не парсим сайты: только то, что вставили вы.",
  revPlaceholder: "Каждый отзыв с новой строки…",
  revDemo: "Вставить пример (демо)",
  revDemoNote: "Пример — выдуманные отзывы (демо-данные).",
  revPos: "позитив",
  revNeu: "нейтр.",
  revNeg: "негатив",
  revComplaints: "Повторяющиеся жалобы",
  revNoComplaints: "Явных жалоб не нашли.",
  revNOf: (n: number, m: number) => `${n} из ${m}`,
  revTask: "📋 Задача сотруднику: ",
  revReplyTitle: "Черновик ответа на отзыв",
  revReplyTpl: (r: string) => `Здравствуйте! ${r}. Будем рады видеть вас снова — покажите этот ответ на кассе и получите скидку 10% на следующую покупку.`,
  revAi: "✨ Ответ и задача от ИИ",
  revAiTask: "📋 Задача от ИИ: ",
  // прочее
  errScreen: "Что-то пошло не так на этом экране.",
  errReload: "Обновить экран",
  errRestart: "Начать заново",
  tgTitle: "Брифинг в Telegram",
  tgText: "Каждое утро — свободные деньги, ближайший риск и одно действие в ₸ (демо).",
  tgOpen: "Открыть бота",
};

export type Dict = typeof RU;

const KZ: Dict = {
  tagline: "Тараз бизнесіне арналған ЖИ-қаржы директоры",
  demoBadge: "демо-деректер",
  langToggle: "РУС",
  themeAria: "Тақырыпты ауыстыру",
  deleteData: "Деректерімді өшіру",
  deleteConfirm: "Шынымен өшіру керек пе?",
  yes: "Иә",
  no: "Жоқ",
  heroTitle: "Ақшаны теңгемен тауып беретін қаржы директоры",
  heroText: "Сатылым мен сатып алуды жүктеңіз — бүгін қанша ақша бос екенін, қашан жетпей қалатынын және не істеу керегін көресіз.",
  pick: "Сіздің бизнесіңіз қандай?",
  shop: "Дүкен",
  cafe: "Кафе",
  salon: "Сұлулық салоны",
  auto: "Автосервис",
  demo: "Демода көру",
  demoNote: "9 аптаның жасанды деректері — «демо-деректер» деп белгіленген, бұл нақты бизнес емес.",
  upload: "Өз CSV / Excel / Kaspi файлыңызды жүктеу",
  reading: "Файлды оқып жатырмын…",
  template: "CSV үлгісін жүктеп алу",
  pitchLink: "Қазылар үшін питч режимі →",
  privacy: "Файлдар браузеріңізде өңделіп, тек сонда сақталады. ЖИ тек қорытынды сандарды алады. Деректерді бір батырмамен өшіруге болады.",
  quickStart: "Файлсыз жылдам бастау — 5 сұрақ",
  noscript: "KaltaAI жұмыс істеуі үшін JavaScript қажет — браузер баптауларында қосыңыз.",
  mapTitle: "Бағандарды сәйкестендіріңіз",
  mapRows: (file, n, sheets) => `${file}: ${n} жол${sheets > 1 ? `, ${sheets} парақтан` : ""}. Күні мен сомасы қай бағанда екенін көрсетіңіз; қайтарулар мен комиссиялар түсімнен шегеріледі.`,
  fDate: "Күні *",
  fAmount: "Сомасы *",
  fItem: "Тауар / сипаттама",
  fQty: "Саны",
  fType: "Операция түрі",
  fSupplier: "Жеткізуші",
  fRefund: "Қайтару / возврат",
  fFee: "Комиссия",
  fIncome: "Кіріс («Сома» болмаса)",
  fExpense: "Шығыс («Сома» болмаса)",
  none: "— жоқ —",
  preview: (n, total, s, p, e) => `Танылды: алғашқы ${total} жолдың ${n}-і · сатылым ${s}, сатып алу ${p}, шығыс ${e}`,
  mapHint: "«Түрі» бағаны болмаса: плюс — сатылым, минус — сатып алу. Жалға алу, жалақы және салық сөздер бойынша анықталады.",
  analyze: "Талдау",
  errEmpty: "Файл бос — онда жолдар жоқ.",
  errNotTable: "Бұл кесте емес. CSV немесе Excel (.xlsx, .xls) жүктеңіз.",
  errBroken: "Файл бүлінген немесе бұл Excel емес. Оны .xlsx не .csv ретінде қайта сақтаңыз.",
  errNoDates: "Файлдан күндер мен сомалар табылмады. Бұл сатылым үзіндісі екенін тексеріңіз.",
  errFew: (n, skipped) => `Тек ${n} жол танылды (${skipped} өткізілді). «Күні» мен «Сомасы» бағандарын тексеріңіз.`,
  errUnsure: "Бағандарға сенімді емеспіз — төмендегі сәйкестендіруді тексеріңіз.",
  errRead: "Файлды оқу мүмкін болмады.",
  navHome: "Басты",
  navForecast: "14 күн",
  navLeaks: "Шығын",
  navPlan: "Жоспар",
  navChat: "Брифинг",
  navMore: "Тағы",
  demoBanner1: "Бұл — ",
  demoBanner2: "демо-деректер",
  demoBanner3: ": Тараздағы бизнестің жасанды мысалы, ішінде әдейі қойылған мәселелер бар. Нақты сандарды көру үшін өз файлыңызды жүктеңіз.",
  freeTitle: "Бүгін бос ақша",
  breakdownTitle: "Қалай есептелді",
  bdCash: "Қазір кассада",
  bdInflow: (d) => `+ ${d} дейінгі түсім (болжам)`,
  bdPurch: (d) => `− ${d} дейінгі сатып алу`,
  bdTax: "− салық резерві",
  bdSafety: "− қор: 7 күндік жалға алу, жалақы, коммуналдық",
  bdResult: "= бүгін бос",
  bdHardest: (d) => `Ең қиын күн — ${d}.`,
  foundTitle: "Біз таптық",
  foundSub: "қазір жоғалып не қатып тұрған ақша",
  foundFrozen: "Қатып қалған қалдық",
  foundWeak: "Әлсіз күндер (айына)",
  foundRise: "Сатып алу қымбаттауы (айына)",
  prevented: "Болдырмаған жетіспеушілік",
  preventedHint: "1–2 қадамды орындасаңыз",
  noShortfall: "жетіспеушілік жоқ",
  frozenMoney: "Қатып қалған ақша",
  frozenHint: (n) => `${n} тауар 30+ күн сатылмаған`,
  forecastTitle: "14 күнге ақша",
  details: "Толығырақ →",
  todoTitle: "Не істеу керек",
  allN: (n) => `Барлығы ${n} →`,
  savedLine: (s, x) => `Нақты үнемделді: ${s} · сервистің өтелуі: ×${x}`,
  dataFooter: (from, to, days, src) => `Деректер: ${from} — ${to} (${days} күн), дереккөз: ${src}. Барлық сома деректеріңіз бойынша кодпен есептелді; ЖИ тек кеңесті тұжырымдайды.`,
  cashLabel: "Қазір кассадағы ақша",
  cashCheck: " (нақтылаңыз)",
  okSentence: (x) => `${x} дейін алаңсыз жұмсауға болады: 14 күндік барлық төлем мен резерв жабылған.`,
  reserveSentence: (d, x) => `${d} ақша салық резервіне кетеді: ${x} жетпейді.`,
  reserveToday: (x) => `Бүгіннің өзінде кассадағы ақша резервтен аз: ${x} жетпейді.`,
  cashSentence: (d, x, pay) => `${d} ${pay} үшін ${x} жетпейді — касса минусқа кетеді.`,
  cause: (pay, amt) => `Себебі — ${pay}: ${amt}.`,
  reserveLine: (r, tax, safe) => `Резерв ${r} — жұмсауға болмайтын ақша: салық ${tax} + 7 күндік жалға алу, жалақы мен коммуналдық төлем ${safe}.`,
  reserveLineNoTax: (r) => `Резерв ${r} — 7 күндік жалға алу, жалақы мен коммуналдық төлем: оны жұмсауға болмайды.`,
  extraReserve: (r) => `Салық пен қорға тағы ${r} сақтау керек.`,
  shortShortfall: (d, x) => `${d}: ${x} жетпейді`,
  noShortfallShort: "Жетіспеушілік жоқ",
  legendBase: "негізгі",
  legendPess: "пессимистік",
  legendOpt: "оптимистік",
  legendWas: "өзгеріссіз",
  legendReserve: "резерв",
  scPess: "Пессимистік",
  scBase: "Негізгі",
  scOpt: "Оптимистік",
  scPessHint: "түсім −15%",
  scBaseHint: "соңғы 4 аптадағыдай",
  scOptHint: "түсім +10%",
  in14: (x) => `14 күннен кейін кассада: ${x}`,
  whatIfTitle: "Егер…",
  whatIfSub: "Жүгірткіні жылжытыңыз — болжам мен «Бүгін бос ақша» бірден қайта есептеледі",
  reset: "қалпына келтіру",
  knobDiscount: "Жатып қалған тауарға жеңілдік",
  noteDiscount: (x, pct) => `Бір аптада ≈ ${x} қайтарады (~${pct}% сатылады)`,
  noteDiscount0: "Жеңілдік неғұрлым көп болса, қалдық соғұрлым тез кетеді",
  noDead: "Жатып қалған тауар жоқ",
  knobDelay: (n) => `Кейінге қалдыру: ${n}`,
  knobDelayGeneric: "Ірі төлемді кейінге қалдыру",
  noteDelay: (amt, d) => `${amt}, жоспар бойынша ${d}`,
  noBigPayments: "Бұл кезеңде ірі төлем жоқ",
  daysUnit: "күн",
  knobPrice: "Бағаны көтеру",
  notePrice: "Болжам: баға +10% болса, сатылым саны 5%-ға азаяды",
  freeNow: "Бүгін бос ақша",
  was: (x) => `бұрын ${x}`,
  returns: (x) => `14 күнде айналымға қайтарасыз: ${x}`,
  shortfallLess: (x) => `Жетіспеушілік ${x} азаяды`,
  delayedOut: "⚠️ Кейінге қалдырылған төлем 14 күннен тыс шықты — оған ақша бәрібір керек болады.",
  byDays: "Күндер бойынша",
  method: (r, ratio) => `Сары сызық — резерв ${r}: салық + 7 күндік тұрақты шығыс. Одан төмен — жетіспеушілік. Болжам: соңғы 4 аптадағы апта күндері бойынша орташа түсім; сатып алу түсімнің сол үлесінде (${ratio}%); оған күнтізбедегі төлемдер қосылады.`,
  leaksTitle: "Шығындар",
  deadTitle: "📦 Қозғалыссыз қалдық",
  deadSub: "30+ күн сатылмаған тауар — ақша сөреде жатыр",
  noPurchases: "Файлда сатып алу жоқ — қалдықты есептеу мүмкін емес.",
  noDeadStock: "Жатып қалған тауар жоқ 👍",
  deadLine: (q, d) => `${q} дана · ${d} күн сатылмаған`,
  weakTitle: "📉 Аптаның әлсіз күндері",
  weakSub: "әдеттегі күнмен салыстырғанда айына алынбаған пайда",
  weakLine: (day, avg, med, pct) => `${day}: орта есеппен ${avg}, әдеттегі күні ${med} (−${pct}%).`,
  noWeak: "Апта күндері бойынша құлдырау жоқ.",
  riseTitle: "📈 Сатып алу бағасының өсуі",
  riseSub: "айына артық төлем: соңғы 4 апта алдыңғы 4 аптамен салыстырғанда",
  noRise: "Бағаның айтарлықтай өсуі (4%-дан көп) жоқ.",
  overpay: (x) => `Артық төлем: айына ${x}`,
  abcTitle: "🅰️ Тауарлардың ABC-талдауы",
  abcSub: "A — түсімнің 80%-ы (тапшылыққа жол бермеу), B — 15%, C — 5% (сатып алуды қысқартуға үміткерлер).",
  noItems: "Файлда тауар атаулары жоқ — ABC мен маржаны есептеу мүмкін емес.",
  marginTitle: "💰 Тауарлар бойынша маржа",
  marginNeed: "Бір тауардың сатылымы да, сатып алуы да керек.",
  marginNote: "Қызылмен — маржа 15%-дан төмен: бағаны не жеткізушіні тексеріңіз.",
  saved: "Нақты үнемделді",
  savedHint: "орындалғанын ✓ белгілеңіз",
  roi: "Сервистің өтелуі",
  roiHint: (x) => `жазылым айына ${x} болса (болжам)`,
  effect: "Әсері",
  perMonth: " / ай",
  deadline: "Мерзімі",
  days: "күн",
  done: "Орындалды",
  footAi: "Тұжырымдар — ЖИ (NVIDIA NIM), барлық сома мен мерзім кодпен есептелді.",
  footTpl: "Тұжырымдар — үлгілер, барлық сома мен мерзім кодпен есептелді.",
  aiBadge: "ЖИ",
  tplBadge: "үлгі",
  aiThinking: "ЖИ ойланып жатыр…",
  typing: "жазып жатыр…",
  bot: "бот",
  today: "Бүгін",
  placeholder: "KaltaAI-дан сұраңыз…",
  send: "Жіберу",
  tooLong: "Сұрақ тым ұзын — 300 таңбаға дейін.",
  suggestions: ["Бүгін қанша ақша алуға болады?", "Неге ақша жетпейді?", "Осы аптада не істеу керек?", "Салыққа қанша жинау керек?", "Қай тауар қозғалыссыз жатыр?"],
  subTax: "Салық",
  subCalendar: "Төлемдер",
  subPromo: "Акциялар",
  subHealth: "Паспорт",
  subReviews: "Пікірлер",
  subData: "Деректер",
  dataSource: (s, n) => `Дереккөз: ${s} · жол: ${n}`,
  uploadOther: "Басқа файл жүктеу",
  privacyData: "Бастапқы деректер тек осы браузерде сақталады. ЖИ үшін серверге тек қорытынды сандар жіберіледі.",
  envTitle: "✉️ Салық конверті",
  setAsideNow: "қазір бөліп қою",
  taxForPeriod: (d) => `Жартыжылдық салық, ${d} дейін`,
  vatForPeriod: (d) => `Төленетін ҚҚС, ${d} дейін`,
  daysToDue: "Төлем мерзіміне дейін",
  simpNote: (rate, start) => `Жартыжылдық басынан (${start}) бергі табыстың ${rate}%-ы.`,
  vatNote: "Тоқсан басынан бергі сатылым мен сатып алу айырмасындағы 16% ҚҚС.",
  estNote: " Деректеріңіз басталғанға дейінгі кезең орташа түсіммен бағаланды.",
  socialLine: (d) => `ЖК-ның өзі үшін әлеуметтік төлемдері · ${d} дейін`,
  inForecast: "Әлеуметтік төлемдер мен салық 14 күндік болжамға автоматты түрде қосылған және «Бүгін бос ақшада» ескерілген.",
  limitTitle: "Оңайлатылған режим лимиті",
  limitText: (x) => `600 000 АЕК = ${x}`,
  ytdLine: (x, pct) => `1 қаңтардан бергі табыс ≈ ${x} — лимиттің ${pct}%-ы`,
  estimate: " (бағалау)",
  vatThr: (x) => `ҚҚС шегі 10 000 АЕК = ${x}: `,
  vatExceeded: "биыл асып кетті",
  vatDate: (d) => `қазіргі түсіммен ≈ ${d} асасыз`,
  vatNo: "биыл аспайсыз",
  settings: "Баптаулар",
  mode: "Режим",
  modeTaraz: "Оңайлатылған, Тараз 2%",
  modeSimp4: "Оңайлатылған 4%",
  modeOur: "ЖБТ, ҚҚС 16%",
  modeCustom: "Өз мөлшерлемесі",
  customRate: "Өз мөлшерлемесі, %",
  mrp: "АЕК, ₸",
  socialMonthly: "Айлық әлеуметтік төлем, ₸",
  isIP: (d) => `Мен ЖК-мын (өзім үшін әлеуметтік төлемді айдың ${d}-не дейін төлеймін)`,
  reset2026: "2026 мәндерін қайтару",
  taxDisclaimer: "⚠️ Есеп шамамен жасалған, салық кеңесі емес. 2026 мөлшерлемелері: АЕК 4 325 ₸, Таразда оңайлатылған режим 2% (Тараз қалалық мәслихатының № 33-4 шешімі), базалық 4%, ҚҚС 16%. Төлер алдында сомаларды бухгалтермен немесе салық төлеушінің кабинетінде тексеріңіз.",
  periodHalf: (h, y) => `${y} ж. ${h}-жартыжылдық`,
  periodQuarter: (q, y) => `${y} ж. ${q}-тоқсан`,
  upcomingTitle: "🗓️ Алдағы 2 апта",
  upcomingSub: "Қызылмен — резервтен төмен күндер. Жетіспеушілігі бар апта — қауіпті.",
  thisWeek: "Осы апта",
  nextWeek: "Келесі апта",
  danger: "⚠️ қауіпті · ",
  paymentsSum: (x) => `төлемдер ${x}`,
  listTitle: "Тұрақты және бір реттік төлемдер",
  listSub: "Сомалар мен күндер — сіздікі. Салықты салық конверті есептейді — оларды мұнда қоспаңыз.",
  kRent: "Жалға алу",
  kSalary: "Жалақы",
  kTax: "Салық",
  kSupplier: "Жеткізуші",
  kUtilities: "Коммуналдық",
  kOther: "Басқа",
  everyMonth: "әр айдың",
  dayOfMonth: "-күні",
  addMonthly: "Ай сайынғы",
  addOnce: "Бір реттік",
  newMonthlyName: "Жаңа ай сайынғы төлем",
  newOnceName: "Жеткізушіге төлем",
  del: "Өшіру",
  promoIntro: "Қозғалыссыз қалдыққа акциялар: жеңілдік тауардың қанша жатқанына байланысты. Мәтіндер Instagram мен WhatsApp-қа дайын.",
  noDeadPromo: "Жатып қалған тауар жоқ — акция керек емес 👍",
  promoCard: (q, d, x) => `${q} дана · ${d} күн жатыр · ${x} қатып тұр`,
  days7: "7 күн",
  expected: (x, pct, price) => `Күтілетін түсім: ${x} (қалдықтың ~${pct}%-ы ${price} бағамен сатылады)`,
  copy: "Көшіру",
  copied: "Көшірілді",
  aiPost: "✨ ЖИ-мен пост жазу (RU + KZ)",
  aiWriting: "ЖИ пост жазып жатыр…",
  aiFail: "ЖИ қолжетімсіз — жоғарыдағы үлгіні пайдаланыңыз",
  promoFoot: "Болжам: 25% жеңілдікпен қалдықтың ~70%-ы бір аптада кетеді, 40%-бен — бәрі. Өз тәжірибеңізбен салыстырыңыз.",
  healthTitle: "Қаржылық денсаулық паспорты",
  healthPeriod: (f, t, today) => `Кезең: ${f} — ${t} · ${today} жасалды`,
  demoNotBank: "ДЕМО-ДЕРЕКТЕР — банк үшін емес",
  hStab: "Түсімнің тұрақтылығы",
  hStabNote: (x) => `күндер бойынша ауытқу ${x}%`,
  hCash: "Ақша қоры",
  hCashGap: (d) => `${d} жетіспеушілік`,
  hCashDays: (n) => `≈ ${n} күндік шығын`,
  hDep: "Жеткізушіге тәуелсіздік",
  hDepNote: (s, pct) => `${s} — сатып алудың ${pct}%-ы`,
  hNoData: "дерек жоқ",
  hMargin: "Маржа",
  hMarginNote: (pct) => `жалпы ${pct}%`,
  hTurn: "Тауар айналымы",
  hTurnNote: (x) => `${x} қатып тұр`,
  kSales30: "30 күндік түсім",
  kProfit30: "30 күндік пайда",
  kCash: "Қазіргі ақша",
  healthFoot: "Бағалау 5 түсінікті өлшем бойынша жүктелген деректерден автоматты есептелді. Несие беру туралы шешім емес.",
  print: "PDF-ке сақтау / басып шығару",
  printFail: "Бұл браузерде басып шығару қолжетімсіз — сайтты Chrome немесе Safari-де ашыңыз.",
  revTitle: "💬 Пікірлерді талдау",
  revIntro: "2ГИС, Instagram, WhatsApp пікірлерін қойыңыз — әр жолға біреуден. Біз сайттарды талдамаймыз: тек өзіңіз қойғанын ғана.",
  revPlaceholder: "Әр пікір жаңа жолдан…",
  revDemo: "Мысал қою (демо)",
  revDemoNote: "Мысал — ойдан шығарылған пікірлер (демо-деректер).",
  revPos: "оң",
  revNeu: "бейтарап",
  revNeg: "теріс",
  revComplaints: "Қайталанатын шағымдар",
  revNoComplaints: "Айқын шағым табылмады.",
  revNOf: (n, m) => `${m}-нің ${n}-і`,
  revTask: "📋 Қызметкерге тапсырма: ",
  revReplyTitle: "Пікірге жауап жобасы",
  revReplyTpl: (r) => `Сәлеметсіз бе! ${r}. Сізді қайта күтеміз — осы жауапты кассада көрсетіп, келесі сатып алуға 10% жеңілдік алыңыз.`,
  revAi: "✨ ЖИ-ден жауап пен тапсырма",
  revAiTask: "📋 ЖИ тапсырмасы: ",
  errScreen: "Бұл экранда қате шықты.",
  errReload: "Экранды жаңарту",
  errRestart: "Қайта бастау",
  tgTitle: "Telegram-дағы брифинг",
  tgText: "Әр таң сайын — бос ақша, ең жақын тәуекел және теңгемен бір әрекет (демо).",
  tgOpen: "Ботты ашу",
};

export const T: Record<Lang, Dict> = { ru: RU, kz: KZ };

/* ------------------------------------------------------------------ */
/* История денег: одна формулировка для главной, прогноза, чата, бота   */
/* ------------------------------------------------------------------ */

export function storyText(s: Story, a: Pick<Analysis, "reserve" | "taxReserve" | "safety">, lang: Lang) {
  const t = T[lang];
  const pay = s.payment ? q(dn(s.payment.name, lang)) : "";
  let sentence: string;
  let cause = "";
  if (s.kind === "ok") sentence = t.okSentence(money(s.free));
  else if (s.kind === "cash" && s.cashDate) {
    sentence = cap(t.cashSentence(onDate(s.cashDate, lang), money(s.cashShort), pay || "—"));
    cause = t.extraReserve(money(a.reserve));
  } else if (s.dayIndex === -1) sentence = t.reserveToday(money(s.shortfall));
  else {
    sentence = cap(t.reserveSentence(onDate(s.date!, lang), money(s.shortfall)));
    if (s.payment) cause = t.cause(pay, money(s.payment.amount));
  }
  const reserveLine = a.taxReserve > 0 ? t.reserveLine(money(a.reserve), money(a.taxReserve), money(a.safety)) : t.reserveLineNoTax(money(a.reserve));
  return { sentence, cause, reserveLine };
}

/** Короткая форма для сценариев, бота и подписей графика */
export function storyShort(s: Story, lang: Lang) {
  const t = T[lang];
  if (s.kind === "ok" || !s.date) return t.noShortfallShort;
  return t.shortShortfall(human(s.date, lang), money(s.shortfall));
}

/* ------------------------------------------------------------------ */
/* Действия                                                             */
/* ------------------------------------------------------------------ */

export function actionText(a: Action, lang: Lang): { title: string; how: string } {
  const f = a.facts;
  const items = (s: unknown) =>
    String(s)
      .split(", ")
      .map((x) => dn(x, lang))
      .join(", ");
  if (lang === "kz") {
    switch (a.id) {
      case "dead":
        return { title: `Жатып қалған тауарды ${f.discount} жеңілдікпен сату`, how: `${items(f.items)} — ${f.frozen} қатып тұр. Кассаның жанына қойып, тұрақты клиенттерге WhatsApp арқылы жіберіңіз.` };
      case "delay":
        return { title: "Төлемді 7 күнге кейінге қалдыру туралы келісу", how: `${dn(String(f.payment), "kz")} (${f.amount}, ${human(String(f.due), "kz")}). Жеткізушіге бүгін қоңырау шалыңыз.` };
      case "supplier":
        return { title: `${dn(String(f.supplier), "kz")}: бағаны талқылау немесе балама табу`, how: `Сатып алу бағасы ${f.pct} өсті: ${items(f.items)}. Ескі бағаны немесе көлемге жеңілдік сұраңыз.` };
      case "weak":
        return { title: `${cap(WD_KZ_FULL[Number(f.wd)])} күні акция жасау`, how: `Бұл күні түсім әдеттегіден ${f.drop} төмен. «2+1» немесе түске дейін жеңілдік беріңіз.` };
      case "citems":
        return { title: "C тобындағы тауарды екі апта сатып алмау", how: `${items(f.items)} — түсімнің ~5%-ын береді, бірақ ақшаны байлап тұр.` };
    }
  }
  switch (a.id) {
    case "dead":
      return { title: `Распродать залежавшийся товар со скидкой ${f.discount}`, how: `${f.items} — заморожено ${f.frozen}. Выставьте у кассы и разошлите постоянным клиентам в WhatsApp.` };
    case "delay":
      return { title: "Договориться о переносе платежа на 7 дней", how: `${f.payment} (${f.amount}, ${human(String(f.due))}). Позвоните поставщику сегодня, пока есть время.` };
    case "supplier":
      return { title: `${f.supplier}: обсудить цену или найти замену`, how: `Закупочная цена выросла на ${f.pct}: ${f.items}. Попросите старую цену или скидку за объём.` };
    case "weak":
      return { title: `Сделать акцию ${Number(f.wd) === 2 ? "во" : "в"} ${WD_RU_ACC[Number(f.wd)]}`, how: `В этот день выручка на ${f.drop} ниже обычной. «2+1» или скидка до 12:00.` };
    case "citems":
      return { title: "Две недели не докупать товары группы C", how: `${f.items} — дают ~5% выручки, но держат деньги.` };
  }
}

/* ------------------------------------------------------------------ */
/* Утренний брифинг                                                     */
/* ------------------------------------------------------------------ */

export function briefing(a: Analysis, ds: Dataset, lang: Lang, aiActions?: Record<string, string> | null): string[] {
  const st = storyText(a.story, a, lang);
  const msgs: string[] = [];
  const top = a.actions.slice(0, 3);
  if (lang === "kz") {
    msgs.push(`Қайырлы таң! ☀️ KaltaAI брифингі, ${longDate(a.today, "kz")}${ds.isDemo ? " (демо-деректер)" : ""}.`);
    msgs.push(`Бүгін бос ақша: ${money(a.story.free)}.`);
    msgs.push(st.sentence);
    if (st.cause) msgs.push(st.cause);
    msgs.push(st.reserveLine);
    if (a.frozenTotal > 0) msgs.push(`📦 Қозғалыссыз тауарда ${money(a.frozenTotal)} қатып тұр (${a.dead.length} тауар).`);
    if (a.weak) msgs.push(`📉 ${cap(weekdayFull(a.weak.wd, "kz"))} — әлсіз күн: түсім ${Math.round(a.weak.dropPct * 100)}% төмен.`);
    if (a.rises[0]) msgs.push(`📈 ${dn(a.rises[0].supplier, "kz")} бағаны ${Math.round(a.rises[0].pct * 100)}% көтерді: айына ${money(a.rises[0].overpayMonth)} артық төлем.`);
    if (top.length) msgs.push("Бүгін не істеу керек:");
    top.forEach((x, i) => msgs.push(`${i + 1}) ${actionText(x, "kz").title} → +${money(x.effect)}`));
    if (a.prevented > 0) msgs.push(`1–2 қадам ${money(a.prevented)} жетіспеушілікті жабады. 💪`);
    return msgs;
  }
  msgs.push(`Доброе утро! ☀️ Брифинг KaltaAI на ${longDate(a.today)}${ds.isDemo ? " (демо-данные)" : ""}.`);
  msgs.push(`Свободно сегодня: ${money(a.story.free)}.`);
  msgs.push(st.sentence);
  if (st.cause) msgs.push(st.cause);
  msgs.push(st.reserveLine);
  if (a.frozenTotal > 0) msgs.push(`📦 В товаре без движения заморожено ${money(a.frozenTotal)} (${a.dead.length} поз.).`);
  if (a.weak) msgs.push(`📉 ${cap(weekdayFull(a.weak.wd))} — слабый день: выручка на ${Math.round(a.weak.dropPct * 100)}% ниже обычной.`);
  if (a.rises[0]) msgs.push(`📈 ${a.rises[0].supplier} поднял цены на ${Math.round(a.rises[0].pct * 100)}%: переплата ${money(a.rises[0].overpayMonth)} в месяц.`);
  if (top.length) msgs.push("Что сделать сегодня:");
  top.forEach((x, i) => msgs.push(`${i + 1}) ${aiActions?.[x.id] ?? actionText(x, "ru").title} → +${money(x.effect)}`));
  if (a.prevented > 0) msgs.push(`Шаги 1–2 закрывают нехватку ${money(a.prevented)}. 💪`);
  return msgs;
}

/* ------------------------------------------------------------------ */
/* Факты для LLM — только готовые числа строками                        */
/* ------------------------------------------------------------------ */

export function factsForLLM(a: Analysis, ds: Dataset, lang: Lang = "ru") {
  const st = storyText(a.story, a, lang);
  return {
    business: ds.isDemo ? bizName(ds.biz, lang) : ds.source,
    demo: ds.isDemo,
    today: longDate(a.today, lang),
    cashNow: money(a.cash),
    freeToday: money(a.story.free),
    story: st.sentence,
    cause: st.cause,
    reserve: { total: money(a.reserve), tax: money(a.taxReserve), safety7days: money(a.safety) },
    paymentsUntilHardestDay: a.story.breakdown.payments.map((p) => `${dn(p.name, lang)} ${money(p.amount)} (${human(p.due, lang)})`),
    salesNext: money(a.story.breakdown.inflow),
    tax: {
      setAsideNow: money(a.tax.reserve),
      dueDate: longDate(a.tax.dueDate, lang),
      amountAtDue: money(a.tax.reserveAtDue),
      social: a.tax.socialNext ? `${money(a.tax.socialAmount)} до ${human(a.tax.socialNext, lang)}` : "нет",
    },
    month: { sales: kmoney(a.sales30, lang), profit: kmoney(a.profit30, lang) },
    frozen: money(a.frozenTotal),
    deadItems: a.dead.slice(0, 4).map((d) => `${dn(d.name, lang)} — ${money(d.frozen)}, ${d.daysNoSale} дн. без продаж`),
    weakDay: a.weak ? { day: weekdayFull(a.weak.wd, lang), drop: Math.round(a.weak.dropPct * 100) + "%" } : null,
    priceRise: a.rises[0] ? { supplier: dn(a.rises[0].supplier, lang), pct: Math.round(a.rises[0].pct * 100) + "%", overpayMonth: money(a.rises[0].overpayMonth) } : null,
    prevented: money(a.prevented),
    actions: a.actions.map((x) => ({ id: x.id, effect: money(x.effect), deadlineDays: x.deadlineDays, template: actionText(x, lang).title })),
  };
}
