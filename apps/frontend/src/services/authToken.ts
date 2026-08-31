// Token JWT (access-token thuần, không refresh) — tách riêng khỏi apiClient.ts và
// useAuthStore.ts để 2 module đó không phải import chéo nhau.
const STORAGE_KEY = "fsolution:authToken";

let token: string | null = localStorage.getItem(STORAGE_KEY);
let onUnauthorized: (() => void) | null = null;

export function getToken(): string | null {
  return token;
}

export function setToken(next: string | null): void {
  token = next;
  if (next) localStorage.setItem(STORAGE_KEY, next);
  else localStorage.removeItem(STORAGE_KEY);
}

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export function notifyUnauthorized(): void {
  onUnauthorized?.();
}
