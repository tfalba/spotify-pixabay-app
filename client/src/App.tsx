import { useEffect, useState } from "react";
import type { Track } from "./types/types";
import HeaderBar from "./components/HeaderBar";
import Home from "./pages/Home";
import MyStuff from "./pages/MyStuff";
import { get } from "./lib/fetcher";
import { useLyricsImages } from "./hooks/useLyricsImages";
import { SpotifyPlayerProvider } from "./context/SpotifyPlayerProvider";

function getHashPath() {
  if (typeof window === "undefined") return "/";
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

export default function App() {
  const [path, setPath] = useState(getHashPath());
  const [current, setCurrent] = useState<Track | null>(null);
  const API = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5174";


  const {
    fetchImages,
    keywords,
    setKeywords,
    images,
    setImages,
    loading,
    error,
  } = useLyricsImages();

  useEffect(() => {
    const onHashChange = () => {
      setPath(getHashPath());
      setCurrent(null);
      setKeywords([]);
      setImages([]);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    if (!current?.artists?.length || !current?.name) {
      setKeywords([]);
      setImages([]);
      return;
    }
    setImages([]);
    setKeywords([]);
    const cacheKey =
      current.uri ||
      (current.artists[0]?.name && current.name
        ? `${current.artists[0]?.name}::${current.name}`
        : current.id);

    get<{ lyrics: string; source: string }>(
      `${API}/api/lyrics?artist=${encodeURIComponent(
        current.artists[0]?.name || ""
      )}&title=${encodeURIComponent(current.name)}`
    )
      .then((d) => {
        fetchImages(d.lyrics, { cacheKey });
      })
      .catch(() => {
        setImages([]);
      });
  }, [current]);

  const pixabayProps = { images, keywords, loading, error };

  return (
    <SpotifyPlayerProvider>
      <div className="min-h-screen w-full bg-portfolio-gradient text-slate-100">
        <div className="mx-auto flex min-h-screen w-full max-w-8xl flex-col px-6 pb-12 pt-8 lg:px-10">
          <HeaderBar activePath={path} />
          {path === "/mystuff" ? (
            <MyStuff current={current} onPick={setCurrent} pixabay={pixabayProps} />
          ) : (
            <Home current={current} onPick={setCurrent} pixabay={pixabayProps} />
          )}
        </div>
      </div>
    </SpotifyPlayerProvider>
  );
}
