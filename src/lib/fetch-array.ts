export async function fetchArray<T>(url: string): Promise<T[]> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  const payload: unknown = await response.json();
  if (!Array.isArray(payload)) {
    throw new Error("Expected an array response");
  }

  return payload as T[];
}
