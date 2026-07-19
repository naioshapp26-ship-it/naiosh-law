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

export type ColorMode = "light" | "dark";

const STORAGE_KEY = "theme";
const DARK_CLASS = "dark-mode";

type ColorModeContextValue = {
  mode: ColorMode;
  isDark: boolean;
  toggle: () => void;
  setMode: (mode: ColorMode) => void;
};

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "light",
  isDark: false,
  toggle: () => {},
  setMode: () => {},
});

function readStoredMode(): ColorMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyDomMode(mode: ColorMode) {
  if (typeof document === "undefined") return;
  const isDark = mode === "dark";
  document.documentElement.classList.toggle(DARK_CLASS, isDark);
  document.body.classList.toggle(DARK_CLASS, isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  if (isDark) {
    document.body.style.background = "";
    document.body.style.color = "";
  }
}

export function ColorModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ColorMode>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const initial = readStoredMode();
    setModeState(initial);
    applyDomMode(initial);
    setReady(true);
  }, []);

  const setMode = useCallback((next: ColorMode) => {
    setModeState(next);
    applyDomMode(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const value = useMemo(
    () => ({
      mode,
      isDark: mode === "dark",
      toggle,
      setMode,
    }),
    [mode, toggle, setMode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      {ready ? children : children}
    </ColorModeContext.Provider>
  );
}

export function useColorMode() {
  return useContext(ColorModeContext);
}

type ToggleProps = {
  className?: string;
  style?: React.CSSProperties;
};

export function DarkModeToggle({ className = "", style }: ToggleProps) {
  const { isDark, toggle } = useColorMode();

  return (
    <button
      type="button"
      className={`dark-mode-toggle ${className}`.trim()}
      onClick={toggle}
      aria-label={isDark ? "تبديل إلى الوضع النهاري" : "تبديل إلى الوضع الليلي"}
      title={isDark ? "الوضع النهاري" : "الوضع الليلي"}
      style={style}
    >
      <span aria-hidden="true">{isDark ? "☀️" : "🌙"}</span>
    </button>
  );
}
