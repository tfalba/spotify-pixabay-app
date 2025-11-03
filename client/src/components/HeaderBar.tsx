import { post } from "../lib/fetcher";

export default function HeaderBar() {
  return (
    <header className="w-full flex items-center justify-between py-3 px-4 border-b bg-white sticky top-0 z-50">
      <h1 className="font-semibold tracking-tight">Spotify + Pixabay</h1>

      {/* Tight formatted login/logout in top-right */}
      <div className="flex items-center gap-2">
        <a
          href="/auth/login"
          className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50"
        >
          Login
        </a>
        <button
          onClick={() => post("/auth/logout").then(() => location.reload())}
          className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-50"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
