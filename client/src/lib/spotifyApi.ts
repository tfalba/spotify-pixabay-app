export type AuthStatus = { authenticated: boolean };

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export async function spotifyApiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...(init ?? {}),
  });
}

export async function spotifyApiJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await spotifyApiFetch(path, init);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function getAuthStatus(init?: RequestInit): Promise<AuthStatus> {
  return spotifyApiJson<AuthStatus>("/api/auth/status", { method: "GET", ...(init ?? {}) });
}
