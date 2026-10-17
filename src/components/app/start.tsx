"use client";

import { useRef, useState } from "react";
import { Upload, Sparkles, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";
import { BIZ_LIST } from "@/lib/demo";
import { guessMapping, readFile, toRows, TEMPLATE_CSV, type Field, type Mapping, type ParsedTable } from "@/lib/importer";
import { TopBar } from "./topbar";
import { cn } from "@/lib/utils";

const FIELD_LABEL: Record<Field, string> = {
  date: "Дата *",
  amount: "Сумма *",
  item: "Товар / описание",
  qty: "Количество",
  type: "Тип операции",
  supplier: "Поставщик",
  income: "Приход (если нет «Суммы»)",
  expense: "Расход (если нет «Суммы»)",
};

export function Start() {
  const { t, biz, setBiz, loadDemo, loadRows } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [table, setTable] = useState<ParsedTable | null>(null);
  const [fileName, setFileName] = useState("");
  const [map, setMap] = useState<Mapping>({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onFile(f: File) {
    setErr("");
    setBusy(true);
    try {
      const tb = await readFile(f);
      if (!tb.records.length) throw new Error("В файле нет строк");
      setTable(tb);
      setFileName(f.name);
      setMap(guessMapping(tb.headers));
    } catch (e) {
      setErr("Не удалось прочитать файл: " + (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function apply() {
    if (!table) return;
    const { rows, skipped } = toRows(table, map);
    if (rows.length < 5) {
      setErr(`Распознано только ${rows.length} строк (пропущено ${skipped}). Проверьте колонки «Дата» и «Сумма».`);
      return;
    }
    loadRows(rows, fileName, biz);
  }

  const preview = table ? toRows({ ...table, records: table.records.slice(0, 200) }, map) : null;

  return (
    <div className="flex-1 flex flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-6 space-y-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <Sparkles className="size-3.5" /> Zhambyl Hub · AI for SME
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Финдиректор, который находит деньги в ₸</h1>
          <p className="text-muted-foreground">{t.tagline}. Загрузите продажи и закупки — увидите, когда закончатся деньги, где они заморожены и что сделать сегодня.</p>
        </div>

        <section className="space-y-3">
          <h2 className="font-semibold">{t.pick}</h2>
          <div className="grid grid-cols-2 gap-3">
            {BIZ_LIST.map((b) => (
              <button
                key={b.id}
                onClick={() => setBiz(b.id)}
                className={cn(
                  "rounded-xl border p-4 text-left transition hover:border-emerald-500",
                  biz === b.id ? "border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-500/30" : "bg-card",
                )}
              >
                <div className="text-2xl">{b.emoji}</div>
                <div className="mt-1 font-medium">{t[b.id]}</div>
              </button>
            ))}
          </div>
        </section>

        <div className="grid gap-3">
          <Button size="lg" className="h-14 text-base bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => loadDemo(biz)} data-tour="demo">
            <Sparkles className="size-5" /> {t.demo}
          </Button>
          <p className="text-xs text-muted-foreground text-center -mt-1">Сгенерированные данные за 60 дней — помечены как «демо-данные», не реальный бизнес.</p>
          <Button size="lg" variant="outline" className="h-14 text-base" onClick={() => fileRef.current?.click()} disabled={busy}>
            <Upload className="size-5" /> {busy ? "Читаю файл…" : t.upload}
          </Button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
          <a
            className="text-sm text-emerald-700 dark:text-emerald-400 underline underline-offset-4 inline-flex items-center gap-1 justify-center"
            href={"data:text/csv;charset=utf-8," + encodeURIComponent(TEMPLATE_CSV)}
            download="shablon-findir.csv"
          >
            <Download className="size-4" /> Скачать шаблон CSV
          </a>
        </div>

        {err && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-400">{err}</p>}

        {table && (
          <Card>
            <CardContent className="space-y-4">
              <div>
                <div className="font-semibold">Сопоставьте колонки</div>
                <div className="text-sm text-muted-foreground">
                  {fileName}: {table.records.length} строк. Колонки угаданы автоматически — поправьте, если нужно.
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {(Object.keys(FIELD_LABEL) as Field[]).map((f) => (
                  <label key={f} className="text-sm space-y-1">
                    <span className="text-muted-foreground">{FIELD_LABEL[f]}</span>
                    <select
                      className="w-full rounded-md border bg-background px-2 py-2"
                      value={map[f] ?? ""}
                      onChange={(e) => setMap({ ...map, [f]: e.target.value || undefined })}
                    >
                      <option value="">— нет —</option>
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
                    Распознано: <b>{preview.rows.length}</b> из первых {Math.min(200, table.records.length)} строк · продажи{" "}
                    {preview.rows.filter((r) => r.type === "sale").length}, закупки {preview.rows.filter((r) => r.type === "purchase").length}, расходы{" "}
                    {preview.rows.filter((r) => r.type === "expense").length}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Без колонки «Тип»: плюс — продажа, минус — закупка. Аренда, зарплата, налоги определяются по словам.
                  </div>
                </div>
              )}
              <Button className="w-full" onClick={apply}>
                Анализировать
              </Button>
            </CardContent>
          </Card>
        )}

        <a href="/pitch" className="block text-center text-sm text-muted-foreground underline underline-offset-4">Режим питча для жюри →</a>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0" /> Файлы обрабатываются в вашем браузере и хранятся только в нём. ИИ получает лишь итоговые цифры. Удалить данные — одной кнопкой.
        </p>
      </main>
    </div>
  );
}
