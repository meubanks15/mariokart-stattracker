import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateTotalPoints, getWinners, hasTie } from "@/lib/points";
import type { OvertimeRequest } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  const { roundId } = await params;
  const body: OvertimeRequest = await request.json();
  const { trackId, results } = body;

  // Validate request
  if (!trackId || !results || !Array.isArray(results)) {
    return NextResponse.json(
      { error: "trackId and results are required" },
      { status: 400 }
    );
  }

  // Get round with all data
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      roundPlayers: true,
      races: {
        include: { results: true },
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

  // Verify we have 4 regular races
  const regularRaces = round.races.filter((r: { isOvertime: boolean }) => !r.isOvertime);
  if (regularRaces.length < 4) {
    return NextResponse.json(
      { error: "Must complete 4 races before overtime" },
      { status: 400 }
    );
  }

  // Check there is actually a tie
  const allResults = round.races.flatMap((race: { results: Array<{ playerId: string; pointsAwarded: number | null }> }) => race.results);
  const totals = calculateTotalPoints(allResults);

  if (!hasTie(totals)) {
    return NextResponse.json(
      { error: "No tie detected, overtime not needed" },
      { status: 400 }
    );
  }

  // Get tied players
  const tiedPlayerIds = getWinners(totals);

  // Validate results only include tied players
  const resultPlayerIds = results.map((r) => r.playerId);
  if (resultPlayerIds.length !== tiedPlayerIds.length) {
    return NextResponse.json(
      { error: `Overtime must include exactly ${tiedPlayerIds.length} tied players` },
      { status: 400 }
    );
  }

  if (!resultPlayerIds.every((id) => tiedPlayerIds.includes(id))) {
    return NextResponse.json(
      { error: "Results must only contain tied players" },
      { status: 400 }
    );
  }

  // Validate unique positions
  const positions = results.map((r) => r.finishPosition);
  const expectedPositions = Array.from(
    { length: tiedPlayerIds.length },
    (_, i) => i + 1
  );
  const sortedPositions = [...positions].sort((a, b) => a - b);
  if (JSON.stringify(sortedPositions) !== JSON.stringify(expectedPositions)) {
    return NextResponse.json(
      { error: `Positions must be unique values from 1 to ${tiedPlayerIds.length}` },
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

  // Find winner (1st place in overtime)
  const winnerResult = results.find((r) => r.finishPosition === 1);
  if (!winnerResult) {
    return NextResponse.json(
      { error: "Must have a player in 1st place" },
      { status: 400 }
    );
  }

  // Delete any existing overtime race
  await prisma.race.deleteMany({
    where: { roundId, isOvertime: true },
  });

  // Create overtime race (no points awarded for overtime)
  await prisma.race.create({
    data: {
      roundId,
      raceIndex: 5, // Overtime is race 5
      trackId,
      isOvertime: true,
      results: {
        create: results.map((r) => ({
          playerId: r.playerId,
          finishPosition: r.finishPosition,
          pointsAwarded: null, // Overtime doesn't award points
        })),
      },
    },
  });

  // Finalize round with winner
  await prisma.round.update({
    where: { id: roundId },
    data: {
      status: "COMPLETED",
      winnerPlayerId: winnerResult.playerId,
    },
  });

  return NextResponse.json({
    winnerId: winnerResult.playerId,
  });
}
