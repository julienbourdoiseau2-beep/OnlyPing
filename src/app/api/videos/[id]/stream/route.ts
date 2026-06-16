import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
      videoUrl: true,
      purchases: {
        where: { userId: session.user.id },
        select: { id: true }
      }
    }
  });

  if (!video || !video.isPublished) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const isOwnerCoach = video.coachId === session.user.id;
  const hasPurchased = video.purchases.length > 0;

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

  if (video.videoUrl.startsWith("http://") || video.videoUrl.startsWith("https://") || video.videoUrl.startsWith("/")) {
    return NextResponse.redirect(new URL(video.videoUrl, process.env.NEXTAUTH_URL || "http://localhost:3000"));
  }

  return NextResponse.json({ error: "Source video invalide" }, { status: 500 });
}