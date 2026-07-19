"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ColorModeProvider } from "@/components/color-mode";
import { GlobalBackButton } from "@/components/global-back-button";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ColorModeProvider>
      <ThemeProvider>
        {children}
        <GlobalBackButton />
      </ThemeProvider>
    </ColorModeProvider>
  );
}
