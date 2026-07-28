"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/theme-toggle";

export function SiteHeader() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-display font-semibold tracking-tight text-ink">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">
            OP
          </span>
          OnlyPing
        </Link>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            className="rounded-full border border-line px-3 py-2 text-sm text-ink hover:bg-surface-alt"
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-nav"
            aria-label="Ouvrir le menu"
          >
            Menu
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
            <>
              <Link href="/admin" className="transition-colors hover:text-ink">
                Administration
              </Link>
              <Link href="/admin/achats" className="transition-colors hover:text-ink">
                Admin achats
              </Link>
              <Link href="/admin/utilisateurs" className="transition-colors hover:text-ink">
                Admin utilisateurs
              </Link>
              <Link href="/admin/coach-requests" className="transition-colors hover:text-ink">
                Demandes coach
              </Link>
            </>
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
        <nav
          id="mobile-nav"
          className="border-t border-line bg-surface px-3 py-3 text-sm text-ink-muted md:hidden"
        >
          <div className="flex flex-col gap-1">
            <Link href="/catalogue" className="rounded-sm px-2 py-2 hover:bg-surface-alt" onClick={closeMobileMenu}>
              Catalogue
            </Link>
            <Link href="/mes-achats" className="rounded-sm px-2 py-2 hover:bg-surface-alt" onClick={closeMobileMenu}>
              Mes achats
            </Link>
            {session?.user ? (
              <Link href="/profil" className="rounded-sm px-2 py-2 hover:bg-surface-alt" onClick={closeMobileMenu}>
                Profil
              </Link>
            ) : null}
            <Link href="/dashboard" className="rounded-sm px-2 py-2 hover:bg-surface-alt" onClick={closeMobileMenu}>
              Espace coach
            </Link>
            {session?.user ? (
              <Link href="/devenir-coach" className="rounded-sm px-2 py-2 hover:bg-surface-alt" onClick={closeMobileMenu}>
                Devenir coach
              </Link>
            ) : null}

            {session?.user?.role === "ADMIN" ? (
              <>
                <Link href="/admin" className="rounded-sm px-2 py-2 hover:bg-surface-alt" onClick={closeMobileMenu}>
                  Administration
                </Link>
                <Link href="/admin/achats" className="rounded-sm px-2 py-2 hover:bg-surface-alt" onClick={closeMobileMenu}>
                  Admin achats
                </Link>
                <Link
                  href="/admin/utilisateurs"
                  className="rounded-sm px-2 py-2 hover:bg-surface-alt"
                  onClick={closeMobileMenu}
                >
                  Admin utilisateurs
                </Link>
                <Link
                  href="/admin/coach-requests"
                  className="rounded-sm px-2 py-2 hover:bg-surface-alt"
                  onClick={closeMobileMenu}
                >
                  Demandes coach
                </Link>
              </>
            ) : null}

            {session?.user ? (
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  signOut({ callbackUrl: "/" });
                }}
                className="mt-1 rounded-sm border border-line px-3 py-2 text-left hover:bg-surface-alt"
              >
                Deconnexion
              </button>
            ) : (
              <>
                <Link href="/register" className="rounded-sm px-2 py-2 hover:bg-surface-alt" onClick={closeMobileMenu}>
                  Inscription
                </Link>
                <Link
                  href="/login"
                  className="mt-1 rounded-full bg-accent px-3 py-2 text-center font-semibold text-white hover:bg-accent-deep"
                  onClick={closeMobileMenu}
                >
                  Connexion
                </Link>
              </>
            )}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
