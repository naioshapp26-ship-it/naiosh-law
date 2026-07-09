const defaultAppPath = "/app/dashboard";

export function isSafeAppPath(value: string | null | undefined): value is string {
  return Boolean(
    value &&
      (value === "/app" || value.startsWith("/app/")) &&
      !value.startsWith("//") &&
      !value.includes("://")
  );
}

export function getSafeAppPath(value: string | null | undefined) {
  return isSafeAppPath(value) ? value : defaultAppPath;
}
