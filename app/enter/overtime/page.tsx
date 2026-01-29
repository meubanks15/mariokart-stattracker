"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrackSelector } from "@/components/enter/TrackSelector";
import { PositionEntry } from "@/components/enter/PositionEntry";
import { PointsDisplay } from "@/components/enter/PointsDisplay";
import type { Round, Player } from "@/lib/types";

function OvertimePageContent() {
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
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Loading Overtime...</div>
        <div className="mt-2 text-4xl animate-bounce inline-block">⚡</div>
      </div>
    );
  }

  if (error && !round) {
    return (
      <div className="mk-card p-8 text-center">
        <p className="text-red-400 text-xl font-bold mb-4">{error}</p>
        <button
          onClick={() => router.push("/enter")}
          className="mk-button px-6 py-3"
        >
          Start New Round
        </button>
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

  if (tiedPlayers.length < 2) {
    return (
      <div className="mk-card p-8 text-center">
        <p className="text-gray-300 mb-4 text-lg">No tie detected. Overtime not needed.</p>
        <button
          onClick={() => router.push(`/enter/summary?roundId=${roundId}`)}
          className="mk-button mk-button-blue px-6 py-3"
        >
          Back to Summary
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3"
            style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.5)" }}>
          <span className="text-4xl">⚡</span>
          OVERTIME
          <span className="text-4xl">⚡</span>
        </h1>
        <p className="text-orange-300 mt-2 font-medium">
          {tiedPlayers.length} players tied with {maxPoints} points. One more race to determine the winner!
        </p>
      </div>

      {/* Current standings */}
      <div className="mk-card p-4">
        <PointsDisplay players={allPlayers} races={round.races} />
      </div>

      {/* Tied players callout */}
      <div className="mk-card p-4 border-2 border-orange-500">
        <h3 className="font-bold text-orange-300 mb-3 text-lg">TIED PLAYERS</h3>
        <div className="flex flex-wrap gap-4">
          {tiedPlayers.map((player) => (
            <div key={player.id} className="flex items-center gap-2 bg-orange-500/20 px-3 py-2 rounded-lg">
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={player.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-orange-400"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-sm font-bold text-white">
                  {player.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="font-bold text-white">{player.name}</span>
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
        <div className="mk-card p-4 border-2 border-red-500 bg-red-500/20">
          <div className="flex items-center gap-2 text-red-300 font-bold">
            <span className="text-xl">⚠️</span>
            {error}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={() => router.push(`/enter/summary?roundId=${roundId}`)}
          className="mk-button px-6 py-3"
        >
          Back
        </button>

        <button
          onClick={handleSaveOvertime}
          disabled={!canSave || saving}
          className={`
            px-8 py-3 rounded-xl font-bold uppercase tracking-wide transition-all
            ${canSave && !saving
              ? "mk-button mk-button-green"
              : "bg-gray-700 border-3 border-gray-600 text-gray-500 cursor-not-allowed"
            }
          `}
          style={canSave && !saving ? {} : { boxShadow: "0 4px 0 #374151" }}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">🏎️</span>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>🏁</span> Finish Round
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function OvertimePage() {
  return (
    <Suspense fallback={
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Loading...</div>
        <div className="mt-2 text-4xl animate-bounce inline-block">⚡</div>
      </div>
    }>
      <OvertimePageContent />
    </Suspense>
  );
}
