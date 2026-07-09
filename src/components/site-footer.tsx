import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-white/15 bg-[#1f2737]/95">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-3 py-6 text-xs text-[#b8c1cd] sm:px-4 sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; {new Date().getFullYear()} OnlyPing. Tous droits reserves.</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/mentions-legales" className="hover:text-white">
            Mentions legales
          </Link>
          <Link href="/cgu" className="hover:text-white">
            CGU
          </Link>
          <Link href="/cgv" className="hover:text-white">
            CGV
          </Link>
          <Link href="/confidentialite" className="hover:text-white">
            Confidentialite
          </Link>
        </nav>
      </div>
    </footer>
  );
}
