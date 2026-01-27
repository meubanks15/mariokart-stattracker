import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json(players);
}
