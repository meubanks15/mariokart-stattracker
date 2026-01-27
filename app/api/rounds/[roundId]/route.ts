import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;

  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      winnerPlayer: {
        select: { id: true, name: true, avatarUrl: true },
      },
      roundPlayers: {
        include: {
          player: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      },
      races: {
        orderBy: { raceIndex: "asc" },
        include: {
          track: {
            select: { id: true, name: true, imageUrl: true },
          },
          results: {
            select: {
              playerId: true,
              finishPosition: true,
              pointsAwarded: true,
            },
          },
        },
      },
    },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  return NextResponse.json(round);
}
