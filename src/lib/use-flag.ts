"use client";

import { useEffect, useState } from "react";
import { FLAGS, localFlags } from "./flags";

/** Флаг фичи: значение по умолчанию из FLAGS + локальное включение через ?ff= (без рассинхрона с SSR). */
export function useFlag(name: keyof typeof FLAGS) {
  const [on, setOn] = useState(FLAGS[name]);
  useEffect(() => {
    if (!FLAGS[name] && localFlags().includes(name)) setOn(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, [name]);
  return on;
}
