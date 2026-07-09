import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  updatedAt: string;
  children: ReactNode;
};

export function LegalPage({ title, updatedAt, children }: LegalPageProps) {
  return (
    <section className="mx-auto max-w-4xl px-3 sm:px-4 py-12">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="mt-2 text-sm text-[#8b95a5]">Derniere mise a jour : {updatedAt}</p>
      <div className="legal-body mt-8 rounded-2xl border border-white/10 bg-[#12161b]/80 p-6 text-sm leading-relaxed text-[#d7dde5]">
        {children}
      </div>
    </section>
  );
}

export function ToFill({ children }: { children: ReactNode }) {
  return <span className="legal-todo">[A COMPLETER : {children}]</span>;
}
