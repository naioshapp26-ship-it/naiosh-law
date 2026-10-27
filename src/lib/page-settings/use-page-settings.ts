"use client";

import { useEffect, useState } from "react";

export type AppliedPageSettings = {
  display?: {
    title?: string;
    subtitle?: string;
    showKpis?: boolean;
    pageSize?: number;
    visibleColumns?: string[];
  };
  actions?: Record<string, boolean>;
  permissions?: Record<string, string[]>;
  fields?: {
    hiddenOptionalFields?: string[];
    requiredFields?: string[];
  };
  specialized?: Record<string, unknown>;
  customFields?: unknown[];
  sections?: unknown[];
  /** Page-level values for notes/custom No-Code sections */
  sectionData?: Record<string, Record<string, unknown>>;
  loading: boolean;
  previewMode: boolean;
};

/**
 * Shared client hook: load resolved page settings (or preview draft).
 * Used by ModuleShell and standalone staff pages.
 */
export function usePageSettings(pageKey: string | null | undefined): AppliedPageSettings {
  const [values, setValues] = useState<Omit<AppliedPageSettings, "loading" | "previewMode">>({});
  const [loading, setLoading] = useState(Boolean(pageKey));
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!pageKey) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          if (params.get("settingsPreview") === "1") {
            const raw = sessionStorage.getItem(`naiosh.pageSettings.preview.${pageKey}`);
            if (raw) {
              const draft = JSON.parse(raw) as Omit<AppliedPageSettings, "loading" | "previewMode">;
              if (!cancelled) {
                setValues(draft);
                setPreviewMode(true);
                setLoading(false);
              }
              return;
            }
          }
        }
        const res = await fetch(`/api/page-settings/${encodeURIComponent(pageKey)}`, {
          credentials: "include",
        });
        if (!res.ok) return;
        const body = await res.json();
        if (!cancelled) {
          setValues((body.resolved?.values ?? {}) as Omit<AppliedPageSettings, "loading" | "previewMode">);
          setPreviewMode(false);
        }
      } catch {
        /* keep defaults */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pageKey]);

  return { ...values, loading, previewMode };
}
