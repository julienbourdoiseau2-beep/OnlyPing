export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/mes-achats",
    "/profil",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/checkout",
    "/api/purchase",
    "/api/profile/:path*"
  ]
};