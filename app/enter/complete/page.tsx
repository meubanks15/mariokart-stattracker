"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PointsDisplay } from "@/components/enter/PointsDisplay";
import type { Round, Player } from "@/lib/types";

export default function CompletePage() {
  const searchParams = useSearchParams();
  const roundId = searchParams.get("roundId");

  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roundId) {
      setError("No round ID provided");
      setLoading(false);
      return;
    }

    async function fetchRound() {
      try {
        const res = await fetch(`/api/rounds/${roundId}`);
        if (!res.ok) throw new Error("Failed to fetch round");
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
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Link href="/enter" className="text-blue-500 hover:underline">
          Start a new round
        </Link>
      </div>
    );
  }

  if (!round) {
    return <div className="text-center py-8">Round not found</div>;
  }

  const players: Player[] = round.roundPlayers.map((rp) => rp.player);
  const winner = round.winnerPlayer;
  const hadOvertime = round.races.some((r) => r.isOvertime);

  return (
    <div className="space-y-8">
      {/* Winner celebration */}
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🏆</div>
        <h1 className="text-3xl font-bold mb-2">Round Complete!</h1>
        {winner && (
          <div className="flex items-center justify-center gap-3 mt-4">
            {winner.avatarUrl ? (
              <img
                src={winner.avatarUrl}
                alt={winner.name}
                className="w-16 h-16 rounded-full object-cover border-4 border-yellow-400"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center text-2xl font-bold text-yellow-800">
                {winner.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <p className="text-sm text-gray-500 dark:text-gray-400">Winner</p>
              <p className="text-2xl font-bold">{winner.name}</p>
            </div>
          </div>
        )}
        {hadOvertime && (
          <p className="text-orange-600 dark:text-orange-400 mt-4 font-medium">
            Won in overtime!
          </p>
        )}
      </div>

      {/* Final standings */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <PointsDisplay players={players} races={round.races} highlightWinner />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/enter"
          className="px-6 py-3 rounded-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white text-center"
        >
          Start New Round
        </Link>
        <Link
          href={`/rounds/${roundId}`}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-center"
        >
          View Round Details
        </Link>
        <Link
          href="/"
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-center"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
