import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPointsForPosition } from "@/lib/points";
import type { SaveRaceRequest, SaveRaceResponse } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string; raceIndex: string }> }
) {
  const { roundId, raceIndex: raceIndexStr } = await params;
  const raceIndex = parseInt(raceIndexStr, 10);

  if (isNaN(raceIndex) || raceIndex < 1 || raceIndex > 4) {
    return NextResponse.json(
      { error: "Race index must be between 1 and 4" },
      { status: 400 }
    );
  }

  const body: SaveRaceRequest = await request.json();
  const { trackId, results } = body;

  // Validate request
  if (!trackId || !results || !Array.isArray(results)) {
    return NextResponse.json(
      { error: "trackId and results are required" },
      { status: 400 }
    );
  }

  // Get round with players
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      roundPlayers: true,
      races: { orderBy: { raceIndex: "asc" } },
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

  const playerCount = round.roundPlayers.length;
  const playerIds = round.roundPlayers.map((rp: { playerId: string }) => rp.playerId);

  // Validate results count matches player count
  if (results.length !== playerCount) {
    return NextResponse.json(
      { error: `Expected ${playerCount} results, got ${results.length}` },
      { status: 400 }
    );
  }

  // Validate all players are in round
  const resultPlayerIds = results.map((r) => r.playerId);
  if (!resultPlayerIds.every((id) => playerIds.includes(id))) {
    return NextResponse.json(
      { error: "Results contain players not in this round" },
      { status: 400 }
    );
  }

  // Validate unique positions
  const positions = results.map((r) => r.finishPosition);
  const expectedPositions = Array.from({ length: playerCount }, (_, i) => i + 1);
  const sortedPositions = [...positions].sort((a, b) => a - b);
  if (JSON.stringify(sortedPositions) !== JSON.stringify(expectedPositions)) {
    return NextResponse.json(
      { error: `Positions must be unique values from 1 to ${playerCount}` },
      { status: 400 }
    );
  }

  // Validate races completed in order
  const completedRaceIndexes = round.races.map((r: { raceIndex: number }) => r.raceIndex);
  if (raceIndex > 1 && !completedRaceIndexes.includes(raceIndex - 1)) {
    return NextResponse.json(
      { error: `Must complete race ${raceIndex - 1} first` },
      { status: 400 }
    );
  }

  // Verify track exists
  const track = await prisma.track.findUnique({
    where: { id: trackId },
  });

  if (!track) {
    return NextResponse.json({ error: "Track not found" }, { status: 400 });
  }

  // Calculate points for each position
  const resultsWithPoints = results.map((r) => ({
    playerId: r.playerId,
    finishPosition: r.finishPosition,
    pointsAwarded: getPointsForPosition(r.finishPosition, playerCount),
  }));

  // Delete existing race at this index if it exists (for re-entry)
  await prisma.race.deleteMany({
    where: { roundId, raceIndex },
  });

  // Create race with results
  const race = await prisma.race.create({
    data: {
      roundId,
      raceIndex,
      trackId,
      isOvertime: false,
      results: {
        create: resultsWithPoints,
      },
    },
  });

  const response: SaveRaceResponse = {
    raceId: race.id,
    pointsAwarded: resultsWithPoints.map((r) => ({
      playerId: r.playerId,
      points: r.pointsAwarded,
    })),
  };

  return NextResponse.json(response, { status: 201 });
}
