"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { GlobalBackButton } from "@/components/global-back-button";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <GlobalBackButton />
    </ThemeProvider>
  );
}
