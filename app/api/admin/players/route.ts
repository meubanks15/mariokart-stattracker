import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminCode, unauthorizedResponse } from "@/lib/admin";

export async function GET(request: NextRequest) {
  if (!verifyAdminCode(request)) return unauthorizedResponse();

  const players = await prisma.player.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { roundPlayers: true, wonRounds: true },
      },
    },
  });

  return NextResponse.json(players);
}

export async function POST(request: NextRequest) {
  if (!verifyAdminCode(request)) return unauthorizedResponse();

  const { name, avatarUrl } = await request.json();

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Name is required" },
      { status: 400 }
    );
  }

  // Check for duplicate name
  const existing = await prisma.player.findUnique({
    where: { name: name.trim() },
  });

  if (existing) {
    return NextResponse.json(
      { error: "A player with this name already exists" },
      { status: 400 }
    );
  }

  const player = await prisma.player.create({
    data: {
      name: name.trim(),
      avatarUrl: avatarUrl || null,
    },
  });

  return NextResponse.json(player, { status: 201 });
}
