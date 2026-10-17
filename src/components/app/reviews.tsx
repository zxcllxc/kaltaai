"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

/** Разбор отзывов из 2ГИС / Instagram: вставка текста → тональность, повторяющиеся жалобы, черновик ответа, задача сотруднику.
 *  Работает по словарю (без LLM и без парсинга сайтов). */

const TOPICS = [
  { id: "service", name: "Грубое обслуживание", re: /груб|хам|невежлив|игнор|не поздорова|нагруб|орал|кричал|дөрекі/i, task: "Провести 10-минутную планёрку о вежливости, ввести приветствие каждого клиента", reply: "Нам очень жаль, что сотрудник был невежлив. Мы провели беседу с командой" },
  { id: "speed", name: "Долго / очереди", re: /долго|очеред|ждал|ждать|медлен|кезек/i, task: "В часы пик (17:00–19:00) поставить второго человека на кассу", reply: "Понимаем, ждать неприятно. В часы пик мы добавили второго сотрудника на кассу" },
  { id: "quality", name: "Свежесть / качество", re: /просроч|несвеж|испорч|невкусн|холодн|сыр(ой|ое)|кисл|тухл|плесен|сапасыз/i, task: "Ежедневная проверка сроков годности утром, журнал на кассе", reply: "Спасибо, что сообщили о качестве. Мы проверили партию и ввели ежедневный контроль сроков" },
  { id: "price", name: "Дорого", re: /дорог|цен[аы] (кус|выс)|завыш|қымбат/i, task: "Сравнить цены 10 ходовых товаров с соседями, вывесить «цену недели»", reply: "Спасибо за отзыв о ценах. Каждую неделю у нас есть товары по специальной цене" },
  { id: "clean", name: "Чистота", re: /грязн|муха|мух|запах|воня|грязь|лас/i, task: "График уборки каждые 2 часа с подписью сотрудника", reply: "Приносим извинения. Мы усилили уборку и ввели график с контролем" },
  { id: "pay", name: "Оплата / Kaspi", re: /kaspi|каспи|терминал|сдач|qr|карт(а|ой) не/i, task: "Проверить терминал и Kaspi QR, держать размен на кассе", reply: "Спасибо, что сообщили. Мы проверили терминал и Kaspi QR — оплата работает" },
  { id: "stock", name: "Нет товара", re: /нет в наличии|закончил|не было|нет товара|ассортимент|жоқ/i, task: "Проверить остатки товаров группы A каждый вечер, заказывать заранее", reply: "Спасибо! Мы пересмотрели заказ популярных товаров, чтобы они всегда были в наличии" },
];
const POS = /спасиб|отлично|вкусн|рекоменд|супер|лучш|вежлив|быстро|рахмет|керемет|нравит|класс|молодц|чисто|приятн|свеж(ий|ие|ая)/i;
const NEG = /плохо|ужас|кошмар|не советую|разочар|никогда|отврат|жаль|недовол|не понрав|жаман/i;

const DEMO = `Хлеб всегда свежий, продавщица вежливая. Рахмет!
Очень долго стояла в очереди вечером, работала одна касса.
Купила кефир — оказался просроченный. Разочарована.
Kaspi QR не работал, пришлось бежать к банкомату.
Нормальный магазин у дома, но вечером очередь.
Продавец нагрубил, когда попросила пакет. Не советую.
Всё отлично, рекомендую, цены нормальные.
Сметана несвежая, кислая. Второй раз уже.`;

export function Reviews() {
  const [text, setText] = useState("");
  const [isDemo, setIsDemo] = useState(false);
  const list = text.split(/\n+/).map((s) => s.trim()).filter((s) => s.length > 3);
  const scored = list.map((r) => {
    const pos = (r.match(new RegExp(POS, "gi")) ?? []).length;
    const neg = (r.match(new RegExp(NEG, "gi")) ?? []).length + TOPICS.filter((t) => t.re.test(r)).length;
    return { r, s: pos - neg };
  });
  const topics = TOPICS.map((t) => ({ ...t, n: list.filter((r) => t.re.test(r)).length })).filter((t) => t.n > 0).sort((a, b) => b.n - a.n);
  const pos = scored.filter((x) => x.s > 0).length;
  const neg = scored.filter((x) => x.s < 0).length;
  const top = topics[0];
  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="space-y-2">
          <div className="font-semibold">💬 Разбор отзывов</div>
          <p className="text-xs text-muted-foreground">Вставьте отзывы из 2ГИС, Instagram, WhatsApp — по одному на строку. Мы не парсим сайты: только то, что вставили вы.</p>
          <Textarea rows={6} value={text} onChange={(e) => (setText(e.target.value), setIsDemo(false))} placeholder="Каждый отзыв с новой строки…" />
          <Button variant="outline" size="sm" onClick={() => (setText(DEMO), setIsDemo(true))}>
            Вставить пример (демо)
          </Button>
          {isDemo && <div className="text-[11px] text-amber-700 dark:text-amber-300">Пример — выдуманные отзывы (демо-данные).</div>}
        </CardContent>
      </Card>
      {list.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <div className="text-xl font-bold text-emerald-600">{pos}</div>позитив
            </div>
            <div className="rounded-lg bg-muted p-2">
              <div className="text-xl font-bold">{list.length - pos - neg}</div>нейтр.
            </div>
            <div className="rounded-lg bg-red-500/10 p-2">
              <div className="text-xl font-bold text-red-600">{neg}</div>негатив
            </div>
          </div>
          <Card>
            <CardContent className="space-y-2">
              <div className="font-semibold">Повторяющиеся жалобы</div>
              {!topics.length && <p className="text-sm text-muted-foreground">Явных жалоб не нашли.</p>}
              {topics.map((t) => (
                <div key={t.id} className="border-t pt-2 text-sm">
                  <div className="flex justify-between">
                    <b>{t.name}</b>
                    <span className="text-muted-foreground">
                      {t.n} из {list.length}
                    </span>
                  </div>
                  <div className="text-xs">📋 Задача сотруднику: {t.task}</div>
                </div>
              ))}
            </CardContent>
          </Card>
          {top && (
            <Card>
              <CardContent className="space-y-1">
                <div className="font-semibold">Черновик ответа на отзыв</div>
                <p className="text-sm rounded-lg bg-muted p-2">Здравствуйте! {top.reply}. Будем рады видеть вас снова — покажите этот ответ на кассе и получите скидку 10% на следующую покупку.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
