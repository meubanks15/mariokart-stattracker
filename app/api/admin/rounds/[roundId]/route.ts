import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyAdminCode, unauthorizedResponse } from "@/lib/admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  if (!verifyAdminCode(request)) return unauthorizedResponse();

  const { roundId } = await params;

  const round = await prisma.round.findUnique({
    where: { id: roundId },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  await prisma.round.delete({
    where: { id: roundId },
  });

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ roundId: string }> }
) {
  if (!verifyAdminCode(request)) return unauthorizedResponse();

  const { roundId } = await params;
  const { status, winnerPlayerId } = await request.json();

  const round = await prisma.round.findUnique({
    where: { id: roundId },
  });

  if (!round) {
    return NextResponse.json({ error: "Round not found" }, { status: 404 });
  }

  // Validate status if provided
  if (status && !["DRAFT", "COMPLETED", "HIDDEN"].includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be DRAFT, COMPLETED, or HIDDEN" },
      { status: 400 }
    );
  }

  // Validate winner if provided
  if (winnerPlayerId) {
    const player = await prisma.player.findUnique({
      where: { id: winnerPlayerId },
    });
    if (!player) {
      return NextResponse.json(
        { error: "Winner player not found" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.round.update({
    where: { id: roundId },
    data: {
      ...(status && { status }),
      ...(winnerPlayerId !== undefined && { winnerPlayerId }),
    },
    include: {
      winnerPlayer: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(updated);
}
