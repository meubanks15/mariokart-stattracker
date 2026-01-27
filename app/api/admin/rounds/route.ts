import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminCode, unauthorizedResponse } from "@/lib/admin";

export async function GET(request: NextRequest) {
  if (!verifyAdminCode(request)) return unauthorizedResponse();

  const rounds = await prisma.round.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      winnerPlayer: {
        select: { id: true, name: true },
      },
      roundPlayers: {
        include: {
          player: {
            select: { id: true, name: true },
          },
        },
      },
      races: {
        orderBy: { raceIndex: "asc" },
        include: {
          track: {
            select: { id: true, name: true },
          },
          results: {
            include: {
              player: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  return NextResponse.json(rounds);
}
