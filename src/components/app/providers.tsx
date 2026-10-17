"use client";

import { ThemeProvider } from "next-themes";
import { AppProvider } from "@/lib/store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <AppProvider>{children}</AppProvider>
    </ThemeProvider>
  );
}
