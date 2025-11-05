import { useEffect, useState } from "react";
import Home from "./pages/Home";
import MyStuff from "./pages/MyStuff";

function getHashPath() {
  if (typeof window === "undefined") return "/";
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

export default function App() {
  const [path, setPath] = useState<string>(getHashPath());

  useEffect(() => {
    const onHashChange = () => setPath(getHashPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  switch (path) {
    case "/mystuff":
      return <MyStuff />;
    case "/":
    default:
      return <Home />;
  }
}
