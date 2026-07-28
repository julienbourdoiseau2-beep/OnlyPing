import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line bg-surface-alt/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-6 text-xs text-ink-muted sm:px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} OnlyPing. Tous droits reserves.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/mentions-legales" className="hover:text-ink">
            Mentions legales
          </Link>
          <Link href="/cgu" className="hover:text-ink">
            CGU
          </Link>
          <Link href="/cgv" className="hover:text-ink">
            CGV
          </Link>
          <Link href="/confidentialite" className="hover:text-ink">
            Confidentialite
          </Link>
        </nav>
      </div>
    </footer>
  );
}
