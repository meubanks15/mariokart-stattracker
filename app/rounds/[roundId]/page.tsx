"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { PointsDisplay } from "@/components/enter/PointsDisplay";
import type { Round, Player } from "@/lib/types";

export default function RoundDetailPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = use(params);
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRound() {
      try {
        const res = await fetch(`/api/rounds/${roundId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Round not found");
          throw new Error("Failed to fetch round");
        }
        const data = await res.json();
        setRound(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load round");
      } finally {
        setLoading(false);
      }
    }
    fetchRound();
  }, [roundId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading round...</p>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Round not found"}</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  const players: Player[] = round.roundPlayers.map((rp) => rp.player);
  const winner = round.winnerPlayer;
  const regularRaces = round.races.filter((r) => !r.isOvertime);
  const overtimeRace = round.races.find((r) => r.isOvertime);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">MK Stats</Link>
          <Link href="/leaderboard" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            Leaderboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Round header */}
        <div>
          <p className="text-sm text-gray-500">{formatDate(round.createdAt)}</p>
          <h1 className="text-2xl font-bold mt-1">Round Details</h1>
        </div>

        {/* Winner section */}
        {winner && round.status === "COMPLETED" && (
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center gap-4">
              <span className="text-4xl">🏆</span>
              {winner.avatarUrl ? (
                <img
                  src={winner.avatarUrl}
                  alt={winner.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-yellow-400"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-yellow-400 flex items-center justify-center text-xl font-bold text-yellow-800">
                  {winner.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Winner</p>
                <p className="text-xl font-bold">{winner.name}</p>
                {overtimeRace && (
                  <p className="text-sm text-orange-600 dark:text-orange-400">Won in overtime</p>
                )}
              </div>
            </div>
          </div>
        )}

        {round.status === "DRAFT" && (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400">This round is incomplete.</p>
          </div>
        )}

        {/* Final standings */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Final Standings</h2>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <PointsDisplay players={players} races={round.races} highlightWinner />
          </div>
        </div>

        {/* Race breakdown */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Race Results</h2>
          <div className="space-y-4">
            {regularRaces.map((race, index) => (
              <RaceCard key={race.id} race={race} raceNumber={index + 1} players={players} />
            ))}
            {overtimeRace && (
              <RaceCard race={overtimeRace} raceNumber="OT" players={players} isOvertime />
            )}
          </div>
        </div>

        {/* Players */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Players</h2>
          <div className="flex flex-wrap gap-3">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-semibold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium">{player.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="pt-4">
          <Link
            href="/"
            className="text-blue-500 hover:underline"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}

interface RaceResult {
  playerId: string;
  finishPosition: number;
  pointsAwarded: number | null;
}

interface Race {
  id: string;
  trackId: string;
  track: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
  results: RaceResult[];
  isOvertime: boolean;
}

function RaceCard({
  race,
  raceNumber,
  players,
  isOvertime = false,
}: {
  race: Race;
  raceNumber: number | string;
  players: Player[];
  isOvertime?: boolean;
}) {
  const sortedResults = [...race.results].sort((a, b) => a.finishPosition - b.finishPosition);

  const getPlayerName = (playerId: string) => {
    return players.find((p) => p.id === playerId)?.name ?? "Unknown";
  };

  const positionColors = [
    "text-yellow-600 dark:text-yellow-400",
    "text-gray-500 dark:text-gray-400",
    "text-orange-600 dark:text-orange-400",
    "text-gray-400 dark:text-gray-500",
  ];

  return (
    <div className={`p-4 rounded-lg ${isOvertime ? "bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800" : "bg-gray-50 dark:bg-gray-800"}`}>
      <div className="flex items-center gap-4 mb-3">
        <div className={`text-sm font-semibold px-2 py-1 rounded ${isOvertime ? "bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200" : "bg-gray-200 dark:bg-gray-700"}`}>
          {isOvertime ? "OT" : `Race ${raceNumber}`}
        </div>
        {race.track.imageUrl ? (
          <img
            src={race.track.imageUrl}
            alt={race.track.name}
            className="w-16 h-10 object-cover rounded"
          />
        ) : null}
        <span className="font-medium">{race.track.name}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {sortedResults.map((result, idx) => (
          <div key={result.playerId} className="flex items-center gap-2">
            <span className={`font-bold ${positionColors[idx] || ""}`}>
              {result.finishPosition}.
            </span>
            <span className="text-sm">{getPlayerName(result.playerId)}</span>
            {!isOvertime && result.pointsAwarded !== null && (
              <span className="text-xs text-gray-500">+{result.pointsAwarded}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
