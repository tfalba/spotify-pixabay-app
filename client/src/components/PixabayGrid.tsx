import { useEffect, useState } from "react";
import { get } from "../lib/fetcher";

export default function PixabayGrid({ query }: { query: string }) {
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!query) {
      setItems([]);
      return;
    }
    get<any>(`/api/pixabay?q=${encodeURIComponent(query)}`)
      .then((data) => {
        setItems(data?.hits || []);
      })
      .catch(() => setItems([]));
  }, [query]);

  if (!query)
    return (
      <div className="text-xs text-slate-500">
        Pixabay images will appear here.
      </div>
    );

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((it: any) => (
        <a key={it.id} href={it.pageURL} target="_blank" className="block">
          <img
            src={it.previewURL}
            alt={it.tags}
            className="w-full h-24 object-cover rounded-lg"
          />
        </a>
      ))}
    </div>
  );
}
