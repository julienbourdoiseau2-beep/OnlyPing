"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 border-b border-white/15 bg-[#253044]/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-4">
        <Link href="/" className="text-xl font-bold tracking-wide text-[#e9edf2]">
          OnlyPing
        </Link>

        <nav className="flex items-center gap-4 text-sm text-[#d7dde5]">
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
          {session?.user?.role === "ADMIN" ? (
            <>
              <Link href="/admin/achats" className="hover:text-white">
                Admin achats
              </Link>
              <Link href="/admin/utilisateurs" className="hover:text-white">
                Admin utilisateurs
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
    </header>
  );
}