"use client";

import { useState } from "react";
import { Upload, Calendar, Megaphone, HeartPulse, Database, MessageSquareText, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { dn } from "@/lib/demo";
import { PaymentCalendar } from "./calendar";
import { Promo } from "./promo";
import { Health } from "./health";
import { Reviews } from "./reviews";
import { TaxScreen } from "./tax";
import { DeleteButton } from "./topbar";
import { ErrorBoundary } from "./error-boundary";
import { cn } from "@/lib/utils";

type Sub = "tax" | "calendar" | "promo" | "health" | "reviews" | "data";
let initialSub: Sub = "tax";
export function openMoreSub(s: Sub) {
  initialSub = s;
}

export function More() {
  const { ds, t, lang, clear } = useApp();
  const [sub, setSub] = useState<Sub>(initialSub);
  if (!ds) return null;
  const subs: { id: Sub; label: string; icon: React.ElementType }[] = [
    { id: "tax", label: t.subTax, icon: Landmark },
    { id: "calendar", label: t.subCalendar, icon: Calendar },
    { id: "promo", label: t.subPromo, icon: Megaphone },
    { id: "health", label: t.subHealth, icon: HeartPulse },
    { id: "reviews", label: t.subReviews, icon: MessageSquareText },
    { id: "data", label: t.subData, icon: Database },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 rounded-xl bg-muted p-1 print:hidden" data-tour="more-tabs" role="tablist">
        {subs.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={sub === s.id}
            onClick={() => ((initialSub = s.id), setSub(s.id))}
            className={cn("rounded-lg py-2 text-xs flex flex-col items-center gap-0.5", sub === s.id ? "bg-background shadow font-semibold" : "text-muted-foreground")}
          >
            <s.icon className="size-4" aria-hidden />
            {s.label}
          </button>
        ))}
      </div>
      <ErrorBoundary resetKey={sub} labels={{ title: t.errScreen, reload: t.errReload, restart: t.errRestart }} onRestart={clear}>
        {sub === "tax" && <TaxScreen />}
        {sub === "calendar" && <PaymentCalendar />}
        {sub === "promo" && <Promo />}
        {sub === "health" && <Health />}
        {sub === "reviews" && <Reviews />}
        {sub === "data" && (
          <Card>
            <CardContent className="space-y-3">
              <div className="text-sm">{t.dataSource(dn(ds.source, lang), ds.rows.length)}</div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={clear}>
                  <Upload className="size-4" aria-hidden /> {t.uploadOther}
                </Button>
                <DeleteButton />
              </div>
              <p className="text-xs text-muted-foreground">{t.privacyData}</p>
            </CardContent>
          </Card>
        )}
      </ErrorBoundary>
    </div>
  );
}
