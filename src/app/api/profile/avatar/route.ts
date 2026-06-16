import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { join } from "path";
import { NextResponse } from "next/server";

const allowedMimeTypes = ["image/png", "image/jpeg", "image/webp", "image/avif"];
const maxAvatarSizeInBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const formData = await request.formData();
  const avatar = formData.get("avatar");

  if (!(avatar instanceof File)) {
    return NextResponse.json({ error: "Fichier image manquant" }, { status: 400 });
  }

  if (!allowedMimeTypes.includes(avatar.type)) {
    return NextResponse.json({ error: "Format image non supporte" }, { status: 400 });
  }

  if (avatar.size > maxAvatarSizeInBytes) {
    return NextResponse.json({ error: "Image trop lourde (max 8MB)" }, { status: 400 });
  }

  const ext = avatar.name.includes(".") ? avatar.name.slice(avatar.name.lastIndexOf(".")) : ".jpg";
  const fileName = `avatar-${session.user.id}-${Date.now()}${ext}`;
  const avatarDir = join(process.cwd(), "public", "uploads", "avatars");
  const absolutePath = join(avatarDir, fileName);

  await mkdir(avatarDir, { recursive: true });
  const bytes = await avatar.arrayBuffer();
  await writeFile(absolutePath, Buffer.from(bytes));

  const avatarUrl = `/uploads/avatars/${fileName}`;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { avatarUrl }
  });

  return NextResponse.json({ avatarUrl });
}
