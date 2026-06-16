import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(1200)
});

type RouteContext = {
  params: {
    id: string;
  };
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const video = await prisma.video.findUnique({
    where: { id: context.params.id },
    select: { id: true, isPublished: true }
  });

  if (!video || !video.isPublished) {
    return NextResponse.json({ error: "Video introuvable" }, { status: 404 });
  }

  const hasPurchased = await prisma.purchase.findUnique({
    where: {
      userId_videoId: {
        userId: session.user.id,
        videoId: video.id
      }
    },
    select: { id: true }
  });

  if (!hasPurchased) {
    return NextResponse.json({ error: "Avis reserves aux acheteurs" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Avis invalide" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: {
      userId_videoId: {
        userId: session.user.id,
        videoId: video.id
      }
    },
    create: {
      userId: session.user.id,
      videoId: video.id,
      rating: parsed.data.rating,
      comment: parsed.data.comment
    },
    update: {
      rating: parsed.data.rating,
      comment: parsed.data.comment
    },
    select: {
      id: true,
      rating: true,
      comment: true,
      updatedAt: true
    }
  });

  return NextResponse.json(review);
}

export async function DELETE(_: Request, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Connexion requise" }, { status: 401 });
  }

  const review = await prisma.review.findUnique({
    where: {
      userId_videoId: {
        userId: session.user.id,
        videoId: context.params.id
      }
    },
    select: { id: true }
  });

  if (!review) {
    return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
  }

  await prisma.review.delete({
    where: { id: review.id }
  });

  return NextResponse.json({ success: true });
}
