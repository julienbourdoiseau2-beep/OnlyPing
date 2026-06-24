import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isR2Enabled, toPublicR2Url, toR2VideoRef, uploadToR2 } from "@/lib/r2";
import { VIDEO_CATEGORY_VALUES, VIDEO_LEVEL_VALUES } from "@/lib/video-taxonomy";
import { mkdir, writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { NextResponse } from "next/server";

const allowedMimeTypes = ["video/mp4", "video/webm", "video/quicktime"];
const allowedThumbnailMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const maxSizeInBytes = 500 * 1024 * 1024;
const maxThumbnailSizeInBytes = 8 * 1024 * 1024;

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("video");
  const videoR2Key = String(formData.get("videoR2Key") ?? "").trim();
  const thumbnailFile = formData.get("thumbnailFile");
  const title = String(formData.get("title") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim().toUpperCase();
  const description = String(formData.get("description") ?? "").trim();
  const level = String(formData.get("level") ?? "").trim().toUpperCase();
  const durationMin = Number(formData.get("durationMin") ?? 0);
  const priceCents = Number(formData.get("priceCents") ?? 0);
  const thumbnail = String(formData.get("thumbnail") ?? "").trim();

  const hasDirectR2Video = videoR2Key.length > 0;

  if (!hasDirectR2Video && !(file instanceof File)) {
    return NextResponse.json({ error: "Fichier video manquant" }, { status: 400 });
  }

  if (file instanceof File) {
    if (!allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: "Format video non supporte" }, { status: 400 });
    }

    if (file.size > maxSizeInBytes) {
      return NextResponse.json({ error: "Fichier trop lourd (max 500MB)" }, { status: 400 });
    }
  }

  if (hasDirectR2Video && (!videoR2Key.startsWith("videos/") || videoR2Key.includes(".."))) {
    return NextResponse.json({ error: "Reference video invalide" }, { status: 400 });
  }

  if (!title || !description || !level || !Number.isFinite(durationMin) || !Number.isFinite(priceCents)) {
    return NextResponse.json({ error: "Champs invalides" }, { status: 400 });
  }

  if (!VIDEO_CATEGORY_VALUES.includes(category as (typeof VIDEO_CATEGORY_VALUES)[number])) {
    return NextResponse.json({ error: "Categorie invalide" }, { status: 400 });
  }

  if (!VIDEO_LEVEL_VALUES.includes(level as (typeof VIDEO_LEVEL_VALUES)[number])) {
    return NextResponse.json({ error: "Niveau invalide" }, { status: 400 });
  }

  let videoUrl = "";
  if (hasDirectR2Video) {
    videoUrl = toR2VideoRef(videoR2Key);
  } else if (file instanceof File) {
    const ext = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".mp4";
    const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
    const bytes = await file.arrayBuffer();
    const videoBuffer = Buffer.from(bytes);
    const r2VideoKey = `videos/${new Date().getUTCFullYear()}/${new Date().getUTCMonth() + 1}/${uniqueName}`;

    videoUrl = `local:${uniqueName}`;
    if (isR2Enabled()) {
      await uploadToR2({
        key: r2VideoKey,
        body: videoBuffer,
        contentType: file.type || "video/mp4",
        cacheControl: "private, max-age=0, no-store"
      });
      videoUrl = toR2VideoRef(r2VideoKey);
    } else {
      const uploadDir = join(process.cwd(), "storage", "private-videos");
      const absolutePath = join(uploadDir, uniqueName);
      await mkdir(uploadDir, { recursive: true });
      await writeFile(absolutePath, videoBuffer);
    }
  }

  let thumbnailUrl = thumbnail || "";
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

  const baseSlug = toSlug(title) || "video";
  const slug = `${baseSlug}-${Date.now().toString().slice(-6)}`;

  const created = await prisma.video.create({
    data: {
      title,
      slug,
      description,
      category,
      level,
      durationMin,
      priceCents,
      thumbnail: thumbnailUrl,
      videoUrl,
      isPublished: false,
      coachId: session.user.id
    }
  });

  return NextResponse.json(created, { status: 201 });
}