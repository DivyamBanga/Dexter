const STORAGE_KEY = "dexter-username";

export function getUsername(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function setUsername(name: string): void {
  localStorage.setItem(STORAGE_KEY, name.trim());
}

export function clearUsername(): void {
  localStorage.removeItem(STORAGE_KEY);
}
