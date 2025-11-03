import { env } from "./env";

export async function pixabaySearch(q: string) {
  const params = new URLSearchParams({
    key: env.PIXABAY_API_KEY,
    q,
    image_type: "photo",
    safesearch: "true",
    per_page: "12",
  });
  const url = `https://pixabay.com/api/?${params.toString()}`;
  const res = await fetch(url);
  const json: any = await res.json();
  return json;
}
