"use client";

import { useRef, useState } from "react";
import { Upload, Sparkles, Download, ShieldCheck, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { BIZ_LIST } from "@/lib/demo";
import { FLAGS } from "@/lib/flags";
import { guessMapping, ImportError, isConfident, readFile, toRows, TEMPLATE_CSV, type Field, type Mapping, type ParsedTable } from "@/lib/importer";
import { TopBar } from "./topbar";
import { QuickStart } from "./quick";
import { cn } from "@/lib/utils";

export function Start() {
  const { t, biz, setBiz, loadDemo, loadRows } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [fileName, setFileName] = useState("");
  const [map, setMap] = useState<Mapping>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [quick, setQuick] = useState(false);

  const FIELD_LABEL: Record<Field, string> = {
    date: t.fDate,
    amount: t.fAmount,
    item: t.fItem,
    qty: t.fQty,
    type: t.fType,
    supplier: t.fSupplier,
    refund: t.fRefund,
    fee: t.fFee,
    income: t.fIncome,
    expense: t.fExpense,
  };

  async function onFile(f: File) {
    setErr("");
    setTable(null);
    setBusy(true);
    try {
      const tb = await readFile(f);
      const gm = guessMapping(tb.headers);
      // уверены в колонках → сразу анализируем; иначе — экран ручного сопоставления
      if (isConfident(gm)) {
        const { rows } = toRows(tb, gm);
        if (rows.length >= 5) {
          loadRows(rows, f.name, biz);
          return;
        }
      }
      setTable(tb);
      setFileName(f.name);
      setMap(gm);
      setErr(t.errUnsure);
    } catch (e) {
      const code = e instanceof ImportError ? e.code : null;
      setErr(code === "empty" ? t.errEmpty : code === "notTable" ? t.errNotTable : code === "broken" ? t.errBroken : code === "noDates" ? t.errNoDates : t.errRead);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function apply() {
    if (!table) return;
    const { rows, skipped } = toRows(table, map);
    if (rows.length < 5) {
      setErr(t.errFew(rows.length, skipped));
      return;
    }
    loadRows(rows, fileName, biz);
  }

  const preview = table ? toRows({ ...table, records: table.records.slice(0, 200) }, map) : null;

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />
      <div className="kalta-bootmsg flex-1 place-items-center py-24 text-muted-foreground" aria-hidden>
        <div className="size-12 rounded-xl bg-emerald-700 text-white grid place-items-center text-2xl font-bold animate-pulse">₸</div>
      </div>
      <main className="kalta-landing mx-auto w-full max-w-xl px-4 pb-16 pt-6 space-y-6">
        <noscript>
          <p className="rounded-lg border border-amber-500/40 bg-amber-400/10 p-3 text-sm">{t.noscript}</p>
        </noscript>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <Sparkles className="size-3.5" aria-hidden /> Zhambyl Hub · AI for SME
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            KaltaAI — <span className="text-emerald-700 dark:text-emerald-400">{t.heroTitle.charAt(0).toLowerCase() + t.heroTitle.slice(1)}</span>
          </h1>
          <p className="text-muted-foreground">
            {t.tagline}. {t.heroText}
          </p>
        </div>

        <section className="space-y-3" aria-labelledby="pick-biz">
          <h2 id="pick-biz" className="font-semibold">
            {t.pick}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {BIZ_LIST.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBiz(b.id)}
                aria-pressed={biz === b.id}
                className={cn("rounded-xl border p-4 text-left transition hover:border-emerald-500", biz === b.id ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30" : "bg-card")}
              >
                <div className="text-2xl" aria-hidden>
                  {b.emoji}
                </div>
                <div className="mt-1 font-medium">{t[b.id]}</div>
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-3">
          <a
            href={`/?demo=${biz}`}
            data-tour="demo"
            onClick={(e) => {
              e.preventDefault();
              loadDemo(biz);
            }}
            className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-base font-medium text-white hover:bg-emerald-800"
          >
            <Sparkles className="size-5" aria-hidden /> {t.demo}
          </a>
          <p className="text-xs text-muted-foreground text-center -mt-1">{t.demoNote}</p>
          <Button size="lg" variant="outline" className="h-14 text-base" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload className="size-5" aria-hidden /> {busy ? t.reading : t.upload}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" aria-label={t.upload} onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          {FLAGS.quickStart && (
            <Button size="lg" variant="ghost" className="h-12" onClick={() => setQuick((q) => !q)} aria-expanded={quick}>
              <ListChecks className="size-5" aria-hidden /> {t.quickStart}
            </Button>
          )}
          <a className="text-sm text-emerald-800 dark:text-emerald-300 underline underline-offset-4 inline-flex items-center gap-1 justify-center" href={"data:text/csv;charset=utf-8," + encodeURIComponent(TEMPLATE_CSV)} download="shablon-kaltaai.csv">
            <Download className="size-4" aria-hidden /> {t.template}
          </a>
        </div>

        {FLAGS.quickStart && quick && <QuickStart />}

        {err && (
          <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-800 dark:text-red-300">
            {err}
          </p>
        )}

        {table && (
          <Card>
            <CardContent className="space-y-4">
              <div>
                <div className="font-semibold">{t.mapTitle}</div>
                <div className="text-sm text-muted-foreground">{t.mapRows(fileName, table.records.length, table.sheets ?? 1)}</div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(FIELD_LABEL) as Field[]).map((f) => (
                  <label key={f} className="text-sm space-y-1">
                    <span className="text-muted-foreground">{FIELD_LABEL[f]}</span>
                    <select className="w-full rounded-md border bg-background px-2 py-2" value={map[f] ?? ""} onChange={(e) => setMap({ ...map, [f]: e.target.value || undefined })}>
                      <option value="">{t.none}</option>
                      {table.headers.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {preview && (
                <div className="text-sm rounded-lg bg-muted p-3 space-y-1">
                  <div>
                    {t.preview(
                      preview.rows.length,
                      Math.min(200, table.records.length),
                      preview.rows.filter((r) => r.type === "sale").length,
                      preview.rows.filter((r) => r.type === "purchase").length,
                      preview.rows.filter((r) => r.type === "expense").length,
                    )}
                  </div>
                  <div className="text-muted-foreground text-xs">{t.mapHint}</div>
                </div>
              )}
              <Button className="w-full" onClick={apply}>
                {t.analyze}
              </Button>
            </CardContent>
          </Card>
        )}

        <a href="/pitch" className="block text-center text-sm text-muted-foreground underline underline-offset-4">
          {t.pitchLink}
        </a>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" aria-hidden /> {t.privacy}
        </p>
      </main>
    </div>
  );
}
