"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { money } from "@/lib/analytics";
import { human, humanWd } from "@/lib/dates";
import { KZ2026, TAX_MODES, type TaxMode } from "@/lib/tax/kz2026";

export function TaxScreen() {
  const { a, setTax } = useApp();
  if (!a) return null;
  const t = a.tax;
  const st = t.settings;
  const isOur = st.mode === "our";
  return (
    <div className="space-y-4">
      <Card className="border-violet-500/30">
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold">✉️ Налоговый конверт</div>
              <div className="text-xs text-muted-foreground">
                {TAX_MODES.find((m) => m.id === st.mode)?.label} · {t.periodLabel}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">отложить сейчас</div>
              <div className="text-2xl font-bold tabular-nums text-violet-700 dark:text-violet-400">{money(t.reserve)}</div>
            </div>
          </div>
          <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span>{isOur ? "НДС к уплате" : "Налог за полугодие"} до {human(t.dueDate)}</span>
              <b className="tabular-nums">≈ {money(t.reserveAtDue)}</b>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>До срока уплаты</span>
              <b className={t.daysToDue <= 14 ? "text-red-600" : ""}>{t.daysToDue} дн.</b>
            </div>
            <div className="text-xs text-muted-foreground">
              {isOur
                ? `НДС ${Math.round(KZ2026.vatRate * 100)}% «внутри» разницы продаж и закупок с начала квартала.`
                : `${(t.rate * 100).toLocaleString("ru-RU")}% от дохода с начала полугодия (${human(t.periodStart)}).`}
              {t.estimated && " Часть периода до начала ваших данных оценена по средней выручке."}
            </div>
          </div>
          {t.socialNext && (
            <div className="flex justify-between text-sm border-t pt-2">
              <span>Соцплатежи ИП за себя · до {humanWd(t.socialNext)}</span>
              <b className="tabular-nums">{money(t.socialAmount)}</b>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Соцплатежи и налог автоматически стоят в прогнозе на 14 дней и вычитаются из «свободных денег».</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-2">
          {!isOur && (<>
          <div className="flex justify-between text-sm">
            <span className="font-semibold">Лимит упрощёнки</span>
            <span className="text-muted-foreground">600 000 МРП = {money(t.limit)}</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className={`h-full ${t.limitShare > 0.8 ? "bg-red-500" : t.limitShare > 0.5 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, Math.max(1, t.limitShare * 100))}%` }} />
          </div>
          <div className="text-xs text-muted-foreground">
            Доход с 1 января ≈ {money(t.ytd)} — {(t.limitShare * 100).toFixed(1).replace(".", ",")}% лимита
            {t.estimated && " (оценка)"}
          </div>
          </>)}
          {isOur && (
            <div className="rounded-lg bg-amber-400/10 border border-amber-500/30 p-2 text-sm mt-2">
              Порог НДС 10 000 МРП = <b>{money(t.vatThreshold)}</b>:{" "}
              {t.vatExceeded ? <b className="text-red-600">уже превышен в этом году</b> : t.vatDate ? <>при текущей выручке превысите ≈ <b>{human(t.vatDate)}</b></> : "в этом году не превысите"}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3">
          <div className="font-semibold">Настройки</div>
          <label className="block text-sm space-y-1">
            <span className="text-muted-foreground">Режим</span>
            <select className="w-full rounded-md border bg-background px-2 py-2" value={st.mode} onChange={(e) => setTax({ mode: e.target.value as TaxMode })}>
              {TAX_MODES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
          {st.mode === "custom" && (
            <Num label="Своя ставка, %" value={+(st.customRate * 100).toFixed(2)} onChange={(v) => setTax({ customRate: v / 100 })} />
          )}
          <div className="grid grid-cols-2 gap-2">
            <Num label="МРП, ₸" value={st.mrp} onChange={(v) => setTax({ mrp: v })} />
            <Num label="Соцплатежи в месяц, ₸" value={st.socialMonthly} onChange={(v) => setTax({ socialMonthly: v })} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={st.isIP} onChange={(e) => setTax({ isIP: e.target.checked })} /> Я ИП (платить соцплатежи за себя до {st.socialDueDay} числа)
          </label>
          <button className="text-xs underline text-muted-foreground" onClick={() => setTax({ mode: "taraz2", customRate: 0.03, mrp: KZ2026.mrp, socialMonthly: KZ2026.socialMinMonthly, isIP: true })}>
            Вернуть значения 2026
          </button>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-3">
        ⚠️ Расчёт ориентировочный, не налоговая консультация. Ставки 2026: МРП {money(KZ2026.mrp)}, упрощёнка в Таразе 2% (решение Таразского гормаслихата № 33-4), базовая 4%, НДС 16%. Перед уплатой сверьте суммы с бухгалтером или в кабинете налогоплательщика.
      </p>
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
          const v = parseFloat(e.target.value.replace(",", "."));
          if (!isNaN(v) && v >= 0) onChange(v);
        }}
      />
    </label>
  );
}
