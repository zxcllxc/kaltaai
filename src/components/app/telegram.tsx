"use client";

import { Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { TELEGRAM_BOT } from "@/lib/flags";

/** Карточка «Брифинг в Telegram»: на телефоне — кнопка, на большом экране — ещё и QR. */
export function TelegramCard() {
  const { t, ds } = useApp();
  const link = `https://t.me/${TELEGRAM_BOT}?start=${ds?.isDemo ? ds.biz : "pitch"}`;
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className="flex-1 space-y-2">
          <h2 className="font-semibold">{t.tgTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.tgText}</p>
          <a href={link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-[#1e6fa8] px-3 py-2 text-sm font-medium text-white">
            <Send className="size-4" aria-hidden /> {t.tgOpen} @{TELEGRAM_BOT}
          </a>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/qr-telegram.svg" alt={`QR: t.me/${TELEGRAM_BOT}`} width={112} height={112} className="hidden sm:block size-28 rounded-lg bg-white p-1.5" />
      </CardContent>
    </Card>
  );
}
