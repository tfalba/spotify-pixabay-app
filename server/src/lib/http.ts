// Generic JSON parser with good errors
export async function parseJson<T>(res: Response): Promise<T> {
  const txt = await res.text(); // keep raw for better errors
  try {
    const data = txt.length ? JSON.parse(txt) as unknown : ({} as unknown);
    return data as T;
  } catch (e) {
    throw new Error(`Failed to parse JSON (${res.status} ${res.statusText}): ${txt}`);
  }
}

// Guard for non-2xx
export function ensureOk(res: Response, context?: string) {
  if (!res.ok) {
    throw new Error(`${context ?? "HTTP"} failed: ${res.status} ${res.statusText}`);
  }
}
