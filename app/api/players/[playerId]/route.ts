import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ playerId: string }> }
) {
  const { playerId } = await params;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      roundPlayers: {
        include: {
          round: {
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
          },
        },
      },
      raceResults: {
        include: {
          race: {
            include: {
              track: {
                select: { id: true, name: true },
              },
              round: {
                select: { id: true, status: true },
              },
            },
          },
        },
      },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Calculate stats from completed rounds only
  const completedRounds = player.roundPlayers.filter(
    (rp) => rp.round.status === "COMPLETED"
  );

  const roundsPlayed = completedRounds.length;
  const wins = completedRounds.filter(
    (rp) => rp.round.winnerPlayerId === player.id
  ).length;
  const winPercentage = roundsPlayed > 0 ? (wins / roundsPlayed) * 100 : 0;

  // Race stats from completed rounds
  const completedRaceResults = player.raceResults.filter(
    (rr) => rr.race.round.status === "COMPLETED" && !rr.race.isOvertime
  );

  const totalPoints = completedRaceResults.reduce(
    (sum, rr) => sum + (rr.pointsAwarded ?? 0),
    0
  );

  const racesRaced = completedRaceResults.length;
  const avgPointsPerRace = racesRaced > 0 ? totalPoints / racesRaced : 0;

  // Position counts
  const firstPlaceRaces = completedRaceResults.filter(
    (rr) => rr.finishPosition === 1
  ).length;
  const secondPlaceRaces = completedRaceResults.filter(
    (rr) => rr.finishPosition === 2
  ).length;
  const thirdPlaceRaces = completedRaceResults.filter(
    (rr) => rr.finishPosition === 3
  ).length;
  const fourthPlaceRaces = completedRaceResults.filter(
    (rr) => rr.finishPosition === 4
  ).length;

  // Track stats - count races per track and wins per track
  const trackStats = new Map<string, { name: string; races: number; firstPlaces: number; totalPoints: number }>();
  for (const rr of completedRaceResults) {
    const trackId = rr.race.track.id;
    const trackName = rr.race.track.name;
    const existing = trackStats.get(trackId) || { name: trackName, races: 0, firstPlaces: 0, totalPoints: 0 };
    existing.races++;
    if (rr.finishPosition === 1) existing.firstPlaces++;
    existing.totalPoints += rr.pointsAwarded ?? 0;
    trackStats.set(trackId, existing);
  }

  // Convert to sorted array (by races played)
  const trackStatsArray = Array.from(trackStats.entries())
    .map(([id, stats]) => ({
      trackId: id,
      trackName: stats.name,
      races: stats.races,
      firstPlaces: stats.firstPlaces,
      totalPoints: stats.totalPoints,
      avgPoints: stats.races > 0 ? Math.round((stats.totalPoints / stats.races) * 100) / 100 : 0,
    }))
    .sort((a, b) => b.races - a.races);

  // Recent rounds (last 10 completed)
  const recentRounds = completedRounds
    .sort((a, b) => new Date(b.round.createdAt).getTime() - new Date(a.round.createdAt).getTime())
    .slice(0, 10)
    .map((rp) => ({
      id: rp.round.id,
      createdAt: rp.round.createdAt,
      won: rp.round.winnerPlayerId === player.id,
      winner: rp.round.winnerPlayer,
      players: rp.round.roundPlayers.map((p) => p.player.name),
      playerPoints: rp.round.races
        .filter((r) => !r.isOvertime)
        .flatMap((r) => r.results)
        .filter((res) => res.playerId === player.id)
        .reduce((sum, res) => sum + (res.pointsAwarded ?? 0), 0),
    }));

  return NextResponse.json({
    id: player.id,
    name: player.name,
    avatarUrl: player.avatarUrl,
    stats: {
      wins,
      roundsPlayed,
      winPercentage: Math.round(winPercentage * 10) / 10,
      totalPoints,
      racesRaced,
      avgPointsPerRace: Math.round(avgPointsPerRace * 100) / 100,
      firstPlaceRaces,
      secondPlaceRaces,
      thirdPlaceRaces,
      fourthPlaceRaces,
    },
    trackStats: trackStatsArray,
    recentRounds,
  });
}
