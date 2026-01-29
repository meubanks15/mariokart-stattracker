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
    select: {
      id: true,
      name: true,
      imageUrl: true,
      _count: {
        select: {
          races: true,
        },
      },
    },
  });

  // Sort by play count (most played first), then alphabetically for ties
  const sortedTracks = tracks.sort((a, b) => {
    const countDiff = b._count.races - a._count.races;
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name);
  });

  // Return without the _count wrapper for cleaner response
  const result = sortedTracks.map((track) => ({
    id: track.id,
    name: track.name,
    imageUrl: track.imageUrl,
    playCount: track._count.races,
  }));

  return NextResponse.json(result);
}
