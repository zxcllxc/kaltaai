"use client";

import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/store";

export function More() {
  const { ds, t, clear } = useApp();
  if (!ds) return null;
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{t.more}</h1>
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
    </div>
  );
}
