import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VIDEO_CATEGORY_VALUES, VIDEO_LEVEL_VALUES } from "@/lib/video-taxonomy";
import { mkdir, writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

const allowedThumbnailMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const maxThumbnailSizeInBytes = 8 * 1024 * 1024;

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const formData = await request.formData();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim().toUpperCase();
  const level = String(formData.get("level") ?? "").trim().toUpperCase();
  const durationMin = Number(formData.get("durationMin") ?? 0);
  const priceCents = Number(formData.get("priceCents") ?? 0);
  const thumbnail = String(formData.get("thumbnail") ?? "").trim();
  const thumbnailFile = formData.get("thumbnailFile");

  if (!title || !description || !Number.isFinite(durationMin) || !Number.isFinite(priceCents)) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  if (!VIDEO_CATEGORY_VALUES.includes(category as (typeof VIDEO_CATEGORY_VALUES)[number])) {
    return NextResponse.json({ error: "Categorie invalide" }, { status: 400 });
  }

  if (!VIDEO_LEVEL_VALUES.includes(level as (typeof VIDEO_LEVEL_VALUES)[number])) {
    return NextResponse.json({ error: "Niveau invalide" }, { status: 400 });
  }

  const video = await prisma.video.findUnique({
    where: { id: context.params.id },
    select: { id: true, coachId: true }
  });

  if (!video) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  if (session.user.role !== "ADMIN" && video.coachId !== session.user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  let thumbnailUrl = thumbnail;
  if (thumbnailFile instanceof File && thumbnailFile.size > 0) {
    if (!allowedThumbnailMimeTypes.includes(thumbnailFile.type)) {
      return NextResponse.json({ error: "Format miniature non supporte" }, { status: 400 });
    }

    if (thumbnailFile.size > maxThumbnailSizeInBytes) {
      return NextResponse.json({ error: "Miniature trop lourde (max 8MB)" }, { status: 400 });
    }

    const thumbnailExt = thumbnailFile.name.includes(".")
      ? thumbnailFile.name.slice(thumbnailFile.name.lastIndexOf("."))
      : ".jpg";
    const thumbnailName = `thumb-${Date.now()}-${Math.random().toString(36).slice(2, 10)}${thumbnailExt}`;
    const publicUploadDir = join(process.cwd(), "public", "uploads");
    const thumbnailAbsolutePath = join(publicUploadDir, thumbnailName);

    await mkdir(publicUploadDir, { recursive: true });
    const thumbnailBytes = await thumbnailFile.arrayBuffer();
    await writeFile(thumbnailAbsolutePath, Buffer.from(thumbnailBytes));
    thumbnailUrl = `/uploads/${thumbnailName}`;
  }

  const updated = await prisma.video.update({
    where: { id: video.id },
    data: {
      title,
      description,
      category,
      level,
      durationMin,
      priceCents,
      thumbnail: thumbnailUrl
    },
    select: {
      id: true,
      title: true,
      category: true,
      level: true,
      thumbnail: true
    }
  });

  return NextResponse.json(updated);
}
