import { NextResponse } from "next/server";
export async function POST() {
  return NextResponse.json(
    { error: "Route desactivee. Utilise /api/checkout pour le paiement Stripe." },
    { status: 410 }
  );
}