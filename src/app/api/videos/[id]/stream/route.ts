import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getR2SignedReadUrl, isR2Enabled, parseR2VideoRef } from "@/lib/r2";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

function getMimeTypeFromFileName(fileName: string) {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".webm")) return "video/webm";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return "video/mp4";
}

export async function GET(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const video = await prisma.video.findUnique({
    where: { id: context.params.id },
    select: {
      id: true,
      coachId: true,
      isPublished: true,
      deletedAt: true,
      videoUrl: true,
      purchases: {
        where: { userId: session.user.id },
        select: { id: true }
      }
    }
  });

  if (!video) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwnerCoach = video.coachId === session.user.id;
  const hasPurchased = video.purchases.length > 0;

  if (video.deletedAt && !isAdmin && !isOwnerCoach && !hasPurchased) {
    return NextResponse.json({ error: "Video supprimee" }, { status: 404 });
  }

  if (!video.isPublished && !isAdmin && !isOwnerCoach && !hasPurchased) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  if (!isAdmin && !isOwnerCoach && !hasPurchased) {
    return NextResponse.json({ error: "Achat requis" }, { status: 403 });
  }

  if (video.videoUrl.startsWith("local:")) {
    const fileName = video.videoUrl.replace("local:", "");
    const absolutePath = join(process.cwd(), "storage", "private-videos", fileName);
    const fileBuffer = await readFile(absolutePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": getMimeTypeFromFileName(fileName),
        "Cache-Control": "private, no-store"
      }
    });
  }

  const r2Key = parseR2VideoRef(video.videoUrl);
  if (r2Key) {
    if (!isR2Enabled()) {
      return NextResponse.json({ error: "R2 non configure" }, { status: 500 });
    }

    const signedUrl = await getR2SignedReadUrl(r2Key, 120);
    return NextResponse.redirect(signedUrl);
  }

  if (video.videoUrl.startsWith("http://") || video.videoUrl.startsWith("https://") || video.videoUrl.startsWith("/")) {
    return NextResponse.redirect(new URL(video.videoUrl, process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  return NextResponse.json({ error: "Source video invalide" }, { status: 500 });
}