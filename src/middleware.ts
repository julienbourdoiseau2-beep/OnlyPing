import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_REQUIRED_PATTERNS = [
  /^\/dashboard(?:\/.*)?$/,
  /^\/mes-achats$/,
  /^\/profil$/,
  /^\/devenir-coach$/,
  /^\/admin(?:\/.*)?$/,
  /^\/api\/admin(?:\/.*)?$/,
  /^\/api\/checkout$/,
  /^\/api\/purchase$/,
  /^\/api\/profile(?:\/.*)?$/,
  /^\/api\/coach-request$/,
  /^\/api\/coach(?:\/.*)?$/
];

// Routes an authenticated-but-unverified user must still be able to reach:
// the verification page itself, and every auth endpoint (login/logout,
// register, password reset, resend code, code check).
const VERIFICATION_EXEMPT_PATTERNS = [/^\/verify-email$/, /^\/api\/auth\/.*$/];

function matches(pathname: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(pathname));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith("/api/");
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  if (!token && matches(pathname, AUTH_REQUIRED_PATTERNS)) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
    }

    const signInUrl = new URL("/login", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (token && !token.emailVerified && !matches(pathname, VERIFICATION_EXEMPT_PATTERNS)) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Verifie ton adresse email pour continuer." }, { status: 403 });
    }

    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|service-worker.js|icon-192x192.png|icon-512x512.png).*)"
  ]
};
