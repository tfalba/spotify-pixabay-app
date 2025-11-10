import type { ReactNode } from "react";

export default function TracksListsContainer({children}: {children: ReactNode}) {
  return (
   <section
      className="xl:col-span-1 xl:col-start-1
           flex min-w-0 flex-col rounded-3xl border border-[amber]/80 p-6 shadow-glow max-h-[max(600px,calc(100vh-10rem))] overflow-y-scroll"
    >      {children}
    </section>
  );
}