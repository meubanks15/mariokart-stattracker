import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get("search");

  const tracks = await prisma.track.findMany({
    where: search
      ? {
          name: {
            contains: search,
            mode: "insensitive",
          },
        }
      : undefined,
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      imageUrl: true,
    },
  });

  return NextResponse.json(tracks);
}
