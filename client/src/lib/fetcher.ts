
export async function get<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { credentials: "include", ...(init ?? {}) });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function post<T>(url: string, body?: Request["body"]): Promise<T> {
const res = await fetch(url, { method: "POST", body: body ? JSON.stringify(body) : undefined, headers: { "Content-Type": "application/json" }, credentials: "include" });
if (!res.ok) throw new Error(await res.text());
return res.json();
}