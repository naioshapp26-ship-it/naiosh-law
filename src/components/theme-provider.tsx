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
  getHeroBannerSrc,
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
  heroBannerSrc: string | null;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: DEFAULT_SITE_THEME,
  loading: true,
  refresh: async () => {},
  updateLocal: () => {},
  logoSrc: "",
  heroBannerSrc: null,
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
        ...DEFAULT_SITE_THEME,
        ...data,
        logoData: data.logoData ?? null,
        heroBannerPath: data.heroBannerPath ?? null,
        heroBannerData: data.heroBannerData ?? null,
        heroMediaKind: data.heroMediaKind ?? null,
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

  const updateLocal = useCallback((patch: Partial<SiteTheme>) => {
    setTheme((prev) => {
      const next = { ...prev, ...patch };
      applySiteTheme(next);
      if (typeof document !== "undefined") {
        document.body.style.background = next.backgroundColor;
        document.body.style.color = next.textColor;
      }
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      loading,
      refresh,
      updateLocal,
      logoSrc: getLogoSrc(theme),
      // API يُرجع مسار العرض الثابت؛ getHeroBannerSrc يحوّل أي data URL قديم إلى نفس المسار
      heroBannerSrc: getHeroBannerSrc(theme),
    }),
    [theme, loading, refresh, updateLocal]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useSiteTheme() {
  return useContext(ThemeContext);
}
