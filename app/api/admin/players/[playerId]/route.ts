import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminCode, unauthorizedResponse } from "@/lib/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  if (!verifyAdminCode(request)) return unauthorizedResponse();

  const { playerId } = await params;

  // Check if player exists
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      _count: {
        select: { roundPlayers: true },
      },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Warn if player has participated in rounds
  if (player._count.roundPlayers > 0) {
    // Delete anyway - cascade will handle it
  }

  await prisma.player.delete({
    where: { id: playerId },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  if (!verifyAdminCode(request)) return unauthorizedResponse();

  const { playerId } = await params;
  const { name, avatarUrl } = await request.json();

  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Check for duplicate name if name is being changed
  if (name && name !== player.name) {
    const existing = await prisma.player.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A player with this name already exists" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.player.update({
    where: { id: playerId },
    data: {
      ...(name && { name: name.trim() }),
      ...(avatarUrl !== undefined && { avatarUrl: avatarUrl || null }),
    },
  });

  return NextResponse.json(updated);
}
