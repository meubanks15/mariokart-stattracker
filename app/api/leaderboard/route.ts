import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Get all players with their round participation and wins
  const players = await prisma.player.findMany({
    include: {
      roundPlayers: {
        include: {
          round: {
            select: {
              id: true,
              status: true,
              winnerPlayerId: true,
            },
          },
        },
      },
      raceResults: {
        include: {
          race: {
            select: {
              isOvertime: true,
              round: {
                select: {
                  status: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Define types based on the query result
  type Player = (typeof players)[number];
  type RoundPlayer = Player["roundPlayers"][number];
  type RaceResult = Player["raceResults"][number];

  const leaderboard = players.map((player: Player) => {
    // Only count completed rounds
    const completedRounds = player.roundPlayers.filter(
      (rp: RoundPlayer) => rp.round.status === "COMPLETED"
    );

    const roundsPlayed = completedRounds.length;
    const wins = completedRounds.filter(
      (rp: RoundPlayer) => rp.round.winnerPlayerId === player.id
    ).length;

    const winPercentage = roundsPlayed > 0 ? (wins / roundsPlayed) * 100 : 0;

    // Calculate race stats from completed rounds only
    const completedRaceResults = player.raceResults.filter(
      (rr: RaceResult) => rr.race.round.status === "COMPLETED" && !rr.race.isOvertime
    );

    const totalPoints = completedRaceResults.reduce(
      (sum: number, rr: RaceResult) => sum + (rr.pointsAwarded ?? 0),
      0
    );

    const racesRaced = completedRaceResults.length;
    const avgPointsPerRace = racesRaced > 0 ? totalPoints / racesRaced : 0;

    // Count podium finishes (1st, 2nd, 3rd place in races)
    const firstPlaceRaces = completedRaceResults.filter(
      (rr: RaceResult) => rr.finishPosition === 1
    ).length;
    const secondPlaceRaces = completedRaceResults.filter(
      (rr: RaceResult) => rr.finishPosition === 2
    ).length;
    const thirdPlaceRaces = completedRaceResults.filter(
      (rr: RaceResult) => rr.finishPosition === 3
    ).length;
    const podiumFinishes = firstPlaceRaces + secondPlaceRaces + thirdPlaceRaces;

    return {
      id: player.id,
      name: player.name,
      avatarUrl: player.avatarUrl,
      wins,
      roundsPlayed,
      winPercentage: Math.round(winPercentage * 10) / 10,
      totalPoints,
      racesRaced,
      avgPointsPerRace: Math.round(avgPointsPerRace * 100) / 100,
      firstPlaceRaces,
      secondPlaceRaces,
      thirdPlaceRaces,
      podiumFinishes,
    };
  });

  return NextResponse.json(leaderboard);
}
