import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      where: { isPublished: true, deletedAt: null },
      include: {
        coach: {
          select: { id: true, name: true, avatarUrl: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(videos);
  } catch (error) {
    console.error("videos-route-error", error);
    return NextResponse.json([], { status: 200 });
  }
}