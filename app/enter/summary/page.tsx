"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PointsDisplay } from "@/components/enter/PointsDisplay";
import type { Round, Player } from "@/lib/types";

function SummaryPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roundId = searchParams.get("roundId");

  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);

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

  const handleComplete = async () => {
    if (!roundId) return;

    setCompleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/rounds/${roundId}/complete`, {
        method: "POST",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to complete round");
      }

      const data = await res.json();

      if (data.isTied) {
        // Go to overtime
        router.push(`/enter/overtime?roundId=${roundId}`);
      } else {
        // Round complete, go to confirmation
        router.push(`/enter/complete?roundId=${roundId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (error && !round) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => router.push("/enter")}
          className="text-blue-500 hover:underline"
        >
          Start a new round
        </button>
      </div>
    );
  }

  if (!round) {
    return <div className="text-center py-8">Round not found</div>;
  }

  const players: Player[] = round.roundPlayers.map((rp) => rp.player);
  const regularRaces = round.races.filter((r) => !r.isOvertime);
  const hasAllRaces = regularRaces.length >= 4;

  // Calculate totals to check for tie
  const playerTotals = new Map<string, number>();
  for (const player of players) {
    playerTotals.set(player.id, 0);
  }
  for (const race of regularRaces) {
    for (const result of race.results) {
      const current = playerTotals.get(result.playerId) ?? 0;
      playerTotals.set(result.playerId, current + (result.pointsAwarded ?? 0));
    }
  }

  const maxPoints = Math.max(...Array.from(playerTotals.values()));
  const leaders = Array.from(playerTotals.entries()).filter(
    ([, points]) => points === maxPoints
  );
  const isTied = leaders.length > 1;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Round Summary</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Review the results before finalizing.
        </p>
      </div>

      {!hasAllRaces && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg">
          <p className="font-semibold">Incomplete Round</p>
          <p className="text-sm mt-1">
            Only {regularRaces.length} of 4 races completed. Complete all races to finalize.
          </p>
        </div>
      )}

      {isTied && hasAllRaces && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg">
          <p className="font-semibold">Tie Detected!</p>
          <p className="text-sm mt-1">
            {leaders.length} players are tied with {maxPoints} points. An overtime race is needed.
          </p>
        </div>
      )}

      <PointsDisplay players={players} races={round.races} highlightWinner={!isTied} />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => router.push(`/enter/race/4?roundId=${roundId}`)}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Back to Race 4
        </button>

        <button
          onClick={handleComplete}
          disabled={!hasAllRaces || completing}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${hasAllRaces && !completing
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {completing
            ? "Processing..."
            : isTied
              ? "Continue to Overtime"
              : "Complete Round"
          }
        </button>
      </div>
    </div>
  );
}

export default function SummaryPage() {
  return (
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <SummaryPageContent />
    </Suspense>
  );
}
