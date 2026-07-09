"use client";

import { useEffect, useRef } from "react";

let lockCount = 0;
let previousOverflow = "";

export function useScrollLock(enabled: boolean, onEscape?: () => void) {
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!enabled) return;

    if (lockCount === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscapeRef.current?.();
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
      }
    };
  }, [enabled]);
}
