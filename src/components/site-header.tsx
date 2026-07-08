"use client";

import Link from "next/link";
import { useState } from "react";
import { signOut, useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-20 border-b border-white/15 bg-[#253044]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#e9edf2]">
          OnlyPing
        </Link>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          className="rounded-md border border-white/20 px-3 py-2 text-sm text-[#e9edf2] hover:bg-white/10 md:hidden"
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-nav"
          aria-label="Ouvrir le menu"
        >
          Menu
        </button>

        <nav className="hidden items-center gap-4 text-sm text-[#d7dde5] md:flex">
          <Link href="/catalogue" className="hover:text-white">
            Catalogue
          </Link>
          <Link href="/mes-achats" className="hover:text-white">
            Mes achats
          </Link>
          {session?.user ? (
            <Link href="/profil" className="hover:text-white">
              Profil
            </Link>
          ) : null}
          <Link href="/dashboard" className="hover:text-white">
            Espace coach
          </Link>
          {session?.user ? (
            <Link href="/devenir-coach" className="hover:text-white">
              Devenir coach
            </Link>
          ) : null}
          {session?.user?.role === "ADMIN" ? (
            <>
              <Link href="/admin/achats" className="hover:text-white">
                Admin achats
              </Link>
              <Link href="/admin/utilisateurs" className="hover:text-white">
                Admin utilisateurs
              </Link>
              <Link href="/admin/coach-requests" className="hover:text-white">
                Demandes coach
              </Link>
            </>
          ) : null}

          {session?.user ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
            >
              Deconnexion
            </button>
          ) : (
            <>
              <Link href="/register" className="hover:text-white">
                Inscription
              </Link>
              <Link href="/login" className="rounded-full bg-[#2b323c] px-3 py-1 text-[#f1f5f9] hover:bg-[#3a4350]">
                Connexion
              </Link>
            </>
          )}
        </nav>
      </div>

      {isMobileMenuOpen ? (
        <nav
          id="mobile-nav"
          className="border-t border-white/15 bg-[#1f2737]/95 px-3 py-3 text-sm text-[#d7dde5] md:hidden"
        >
          <div className="flex flex-col gap-2">
            <Link href="/catalogue" className="rounded px-2 py-2 hover:bg-white/10" onClick={closeMobileMenu}>
              Catalogue
            </Link>
            <Link href="/mes-achats" className="rounded px-2 py-2 hover:bg-white/10" onClick={closeMobileMenu}>
              Mes achats
            </Link>
            {session?.user ? (
              <Link href="/profil" className="rounded px-2 py-2 hover:bg-white/10" onClick={closeMobileMenu}>
                Profil
              </Link>
            ) : null}
            <Link href="/dashboard" className="rounded px-2 py-2 hover:bg-white/10" onClick={closeMobileMenu}>
              Espace coach
            </Link>
            {session?.user ? (
              <Link href="/devenir-coach" className="rounded px-2 py-2 hover:bg-white/10" onClick={closeMobileMenu}>
                Devenir coach
              </Link>
            ) : null}

            {session?.user?.role === "ADMIN" ? (
              <>
                <Link href="/admin/achats" className="rounded px-2 py-2 hover:bg-white/10" onClick={closeMobileMenu}>
                  Admin achats
                </Link>
                <Link
                  href="/admin/utilisateurs"
                  className="rounded px-2 py-2 hover:bg-white/10"
                  onClick={closeMobileMenu}
                >
                  Admin utilisateurs
                </Link>
                <Link
                  href="/admin/coach-requests"
                  className="rounded px-2 py-2 hover:bg-white/10"
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
                className="mt-1 rounded border border-white/20 px-3 py-2 text-left hover:bg-white/10"
              >
                Deconnexion
              </button>
            ) : (
              <>
                <Link href="/register" className="rounded px-2 py-2 hover:bg-white/10" onClick={closeMobileMenu}>
                  Inscription
                </Link>
                <Link
                  href="/login"
                  className="mt-1 rounded-full bg-[#2b323c] px-3 py-2 text-center text-[#f1f5f9] hover:bg-[#3a4350]"
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