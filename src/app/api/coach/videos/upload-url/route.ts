import { authOptions } from "@/lib/auth";
import { getR2SignedUploadUrl, isR2Enabled } from "@/lib/r2";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  kind: z.enum(["video", "thumbnail"]).default("video")
});

const allowedMimeTypes = ["video/mp4", "video/webm", "video/quicktime"];
const allowedThumbnailMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/avif"];

function getExtension(fileName: string) {
  if (!fileName.includes(".")) {
    return ".mp4";
  }
  return fileName.slice(fileName.lastIndexOf("."));
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user.role !== "COACH" && session.user.role !== "ADMIN")) {
    return NextResponse.json({ error: "Acces refuse" }, { status: 403 });
  }

  if (!isR2Enabled()) {
    return NextResponse.json({ error: "R2 non configure" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Payload invalide" }, { status: 400 });
  }

  if (parsed.data.kind === "video" && !allowedMimeTypes.includes(parsed.data.contentType)) {
    return NextResponse.json({ error: "Format video non supporte" }, { status: 400 });
  }

  if (parsed.data.kind === "thumbnail" && !allowedThumbnailMimeTypes.includes(parsed.data.contentType)) {
    return NextResponse.json({ error: "Format miniature non supporte" }, { status: 400 });
  }

  const ext = getExtension(parsed.data.fileName);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const keyPrefix = parsed.data.kind === "video" ? "videos" : "thumbnails";
  const key = `${keyPrefix}/${new Date().getUTCFullYear()}/${new Date().getUTCMonth() + 1}/${uniqueName}`;
  const cacheControl =
    parsed.data.kind === "video" ? "private, max-age=0, no-store" : "public, max-age=31536000, immutable";

  const uploadUrl = await getR2SignedUploadUrl({
    key,
    contentType: parsed.data.contentType,
    cacheControl,
    expiresInSeconds: 300
  });

  return NextResponse.json({
    key,
    uploadUrl,
    headers: {
      "Content-Type": parsed.data.contentType,
      "Cache-Control": cacheControl
    }
  });
}
