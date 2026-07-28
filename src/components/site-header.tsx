"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

function MenuIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SiteHeader() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const mobileLinkClass =
    "flex items-center rounded-sm px-3 py-3 text-base text-ink transition-colors hover:bg-surface-alt active:bg-surface-alt";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-display font-semibold tracking-tight text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
            OP
          </span>
          OnlyPing
        </Link>

        <div className="flex items-center gap-1 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-ink hover:bg-surface-alt"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label={isMobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          >
            <MenuIcon open={isMobileMenuOpen} />
          </button>
        </div>

        <nav className="hidden items-center gap-5 text-sm text-ink-muted md:flex">
          <Link href="/catalogue" className="transition-colors hover:text-ink">
            Catalogue
          </Link>
          <Link href="/mes-achats" className="transition-colors hover:text-ink">
            Mes achats
          </Link>
          {session?.user ? (
            <Link href="/profil" className="transition-colors hover:text-ink">
              Profil
            </Link>
          ) : null}
          <Link href="/dashboard" className="transition-colors hover:text-ink">
            Espace coach
          </Link>
          {session?.user ? (
            <Link href="/devenir-coach" className="transition-colors hover:text-ink">
              Devenir coach
            </Link>
          ) : null}
          {session?.user?.role === "ADMIN" ? (
            <Link href="/admin" className="transition-colors hover:text-ink">
              Administration
            </Link>
          ) : null}

          <span className="h-5 w-px bg-line" aria-hidden="true" />
          <ThemeToggle />

          {session?.user ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full border border-line px-3 py-1.5 font-medium text-ink transition-colors hover:bg-surface-alt"
            >
              Deconnexion
            </button>
          ) : (
            <>
              <Link href="/register" className="transition-colors hover:text-ink">
                Inscription
              </Link>
              <Link
                href="/login"
                className="rounded-full bg-accent px-4 py-1.5 font-semibold text-white transition-colors hover:bg-accent-deep"
              >
                Connexion
              </Link>
            </>
          )}
        </nav>
      </div>

      {isMobileMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={closeMobileMenu}
            className="fixed inset-0 top-16 z-20 bg-ink/30 md:hidden"
          />
          <nav
            id="mobile-nav"
            className="fixed inset-x-0 top-16 z-30 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-line bg-surface px-3 pb-6 pt-2 shadow-raised md:hidden"
          >
            <div className="flex flex-col">
              <Link href="/catalogue" className={mobileLinkClass} onClick={closeMobileMenu}>
                Catalogue
              </Link>
              <Link href="/mes-achats" className={mobileLinkClass} onClick={closeMobileMenu}>
                Mes achats
              </Link>
              {session?.user ? (
                <Link href="/profil" className={mobileLinkClass} onClick={closeMobileMenu}>
                  Profil
                </Link>
              ) : null}
              <Link href="/dashboard" className={mobileLinkClass} onClick={closeMobileMenu}>
                Espace coach
              </Link>
              {session?.user ? (
                <Link href="/devenir-coach" className={mobileLinkClass} onClick={closeMobileMenu}>
                  Devenir coach
                </Link>
              ) : null}

              {session?.user?.role === "ADMIN" ? (
                <>
                  <div className="my-2 border-t border-line" />
                  <Link href="/admin" className={mobileLinkClass} onClick={closeMobileMenu}>
                    Administration
                  </Link>
                </>
              ) : null}

              <div className="my-2 border-t border-line" />

              {session?.user ? (
                <button
                  type="button"
                  onClick={() => {
                    closeMobileMenu();
                    signOut({ callbackUrl: "/" });
                  }}
                  className={`${mobileLinkClass} text-left`}
                >
                  Deconnexion
                </button>
              ) : (
                <>
                  <Link href="/register" className={mobileLinkClass} onClick={closeMobileMenu}>
                    Inscription
                  </Link>
                  <Link
                    href="/login"
                    className="mt-2 rounded-full bg-accent px-3 py-3 text-center text-base font-semibold text-white hover:bg-accent-deep"
                    onClick={closeMobileMenu}
                  >
                    Connexion
                  </Link>
                </>
              )}
            </div>
          </nav>
        </>
      ) : null}
    </header>
  );
}
