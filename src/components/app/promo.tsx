"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money, sellThrough, type ItemStat } from "@/lib/analytics";
import { addDays, fmtDate, human, parseDate } from "@/lib/dates";

function discountFor(d: ItemStat) {
  return d.daysNoSale >= 60 ? 0.4 : d.daysNoSale >= 45 ? 0.3 : 0.25;
}

export function Promo() {
  const { a, ds } = useApp();
  if (!a || !ds) return null;
  if (!a.dead.length) return <p className="text-sm text-muted-foreground">Залежавшегося товара нет — акция не нужна 👍</p>;
  const until = fmtDate(addDays(parseDate(ds.today), 7));
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Акции по мёртвым остаткам: скидка зависит от того, сколько товар лежит. Тексты готовы для Instagram и WhatsApp.</p>
      {a.dead.slice(0, 3).map((d) => {
        const disc = discountFor(d);
        const price = Math.round((d.retail * (1 - disc)) / 10) * 10;
        const st = sellThrough(disc);
        const rev = d.stockQty * price * st;
        const ru = `🔥 Только до ${human(until)}! ${d.name} со скидкой ${Math.round(disc * 100)}% — всего ${money(price)} вместо ${money(d.retail)}. Осталось ${d.stockQty} шт. Ждём вас в Таразе! Пишите в WhatsApp — отложим для вас.`;
        const kz = `🔥 ${human(until, "kz")} дейін ғана! ${d.name} — ${Math.round(disc * 100)}% жеңілдікпен, бар болғаны ${money(price)} (${money(d.retail)} орнына). Небәрі ${d.stockQty} дана қалды. Таразда күтеміз! WhatsApp-қа жазыңыз — сізге сақтап қоямыз.`;
        return (
          <Card key={d.name}>
            <CardContent className="space-y-3">
              <div className="flex justify-between gap-2">
                <div>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d.stockQty} шт · лежит {d.daysNoSale} дн. · заморожено {money(d.frozen)}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-red-600">−{Math.round(disc * 100)}%</div>
                  <div className="text-xs text-muted-foreground">7 дней</div>
                </div>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-2 text-sm">
                Ожидаемая выручка: <b>{money(rev)}</b> (продастся ~{Math.round(st * 100)}% остатка по {money(price)})
              </div>
              <Post lang="RU" text={ru} />
              <Post lang="KZ" text={kz} />
            </CardContent>
          </Card>
        );
      })}
      <p className="text-xs text-muted-foreground">Допущение: при скидке 25% уходит ~70% остатка за неделю, при 40% — весь. Сверьте с опытом своей точки.</p>
    </div>
  );
}

function Post({ lang, text }: { lang: string; text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="rounded-lg border p-2 text-sm space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-muted-foreground">{lang}</span>
        <div className="flex gap-2">
          <a className="text-xs text-emerald-700 dark:text-emerald-400 underline" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <button
            className="text-xs inline-flex items-center gap-1"
            onClick={() => {
              navigator.clipboard?.writeText(text);
              setOk(true);
              setTimeout(() => setOk(false), 1500);
            }}
          >
            {ok ? <Check className="size-3" /> : <Copy className="size-3" />} {ok ? "Скопировано" : "Копировать"}
          </button>
        </div>
      </div>
      <p className="whitespace-pre-line">{text}</p>
    </div>
  );
}
