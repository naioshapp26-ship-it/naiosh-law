"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applySiteTheme,
  DEFAULT_SITE_THEME,
  getLogoSrc,
  type SiteSettingsRecord,
  type SiteTheme,
} from "@/lib/site-settings";

type ThemeContextValue = {
  theme: SiteTheme;
  loading: boolean;
  refresh: () => Promise<void>;
  updateLocal: (patch: Partial<SiteTheme>) => void;
  logoSrc: string;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_SITE_THEME,
  loading: true,
  refresh: async () => {},
  updateLocal: () => {},
  logoSrc: DEFAULT_SITE_THEME.logoPath,
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>(DEFAULT_SITE_THEME);
  const [loading, setLoading] = useState(true);

  const apply = useCallback((t: SiteTheme) => {
    setTheme(t);
    applySiteTheme(t);
    if (typeof document !== "undefined") {
      document.body.style.background = t.backgroundColor;
      document.body.style.color = t.textColor;
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/site-settings", { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as SiteSettingsRecord;
      apply({
        primaryColor: data.primaryColor,
        primaryDark: data.primaryDark,
        accentColor: data.accentColor,
        sidebarFrom: data.sidebarFrom,
        sidebarVia: data.sidebarVia,
        sidebarTo: data.sidebarTo,
        backgroundColor: data.backgroundColor,
        textColor: data.textColor,
        brandName: data.brandName,
        brandNameAr: data.brandNameAr,
        tagline: data.tagline,
        logoPath: data.logoPath,
        logoData: data.logoData,
        borderRadius: data.borderRadius,
      });
    } catch {
      apply(DEFAULT_SITE_THEME);
    } finally {
      setLoading(false);
    }
  }, [apply]);

  useEffect(() => {
    apply(DEFAULT_SITE_THEME);
    refresh();
  }, [apply, refresh]);

  const updateLocal = useCallback(
    (patch: Partial<SiteTheme>) => {
      const next = { ...theme, ...patch };
      apply(next);
    },
    [apply, theme]
  );

  const value = useMemo(
    () => ({
      theme,
      loading,
      refresh,
      updateLocal,
      logoSrc: getLogoSrc(theme),
    }),
    [theme, loading, refresh, updateLocal]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSiteTheme() {
  return useContext(ThemeContext);
}
