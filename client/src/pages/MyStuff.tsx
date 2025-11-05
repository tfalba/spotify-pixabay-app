import HeaderBar from "../components/HeaderBar";

export default function MyStuff() {
  return (
    <div className="min-h-screen w-full bg-portfolio-gradient text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 pb-12 pt-8 lg:px-10">
        <HeaderBar activePath="/mystuff" />

        <main className="mt-10 flex-1 rounded-3xl border border-white/10 bg-black/20 p-8 backdrop-blur">
          <h2 className="text-2xl font-semibold uppercase tracking-[0.3em] text-amber">
            My Stuff
          </h2>
          <p className="mt-4 text-sm text-slate-300">
            Personal collections will appear here soon.
          </p>
        </main>
      </div>
    </div>
  );
}
