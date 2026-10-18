"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { dueDate, human, humanWd, longDate } from "@/lib/dates";
import { KZ2026, type TaxMode } from "@/lib/tax/kz2026";

export function TaxScreen() {
  const { a, setTax, t, lang } = useApp();
  if (!a) return null;
  const tx = a.tax;
  const st = tx.settings;
  const isOur = st.mode === "our";
  const modes: { id: TaxMode; label: string }[] = [
    { id: "taraz2", label: t.modeTaraz },
    { id: "simp4", label: t.modeSimp4 },
    { id: "our", label: t.modeOur },
    { id: "custom", label: t.modeCustom },
  ];
  const period = tx.period.kind === "half" ? t.periodHalf(tx.period.no, tx.period.year) : t.periodQuarter(tx.period.no, tx.period.year);
  const rate = String(Math.round(tx.rate * 10000) / 100).replace(".", ",");
  return (
    <div className="space-y-4">
      <Card className="border-violet-500/30">
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="font-semibold">{t.envTitle}</h2>
              <div className="text-xs text-muted-foreground">
                {modes.find((m) => m.id === st.mode)?.label} · {period}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-muted-foreground">{t.setAsideNow}</div>
              <div className="text-2xl font-bold tabular-nums text-violet-800 dark:text-violet-300">{money(tx.reserve)}</div>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between gap-2">
              <span>{isOur ? t.vatForPeriod(dueDate(tx.dueDate, lang)) : t.taxForPeriod(dueDate(tx.dueDate, lang))}</span>
              <b className="tabular-nums shrink-0">≈ {money(tx.reserveAtDue)}</b>
            </div>
            <div className="flex justify-between gap-2 text-muted-foreground">
              <span>{t.daysToDue}</span>
              <b className={tx.daysToDue <= 14 ? "text-red-700 dark:text-red-400" : ""}>
                {tx.daysToDue} {t.days}
              </b>
            </div>
            <div className="text-xs text-muted-foreground">
              {isOur ? t.vatNote : t.simpNote(rate, longDate(tx.periodStart, lang))}
              {tx.estimated && t.estNote}
            </div>
          </div>
          {tx.socialNext && (
            <div className="flex justify-between gap-2 text-sm border-t pt-2">
              <span>{t.socialLine(lang === "kz" ? dueDate(tx.socialNext, "kz") : humanWd(tx.socialNext, lang))}</span>
              <b className="tabular-nums shrink-0">{money(tx.socialAmount)}</b>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{t.inForecast}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          {!isOur && (
            <>
              <div className="text-sm">
                <div className="font-semibold">{t.limitTitle}</div>
                <div className="text-muted-foreground">{t.limitText(money(tx.limit))}</div>
              </div>
              <div className="h-3 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(tx.limitShare * 100)} aria-label={t.limitTitle}>
                <div className={`h-full ${tx.limitShare > 0.8 ? "bg-red-600" : tx.limitShare > 0.5 ? "bg-amber-500" : "bg-emerald-600"}`} style={{ width: `${Math.min(100, Math.max(1, tx.limitShare * 100))}%` }} />
              </div>
              <div className="text-xs text-muted-foreground">
                {t.ytdLine(money(tx.ytd), (tx.limitShare * 100).toFixed(1).replace(".", ","))}
                {tx.estimated && t.estimate}
              </div>
            </>
          )}
          {isOur && (
            <div className="rounded-lg bg-amber-400/10 border border-amber-500/30 p-2 text-sm">
              {t.vatThr(money(tx.vatThreshold))}
              {tx.vatExceeded ? <b className="text-red-700 dark:text-red-400">{t.vatExceeded}</b> : tx.vatDate ? <b>{t.vatDate(human(tx.vatDate, lang))}</b> : t.vatNo}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <h2 className="font-semibold">{t.settings}</h2>
          <label className="block text-sm space-y-1">
            <span className="text-muted-foreground">{t.mode}</span>
            <select className="w-full rounded-md border bg-background px-2 py-2" value={st.mode} onChange={(e) => setTax({ mode: e.target.value as TaxMode })}>
              {modes.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          {st.mode === "custom" && <Num label={t.customRate} value={+(st.customRate * 100).toFixed(2)} onChange={(v) => setTax({ customRate: Math.min(v, 50) / 100 })} />}
          <div className="grid grid-cols-2 gap-2">
            <Num label={t.mrp} value={st.mrp} onChange={(v) => setTax({ mrp: v })} />
            <Num label={t.socialMonthly} value={st.socialMonthly} onChange={(v) => setTax({ socialMonthly: v })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={st.isIP} onChange={(e) => setTax({ isIP: e.target.checked })} /> {t.isIP(st.socialDueDay)}
          </label>
          <button className="text-xs underline text-muted-foreground" onClick={() => setTax({ mode: "taraz2", customRate: 0.03, mrp: KZ2026.mrp, socialMonthly: KZ2026.socialMinMonthly, isIP: true })}>
            {t.reset2026}
          </button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-3">{t.taxDisclaimer}</p>
    </div>
  );
}

function Num({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm space-y-1">
      <span className="text-muted-foreground">{label}</span>
      <input
        inputMode="decimal"
        className="w-full rounded-md border bg-background px-2 py-2 text-right tabular-nums"
        defaultValue={value}
        key={value}
        onBlur={(e) => {
          const v = parseFloat(e.target.value.replace(/\s/g, "").replace(",", "."));
          if (!isNaN(v) && v >= 0 && v < 1e9) onChange(v);
        }}
      />
    </label>
  );
}
