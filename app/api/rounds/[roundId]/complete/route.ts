import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateTotalPoints, getWinners, hasTie } from "@/lib/points";
import type { CompleteRoundResponse } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;

  // Get round with all race results
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      roundPlayers: true,
      races: {
        include: {
          results: true,
        },
      },
    },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  if (round.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Round is not in draft status" },
      { status: 400 }
    );
  }

  // Check that all 4 regular races are completed
  const regularRaces = round.races.filter((r: { isOvertime: boolean }) => !r.isOvertime);
  if (regularRaces.length < 4) {
    return NextResponse.json(
      { error: `Only ${regularRaces.length} races completed, need 4` },
      { status: 400 }
    );
  }

  // Calculate total points
  const allResults = round.races.flatMap((race: { results: Array<{ playerId: string; pointsAwarded: number | null }> }) => race.results);
  const totals = calculateTotalPoints(allResults);

  // Check for tie
  const isTied = hasTie(totals);

  if (isTied) {
    // Return that overtime is needed
    const response: CompleteRoundResponse = {
      winnerId: null,
      isTied: true,
    };
    return NextResponse.json(response);
  }

  // Determine winner and finalize
  const winners = getWinners(totals);
  const winnerId = winners[0]; // Single winner

  await prisma.round.update({
    where: { id: roundId },
    data: {
      status: "COMPLETED",
      winnerPlayerId: winnerId,
    },
  });

  const response: CompleteRoundResponse = {
    winnerId,
    isTied: false,
  };

  return NextResponse.json(response);
}
