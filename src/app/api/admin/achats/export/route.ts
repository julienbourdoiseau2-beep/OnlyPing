import { authOptions } from "@/lib/auth";
import { computeCommissionAmounts, getEffectiveCommissionBps } from "@/lib/commission";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

function toDateRange(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return null;
  }

  const [yearPart, monthPart] = month.split("-");
  const year = Number(yearPart);
  const monthIndex = Number(monthPart) - 1;
  if (!Number.isInteger(year) || !Number.isInteger(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start, end };
}

function csvCell(value: string | number) {
  const text = String(value);
  if (/[",\n;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const url = new URL(request.url);
  const coachId = url.searchParams.get("coachId") ?? "";
  const month = url.searchParams.get("month") ?? "";
  const monthRange = toDateRange(month);

  const where = {
    ...(coachId ? { video: { coachId } } : {}),
    ...(monthRange ? { createdAt: { gte: monthRange.start, lt: monthRange.end } } : {})
  };

  const purchases = await prisma.purchase.findMany({
    where,
    include: {
      user: { select: { name: true, email: true } },
      video: {
        select: {
          title: true,
          level: true,
          commissionBpsOverride: true,
          coach: { select: { name: true, commissionBps: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const header = [
    "Date",
    "Utilisateur",
    "Email",
    "Video",
    "Coach",
    "Niveau",
    "CA (EUR)",
    "Commission (EUR)",
    "Gain reel coach (EUR)",
    "Statut"
  ];

  const rows = purchases.map((purchase) => {
    const bps =
      purchase.commissionBpsAtPurchase ??
      getEffectiveCommissionBps(purchase.video.commissionBpsOverride, purchase.video.coach.commissionBps);
    const amounts =
      purchase.commissionAmount !== null && purchase.coachNetAmount !== null
        ? { commissionAmount: purchase.commissionAmount, coachNetAmount: purchase.coachNetAmount }
        : computeCommissionAmounts(purchase.amount, bps);

    const status = purchase.refundedAt ? "Rembourse" : purchase.disputedAt ? "Litige en cours" : "Paye";

    return [
      purchase.createdAt.toISOString().slice(0, 10),
      purchase.user.name,
      purchase.user.email,
      purchase.video.title,
      purchase.video.coach.name,
      purchase.video.level,
      (purchase.amount / 100).toFixed(2),
      (amounts.commissionAmount / 100).toFixed(2),
      (amounts.coachNetAmount / 100).toFixed(2),
      status
    ];
  });

  const csv = [header, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="onlyping-achats-${new Date().toISOString().slice(0, 10)}.csv"`
    }
  });
}
