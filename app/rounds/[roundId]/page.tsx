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
      <div className="min-h-screen checkered-bg flex items-center justify-center">
        <div className="mk-card p-8 text-center">
          <div className="text-xl font-bold text-white">Loading Round...</div>
          <div className="mt-2 text-4xl animate-bounce inline-block">🏎️</div>
        </div>
      </div>
    );
  }

  if (error || !round) {
    return (
      <div className="min-h-screen checkered-bg flex flex-col items-center justify-center gap-4">
        <div className="mk-card p-8 text-center">
          <p className="text-red-400 text-xl font-bold mb-4">{error || "Round not found"}</p>
          <Link href="/" className="mk-button px-6 py-3">
            Back to Home
          </Link>
        </div>
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
    <div className="min-h-screen checkered-bg">
      {/* Header */}
      <header className="mk-header">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white"
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
            MK Stats
          </Link>
          <Link href="/leaderboard" className="text-white/80 hover:text-white font-medium">
            Leaderboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Round header */}
        <div>
          <p className="text-sm text-gray-400">{formatDate(round.createdAt)}</p>
          <h1 className="text-3xl font-black text-white mt-1"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
            ROUND DETAILS
          </h1>
        </div>

        {/* Winner section */}
        {winner && round.status === "COMPLETED" && (
          <div className="mk-card p-6 border-2 border-yellow-400">
            <div className="flex items-center gap-4">
              <span className="text-5xl trophy-glow">🏆</span>
              {winner.avatarUrl ? (
                <img
                  src={winner.avatarUrl}
                  alt={winner.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-yellow-400"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-2xl font-bold text-yellow-800 border-4 border-yellow-300">
                  {winner.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm text-yellow-400 font-bold uppercase">Winner</p>
                <p className="text-2xl font-black text-white"
                   style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                  {winner.name}
                </p>
                {overtimeRace && (
                  <p className="text-sm text-orange-400 font-bold">Won in overtime</p>
                )}
              </div>
            </div>
          </div>
        )}

        {round.status === "DRAFT" && (
          <div className="mk-card p-4 border-2 border-gray-500">
            <p className="text-gray-400 font-medium">This round is incomplete.</p>
          </div>
        )}

        {/* Final standings */}
        <div>
          <h2 className="text-xl font-bold text-white mb-3"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
            FINAL STANDINGS
          </h2>
          <div className="mk-card p-4">
            <PointsDisplay players={players} races={round.races} highlightWinner />
          </div>
        </div>

        {/* Race breakdown */}
        <div>
          <h2 className="text-xl font-bold text-white mb-3"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
            RACE RESULTS
          </h2>
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
          <h2 className="text-xl font-bold text-white mb-3"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
            RACERS
          </h2>
          <div className="flex flex-wrap gap-3">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="mk-card flex items-center gap-2 px-4 py-3 hover:border-yellow-400 transition-colors"
              >
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gray-600"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-lg font-bold text-white">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-white">{player.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Back link */}
        <div className="pt-4 text-center">
          <Link href="/" className="mk-button px-6 py-3">
            Back to Menu
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
    "text-yellow-400",
    "text-gray-300",
    "text-orange-400",
    "text-gray-500",
  ];

  return (
    <div className={`mk-card p-4 ${isOvertime ? "border-2 border-orange-500" : ""}`}>
      <div className="flex items-center gap-4 mb-3">
        <div className={`text-sm font-bold px-3 py-1 rounded-lg ${
          isOvertime
            ? "bg-orange-500 text-white"
            : "bg-blue-500 text-white"
        }`}>
          {isOvertime ? "OVERTIME" : `RACE ${raceNumber}`}
        </div>
        {race.track.imageUrl ? (
          <img
            src={race.track.imageUrl}
            alt={race.track.name}
            className="w-16 h-10 object-cover rounded-lg border-2 border-gray-600"
          />
        ) : null}
        <span className="font-bold text-white">{race.track.name}</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sortedResults.map((result, idx) => (
          <div key={result.playerId} className="flex items-center gap-2 bg-gray-800/50 px-3 py-2 rounded-lg">
            <span className={`font-black text-lg ${positionColors[idx] || "text-gray-400"}`}>
              {result.finishPosition}.
            </span>
            <span className="text-white font-medium">{getPlayerName(result.playerId)}</span>
            {!isOvertime && result.pointsAwarded !== null && (
              <span className="text-gray-400 text-sm ml-auto">+{result.pointsAwarded}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
