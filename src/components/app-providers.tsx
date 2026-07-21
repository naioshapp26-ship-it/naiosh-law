"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { ColorModeProvider } from "@/components/color-mode";
import { GlobalBackButton } from "@/components/global-back-button";
import { HomepageRouteChrome } from "@/components/homepage-route-chrome";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ColorModeProvider>
      <ThemeProvider>
        <HomepageRouteChrome />
        {children}
        <GlobalBackButton />
      </ThemeProvider>
    </ColorModeProvider>
  );
}
