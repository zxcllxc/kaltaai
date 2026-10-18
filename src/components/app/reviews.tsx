"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { AiBadge, callAI } from "./ai";

/** Разбор отзывов из 2ГИС / Instagram: вставка текста → тональность, повторяющиеся жалобы, черновик ответа, задача сотруднику.
 *  Работает по словарю (RU + KZ), без парсинга сайтов; ИИ — по кнопке, получает только сводку жалоб. */

const TOPICS = [
  {
    id: "service",
    re: /груб|хам|невежлив|игнор|не поздорова|нагруб|орал|кричал|дөрекі|сыпайы емес|ұрсты|айқайла/i,
    ru: { name: "Грубое обслуживание", task: "Провести 10-минутную планёрку о вежливости, ввести приветствие каждого клиента", reply: "Нам очень жаль, что сотрудник был невежлив. Мы провели беседу с командой" },
    kz: { name: "Дөрекі қызмет", task: "Сыпайылық туралы 10 минуттық жиналыс өткізу, әр клиентпен амандасуды енгізу", reply: "Қызметкердің сыпайы болмағанына өкінеміз. Ұжыммен әңгіме жүргіздік" },
  },
  {
    id: "speed",
    re: /долго|очеред|ждал|ждать|медлен|кезек|ұзақ күт|көп күт|баяу/i,
    ru: { name: "Долго / очереди", task: "В часы пик (17:00–19:00) поставить второго человека на кассу", reply: "Понимаем, ждать неприятно. В часы пик мы добавили второго сотрудника на кассу" },
    kz: { name: "Ұзақ күту / кезек", task: "Қарбалас уақытта (17:00–19:00) кассаға екінші адамды қою", reply: "Күту жағымсыз екенін түсінеміз. Қарбалас уақытта кассаға екінші қызметкер қойдық" },
  },
  {
    id: "quality",
    re: /просроч|несвеж|испорч|невкусн|холодн|сыр(ой|ое)|кисл|тухл|плесен|сапасыз|бұзыл|мерзімі өткен|дәмсіз|ашыған|суық/i,
    ru: { name: "Свежесть / качество", task: "Ежедневная проверка сроков годности утром, журнал на кассе", reply: "Спасибо, что сообщили о качестве. Мы проверили партию и ввели ежедневный контроль сроков" },
    kz: { name: "Жаңалығы / сапасы", task: "Күн сайын таңертең жарамдылық мерзімін тексеру, кассада журнал жүргізу", reply: "Сапа туралы хабарлағаныңызға рақмет. Партияны тексеріп, мерзімдерді күнделікті бақылауды енгіздік" },
  },
  {
    id: "price",
    re: /дорог|цен[аы] (кус|выс)|завыш|қымбат|баға жоғары/i,
    ru: { name: "Дорого", task: "Сравнить цены 10 ходовых товаров с соседями, вывесить «цену недели»", reply: "Спасибо за отзыв о ценах. Каждую неделю у нас есть товары по специальной цене" },
    kz: { name: "Қымбат", task: "10 жиі сатылатын тауардың бағасын көршілермен салыстырып, «апта бағасын» ілу", reply: "Баға туралы пікіріңізге рақмет. Әр аптада арнайы бағамен тауарлар бар" },
  },
  {
    id: "clean",
    re: /грязн|муха|мух|запах|воня|грязь|\bлас\b|ластық|шыбын|иіс/i,
    ru: { name: "Чистота", task: "График уборки каждые 2 часа с подписью сотрудника", reply: "Приносим извинения. Мы усилили уборку и ввели график с контролем" },
    kz: { name: "Тазалық", task: "Әр 2 сағат сайын қызметкердің қолымен жинау кестесі", reply: "Кешірім сұраймыз. Жинауды күшейтіп, бақылау кестесін енгіздік" },
  },
  {
    id: "pay",
    re: /kaspi|каспи|терминал|сдач|qr|карт(а|ой) не|төлем өтпе/i,
    ru: { name: "Оплата / Kaspi", task: "Проверить терминал и Kaspi QR, держать размен на кассе", reply: "Спасибо, что сообщили. Мы проверили терминал и Kaspi QR — оплата работает" },
    kz: { name: "Төлем / Kaspi", task: "Терминал мен Kaspi QR-ды тексеру, кассада ұсақ ақша ұстау", reply: "Хабарлағаныңызға рақмет. Терминал мен Kaspi QR-ды тексердік — төлем жұмыс істейді" },
  },
  {
    id: "stock",
    re: /нет в наличии|закончил|не было|нет товара|ассортимент|болмады|таусыл|жоқ болды/i,
    ru: { name: "Нет товара", task: "Проверять остатки товаров группы A каждый вечер, заказывать заранее", reply: "Спасибо! Мы пересмотрели заказ популярных товаров, чтобы они всегда были в наличии" },
    kz: { name: "Тауар жоқ", task: "A тобындағы тауар қалдығын әр кеш тексеріп, алдын ала тапсырыс беру", reply: "Рақмет! Танымал тауарлар әрдайым болуы үшін тапсырысты қайта қарадық" },
  },
];
const POS = /спасиб|отлично|вкусн|рекоменд|супер|лучш|вежлив|быстро|рахмет|рақмет|керемет|нравит|класс|молодц|чисто|приятн|свеж(ий|ие|ая)|жақсы|дәмді|тамаша|ұнады|сыпайы|таза|жылдам/i;
const NEG = /плохо|ужас|кошмар|не советую|разочар|никогда|отврат|жаль|недовол|не понрав|жаман|нашар|ұнамады|көңілім толмады/i;

const DEMO = {
  ru: `Хлеб всегда свежий, продавщица вежливая. Рахмет!
Очень долго стояла в очереди вечером, работала одна касса.
Купила кефир — оказался просроченный. Разочарована.
Kaspi QR не работал, пришлось бежать к банкомату.
Нормальный магазин у дома, но вечером очередь.
Продавец нагрубил, когда попросила пакет. Не советую.
Всё отлично, рекомендую, цены нормальные.
Сметана несвежая, кислая. Второй раз уже.`,
  kz: `Наны әрқашан жаңа, сатушы сыпайы. Рақмет!
Кешке кезек өте ұзақ болды, бір ғана касса істеді.
Кефир алдым — мерзімі өткен екен. Көңілім толмады.
Kaspi QR жұмыс істемеді, банкоматқа жүгіруге тура келді.
Үйдің жанындағы қалыпты дүкен, бірақ кешке кезек.
Сатушы пакет сұрағанымда дөрекі сөйледі.
Бәрі тамаша, ұсынамын, бағасы қалыпты.
Қаймақ ашыған, сапасыз. Екінші рет.`,
};

export function Reviews() {
  const { t, lang } = useApp();
  const [text, setText] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const [aiRes, setAiRes] = useState<{ reply: string; task: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const list = text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .slice(0, 200);
  const scored = list.map((r) => {
    const pos = (r.match(new RegExp(POS, "gi")) ?? []).length;
    const neg = (r.match(new RegExp(NEG, "gi")) ?? []).length + TOPICS.filter((x) => x.re.test(r)).length;
    return { r, s: pos - neg };
  });
  const topics = TOPICS.map((x) => ({ ...x, n: list.filter((r) => x.re.test(r)).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const pos = scored.filter((x) => x.s > 0).length;
  const neg = scored.filter((x) => x.s < 0).length;
  const top = topics[0];
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-2">
          <h2 className="font-semibold">{t.revTitle}</h2>
          <p className="text-xs text-muted-foreground">{t.revIntro}</p>
          <Textarea rows={6} value={text} maxLength={20000} aria-label={t.revTitle} onChange={(e) => (setText(e.target.value), setIsDemo(false), setAiRes(null))} placeholder={t.revPlaceholder} />
          <Button variant="outline" size="sm" onClick={() => (setText(DEMO[lang]), setIsDemo(true), setAiRes(null))}>
            {t.revDemo}
          </Button>
          {isDemo && <div className="text-[11px] text-amber-800 dark:text-amber-300">{t.revDemoNote}</div>}
        </CardContent>
      </Card>
      {list.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{pos}</div>
              {t.revPos}
            </div>
            <div className="rounded-lg bg-muted p-2">
              <div className="text-xl font-bold">{list.length - pos - neg}</div>
              {t.revNeu}
            </div>
            <div className="rounded-lg bg-red-500/10 p-2">
              <div className="text-xl font-bold text-red-700 dark:text-red-400">{neg}</div>
              {t.revNeg}
            </div>
          </div>
          <Card>
            <CardContent className="space-y-2">
              <h2 className="font-semibold">{t.revComplaints}</h2>
              {!topics.length && <p className="text-sm text-muted-foreground">{t.revNoComplaints}</p>}
              {topics.map((x) => (
                <div key={x.id} className="border-t pt-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <b>{x[lang].name}</b>
                    <span className="text-muted-foreground shrink-0">{t.revNOf(x.n, list.length)}</span>
                  </div>
                  <div className="text-xs">
                    {t.revTask}
                    {x[lang].task}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          {top && (
            <Card>
              <CardContent className="space-y-1">
                <h2 className="font-semibold flex items-center gap-2">
                  {t.revReplyTitle} <AiBadge ai={!!aiRes} loading={aiLoading} />
                </h2>
                <p className="text-sm rounded-lg bg-muted p-2">{aiRes ? aiRes.reply : t.revReplyTpl(top[lang].reply)}</p>
                {aiRes?.task && (
                  <p className="text-xs">
                    {t.revAiTask}
                    {aiRes.task}
                  </p>
                )}
                {!aiRes && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={aiLoading}
                    onClick={async () => {
                      setAiLoading(true);
                      const r = await callAI<{ reply: string; task: string }>(
                        "reviews",
                        { total: list.length, positive: pos, negative: neg, complaints: topics.map((x) => ({ topic: x[lang].name, count: x.n })), templateReply: top[lang].reply },
                        undefined,
                        lang,
                      );
                      setAiRes(r?.reply ? { reply: r.reply, task: r.task ?? "" } : null);
                      setAiLoading(false);
                    }}
                  >
                    {t.revAi}
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
