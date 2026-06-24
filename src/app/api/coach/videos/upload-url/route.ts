import { authOptions } from "@/lib/auth";
import { getR2SignedUploadUrl, isR2Enabled } from "@/lib/r2";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1)
});

const allowedMimeTypes = ["video/mp4", "video/webm", "video/quicktime"];

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

  if (!allowedMimeTypes.includes(parsed.data.contentType)) {
    return NextResponse.json({ error: "Format video non supporte" }, { status: 400 });
  }

  const ext = getExtension(parsed.data.fileName);
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  const key = `videos/${new Date().getUTCFullYear()}/${new Date().getUTCMonth() + 1}/${uniqueName}`;

  const uploadUrl = await getR2SignedUploadUrl({
    key,
    contentType: parsed.data.contentType,
    cacheControl: "private, max-age=0, no-store",
    expiresInSeconds: 300
  });

  return NextResponse.json({
    key,
    uploadUrl,
    headers: {
      "Content-Type": parsed.data.contentType,
      "Cache-Control": "private, max-age=0, no-store"
    }
  });
}
