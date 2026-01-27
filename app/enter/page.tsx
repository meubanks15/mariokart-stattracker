"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlayerSelector } from "@/components/enter/PlayerSelector";

export default function EnterPage() {
  const router = useRouter();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canStart = selectedPlayerIds.length >= 2 && selectedPlayerIds.length <= 4;

  const handleStartRound = async () => {
    if (!canStart) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/rounds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerIds: selectedPlayerIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create round");
      }

      const { roundId } = await res.json();
      router.push(`/enter/race/1?roundId=${roundId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">New Round</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Select 2-4 players to start a new round.
        </p>
      </div>

      <PlayerSelector onSelectionChange={setSelectedPlayerIds} />

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={handleStartRound}
          disabled={!canStart || loading}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${canStart && !loading
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {loading ? "Creating..." : "Start Round"}
        </button>
      </div>
    </div>
  );
}
