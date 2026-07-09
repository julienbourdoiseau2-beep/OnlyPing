import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

type RouteContext = {
  params: {
    id: string;
  };
};

export async function GET(_: Request, context: RouteContext) {
  const video = await prisma.video.findUnique({
    where: { id: context.params.id },
    include: {
      coach: {
        select: { id: true, name: true, avatarUrl: true }
      }
    }
  });

  if (!video || !video.isPublished || video.deletedAt) {
    return NextResponse.json({ error: "Video non trouvee" }, { status: 404 });
  }

  return NextResponse.json(video);
}