import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { CreateRoundRequest, CreateRoundResponse } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body: CreateRoundRequest = await request.json();
  const { playerIds } = body;

  // Validate player count
  if (!playerIds || playerIds.length < 2 || playerIds.length > 4) {
    return NextResponse.json(
      { error: "Must have 2-4 players" },
      { status: 400 }
    );
  }

  // Check for duplicate players
  if (new Set(playerIds).size !== playerIds.length) {
    return NextResponse.json(
      { error: "Duplicate players not allowed" },
      { status: 400 }
    );
  }

  // Verify all players exist
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
  });

  if (players.length !== playerIds.length) {
    return NextResponse.json(
      { error: "One or more players not found" },
      { status: 400 }
    );
  }

  // Create round with players
  const round = await prisma.round.create({
    data: {
      status: "DRAFT",
      roundPlayers: {
        create: playerIds.map((playerId) => ({ playerId })),
      },
    },
  });

  const response: CreateRoundResponse = { roundId: round.id };
  return NextResponse.json(response, { status: 201 });
}
