"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PointsDisplay } from "@/components/enter/PointsDisplay";
import type { Round, Player } from "@/lib/types";

function CompletePageContent() {
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
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Loading Results...</div>
        <div className="mt-2 text-4xl animate-bounce inline-block">🏆</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mk-card p-8 text-center">
        <p className="text-red-400 text-xl font-bold mb-4">{error}</p>
        <Link href="/enter" className="mk-button px-6 py-3">
          Start New Round
        </Link>
      </div>
    );
  }

  if (!round) {
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Round not found</div>
      </div>
    );
  }

  const players: Player[] = round.roundPlayers.map((rp) => rp.player);
  const winner = round.winnerPlayer;
  const hadOvertime = round.races.some((r) => r.isOvertime);

  return (
    <div className="space-y-8">
      {/* Winner celebration */}
      <div className="text-center py-8">
        <div className="text-8xl mb-4 trophy-glow">🏆</div>
        <h1 className="text-4xl font-black text-white mb-2"
            style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.5)" }}>
          ROUND COMPLETE!
        </h1>
        {winner && (
          <div className="flex items-center justify-center gap-4 mt-6">
            {winner.avatarUrl ? (
              <img
                src={winner.avatarUrl}
                alt={winner.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400 shadow-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-yellow-400 flex items-center justify-center text-3xl font-bold text-yellow-800 border-4 border-yellow-300">
                {winner.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <p className="text-sm text-yellow-400 font-bold uppercase tracking-wide">Winner</p>
              <p className="text-3xl font-black text-white"
                 style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                {winner.name}
              </p>
            </div>
          </div>
        )}
        {hadOvertime && (
          <p className="text-orange-400 mt-4 font-bold text-lg">
            Won in overtime!
          </p>
        )}
      </div>

      {/* Final standings */}
      <div className="mk-card p-4">
        <PointsDisplay players={players} races={round.races} highlightWinner />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Link href="/enter" className="mk-button mk-button-blue px-8 py-4 text-center text-lg">
          New Round
        </Link>
        <Link href={`/rounds/${roundId}`} className="mk-button mk-button-yellow px-8 py-4 text-center text-lg">
          View Details
        </Link>
        <Link href="/" className="mk-button px-8 py-4 text-center text-lg">
          Home
        </Link>
      </div>
    </div>
  );
}

export default function CompletePage() {
  return (
    <Suspense fallback={
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Loading...</div>
        <div className="mt-2 text-4xl animate-bounce inline-block">🏆</div>
      </div>
    }>
      <CompletePageContent />
    </Suspense>
  );
}
