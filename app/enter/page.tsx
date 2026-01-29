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
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3"
            style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.5)" }}>
          <span className="text-4xl">🏁</span>
          NEW GRAND PRIX
          <span className="text-4xl">🏁</span>
        </h1>
        <p className="text-gray-400 mt-2 font-medium">
          Select 2-4 racers to compete
        </p>
      </div>

      <PlayerSelector onSelectionChange={setSelectedPlayerIds} />

      {error && (
        <div className="mk-card p-4 border-2 border-red-500 bg-red-500/20">
          <div className="flex items-center gap-2 text-red-300 font-bold">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button
          onClick={handleStartRound}
          disabled={!canStart || loading}
          className={`
            px-10 py-4 rounded-xl font-bold text-xl uppercase tracking-wide transition-all
            ${canStart && !loading
              ? "mk-button mk-button-green"
              : "bg-gray-700 border-3 border-gray-600 text-gray-500 cursor-not-allowed"
            }
          `}
          style={canStart && !loading ? {} : { boxShadow: "0 4px 0 #374151" }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">🏎️</span>
              Starting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>🚦</span>
              Start Race!
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
