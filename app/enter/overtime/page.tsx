"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrackSelector } from "@/components/enter/TrackSelector";
import { PositionEntry } from "@/components/enter/PositionEntry";
import { PointsDisplay } from "@/components/enter/PointsDisplay";
import type { Round, Player } from "@/lib/types";

export default function OvertimePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roundId = searchParams.get("roundId");

  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Array<{ playerId: string; finishPosition: number }>>([]);
  const [saving, setSaving] = useState(false);

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

  const handlePositionsChange = useCallback(
    (results: Array<{ playerId: string; finishPosition: number }>) => {
      setPositions(results);
    },
    []
  );

  // Get players and determine tied players
  const allPlayers: Player[] = round?.roundPlayers.map((rp) => rp.player) ?? [];
  const regularRaces = round?.races.filter((r) => !r.isOvertime) ?? [];

  // Calculate totals to find tied players
  const playerTotals = new Map<string, number>();
  for (const player of allPlayers) {
    playerTotals.set(player.id, 0);
  }
  for (const race of regularRaces) {
    for (const result of race.results) {
      const current = playerTotals.get(result.playerId) ?? 0;
      playerTotals.set(result.playerId, current + (result.pointsAwarded ?? 0));
    }
  }

  const maxPoints = Math.max(...Array.from(playerTotals.values()));
  const tiedPlayerIds = Array.from(playerTotals.entries())
    .filter(([, points]) => points === maxPoints)
    .map(([id]) => id);

  const tiedPlayers = allPlayers.filter((p) => tiedPlayerIds.includes(p.id));

  // Get track IDs already used
  const usedTrackIds = round?.races.map((r) => r.trackId) ?? [];

  const canSave = selectedTrackId && positions.length === tiedPlayers.length;

  const handleSaveOvertime = async () => {
    if (!canSave || !roundId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/rounds/${roundId}/overtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selectedTrackId,
          results: positions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save overtime");
      }

      // Go to completion page
      router.push(`/enter/complete?roundId=${roundId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
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

  if (tiedPlayers.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No tie detected. Overtime not needed.</p>
        <button
          onClick={() => router.push(`/enter/summary?roundId=${roundId}`)}
          className="text-blue-500 hover:underline"
        >
          Back to Summary
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Overtime</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {tiedPlayers.length} players tied with {maxPoints} points. One more race to determine the winner!
        </p>
      </div>

      {/* Current standings */}
      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
        <PointsDisplay players={allPlayers} races={round.races} />
      </div>

      {/* Tied players callout */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold mb-2">Tied Players</h3>
        <div className="flex gap-4">
          {tiedPlayers.map((player) => (
            <div key={player.id} className="flex items-center gap-2">
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
            </div>
          ))}
        </div>
      </div>

      {/* Track selection */}
      <TrackSelector
        onSelect={setSelectedTrackId}
        selectedTrackId={selectedTrackId}
        excludeTrackIds={usedTrackIds}
      />

      {/* Position entry - only for tied players */}
      {selectedTrackId && (
        <PositionEntry
          players={tiedPlayers}
          onPositionsChange={handlePositionsChange}
        />
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => router.push(`/enter/summary?roundId=${roundId}`)}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Back to Summary
        </button>

        <button
          onClick={handleSaveOvertime}
          disabled={!canSave || saving}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${canSave && !saving
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {saving ? "Saving..." : "Finish Round"}
        </button>
      </div>
    </div>
  );
}
