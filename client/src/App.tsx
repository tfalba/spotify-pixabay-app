import { useEffect, useState } from "react";
import Home from "./pages/Home";
import MyStuff from "./pages/MyStuff";
import HeaderBar from "./components/HeaderBar";

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

  const Page = path === "/mystuff" ? MyStuff : Home;

  return (
    <div className="min-h-screen w-full bg-portfolio-gradient text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-8xl flex-col px-6 pb-12 pt-8 lg:px-10">
        <HeaderBar activePath={path} />
        <Page />
      </div>
    </div>
  );
}
