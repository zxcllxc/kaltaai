"use client";

import { useState } from "react";
import { Trash2, Upload, Calendar, Megaphone, HeartPulse, Database, MessageSquareText, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { PaymentCalendar } from "./calendar";
import { Promo } from "./promo";
import { Health } from "./health";
import { Reviews } from "./reviews";
import { TaxScreen } from "./tax";
import { cn } from "@/lib/utils";

type Sub = "tax" | "calendar" | "promo" | "health" | "reviews" | "data";
let initialSub: Sub = "tax";
export function openMoreSub(s: Sub) {
  initialSub = s;
}

export function More() {
  const { ds, t, clear } = useApp();
  const [sub, setSub] = useState<Sub>(initialSub);
  if (!ds) return null;
  const subs: { id: Sub; label: string; icon: React.ElementType }[] = [
    { id: "tax", label: "Налоги", icon: Landmark },
    { id: "calendar", label: "Платежи", icon: Calendar },
    { id: "promo", label: "Акции", icon: Megaphone },
    { id: "health", label: "Паспорт", icon: HeartPulse },
    { id: "reviews", label: "Отзывы", icon: MessageSquareText },
    { id: "data", label: "Данные", icon: Database },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-1 rounded-xl bg-muted p-1 print:hidden" data-tour="more-tabs">
        {subs.map((s) => (
          <button
            key={s.id}
            onClick={() => ((initialSub = s.id), setSub(s.id))}
            className={cn("rounded-lg py-2 text-xs flex flex-col items-center gap-0.5", sub === s.id ? "bg-background shadow font-semibold" : "text-muted-foreground")}
          >
            <s.icon className="size-4" />
            {s.label}
          </button>
        ))}
      </div>
      {sub === "tax" && <TaxScreen />}
      {sub === "calendar" && <PaymentCalendar />}
      {sub === "promo" && <Promo />}
      {sub === "health" && <Health />}
      {sub === "reviews" && <Reviews />}
      {sub === "data" && (
        <Card>
          <CardContent className="space-y-3">
            <div className="text-sm">
              Источник: <b>{ds.source}</b> · строк: {ds.rows.length}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" onClick={clear}>
                <Upload className="size-4" /> Загрузить другой файл
              </Button>
              <Button variant="destructive" onClick={() => confirm(`${t.deleteData}?`) && clear()}>
                <Trash2 className="size-4" /> {t.deleteData}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Сырые данные хранятся только в этом браузере (localStorage). На сервер для ИИ уходят лишь итоговые цифры.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
