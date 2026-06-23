import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFromR2, isR2Enabled, parseR2PublicUrl, parseR2VideoRef, toPublicR2Url, uploadToR2 } from "@/lib/r2";
import { VIDEO_CATEGORY_VALUES, VIDEO_LEVEL_VALUES } from "@/lib/video-taxonomy";
import { mkdir, unlink, writeFile } from "fs/promises";
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
    select: { id: true, coachId: true, videoUrl: true, thumbnail: true, deletedAt: true }
  });

  if (!video || video.deletedAt) {
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
    const thumbnailBytes = await thumbnailFile.arrayBuffer();
    const thumbnailBuffer = Buffer.from(thumbnailBytes);

    if (isR2Enabled()) {
      const thumbnailKey = `thumbnails/${new Date().getUTCFullYear()}/${new Date().getUTCMonth() + 1}/${thumbnailName}`;
      await uploadToR2({
        key: thumbnailKey,
        body: thumbnailBuffer,
        contentType: thumbnailFile.type || "image/jpeg",
        cacheControl: "public, max-age=31536000, immutable"
      });
      thumbnailUrl = toPublicR2Url(thumbnailKey) || thumbnailUrl;
    } else {
      const publicUploadDir = join(process.cwd(), "public", "uploads");
      const thumbnailAbsolutePath = join(publicUploadDir, thumbnailName);
      await mkdir(publicUploadDir, { recursive: true });
      await writeFile(thumbnailAbsolutePath, thumbnailBuffer);
      thumbnailUrl = `/uploads/${thumbnailName}`;
    }
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

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const video = await prisma.video.findUnique({
    where: { id: context.params.id },
    select: {
      id: true,
      coachId: true,
      videoUrl: true,
      thumbnail: true,
      deletedAt: true
    }
  });

  if (!video) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  if (video.deletedAt) {
    return NextResponse.json({ error: "Video deja supprimee" }, { status: 410 });
  }

  if (session.user.role !== "ADMIN" && video.coachId !== session.user.id) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  await prisma.video.update({
    where: { id: video.id },
    data: { deletedAt: new Date() }
  });

  if (video.videoUrl.startsWith("local:")) {
    const fileName = video.videoUrl.replace("local:", "");
    const absolutePath = join(process.cwd(), "storage", "private-videos", fileName);
    await unlink(absolutePath).catch(() => undefined);
  }

  const r2VideoKey = parseR2VideoRef(video.videoUrl);
  if (r2VideoKey) {
    await deleteFromR2(r2VideoKey).catch(() => undefined);
  }

  if (video.thumbnail.startsWith("/uploads/")) {
    const thumbnailFileName = video.thumbnail.replace("/uploads/", "");
    const thumbnailAbsolutePath = join(process.cwd(), "public", "uploads", thumbnailFileName);
    await unlink(thumbnailAbsolutePath).catch(() => undefined);
  }

  const r2ThumbnailKey = parseR2PublicUrl(video.thumbnail);
  if (r2ThumbnailKey) {
    await deleteFromR2(r2ThumbnailKey).catch(() => undefined);
  }

  return NextResponse.json({ ok: true });
}
