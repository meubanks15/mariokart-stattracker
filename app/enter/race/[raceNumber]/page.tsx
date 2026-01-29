"use client";

import { useState, useEffect, useCallback, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TrackSelector } from "@/components/enter/TrackSelector";
import { PositionEntry } from "@/components/enter/PositionEntry";
import { PointsDisplay } from "@/components/enter/PointsDisplay";
import type { Round, Player } from "@/lib/types";

function EnterRacePageContent({
  raceNumber,
}: {
  raceNumber: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roundId = searchParams.get("roundId");

  const raceIndex = parseInt(raceNumber, 10);

  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [positions, setPositions] = useState<Array<{ playerId: string; finishPosition: number }>>([]);
  const [saving, setSaving] = useState(false);

  // Fetch round data
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

        // Pre-fill if this race already exists
        const existingRace = data.races.find((r: { raceIndex: number }) => r.raceIndex === raceIndex);
        if (existingRace) {
          setSelectedTrackId(existingRace.trackId);
          setPositions(
            existingRace.results.map((r: { playerId: string; finishPosition: number }) => ({
              playerId: r.playerId,
              finishPosition: r.finishPosition,
            }))
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load round");
      } finally {
        setLoading(false);
      }
    }

    fetchRound();
  }, [roundId, raceIndex]);

  const handlePositionsChange = useCallback(
    (results: Array<{ playerId: string; finishPosition: number }>) => {
      setPositions(results);
    },
    []
  );

  const players: Player[] = round?.roundPlayers.map((rp) => rp.player) ?? [];
  const canSave = selectedTrackId && positions.length === players.length;

  // Get track IDs already used in other races
  const usedTrackIds = round?.races
    .filter((r) => r.raceIndex !== raceIndex)
    .map((r) => r.trackId) ?? [];

  const handleSaveRace = async () => {
    if (!canSave || !roundId) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/rounds/${roundId}/races/${raceIndex}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: selectedTrackId,
          results: positions,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save race");
      }

      // Navigate to next race or summary
      if (raceIndex < 4) {
        router.push(`/enter/race/${raceIndex + 1}?roundId=${roundId}`);
      } else {
        router.push(`/enter/summary?roundId=${roundId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Loading Race {raceIndex}...</div>
        <div className="mt-2 text-4xl animate-bounce inline-block">🏎️</div>
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

  // Check if we can enter this race
  const completedRaces = round.races.filter((r) => !r.isOvertime).length;
  if (raceIndex > completedRaces + 1) {
    return (
      <div className="mk-card p-8 text-center">
        <p className="text-gray-400 mb-4 text-lg">
          Please complete Race {completedRaces + 1} first.
        </p>
        <button
          onClick={() => router.push(`/enter/race/${completedRaces + 1}?roundId=${roundId}`)}
          className="mk-button mk-button-blue px-6 py-3"
        >
          Go to Race {completedRaces + 1}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Race header */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-white flex items-center justify-center gap-3"
            style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.5)" }}>
          <span className="text-4xl">🏎️</span>
          RACE {raceIndex}
          <span className="text-4xl">🏎️</span>
        </h1>
        <p className="text-gray-400 mt-2 font-medium">
          Select a course and enter finish positions
        </p>
      </div>

      {/* Current standings */}
      {round.races.length > 0 && (
        <div className="mk-card p-4">
          <PointsDisplay players={players} races={round.races} />
        </div>
      )}

      {/* Track selection */}
      <TrackSelector
        onSelect={setSelectedTrackId}
        selectedTrackId={selectedTrackId}
        excludeTrackIds={usedTrackIds}
      />

      {/* Position entry */}
      {selectedTrackId && (
        <PositionEntry
          players={players}
          onPositionsChange={handlePositionsChange}
          initialPositions={Object.fromEntries(
            positions.map((p) => [p.playerId, p.finishPosition])
          )}
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
          onClick={() => {
            if (raceIndex === 1) {
              router.push("/enter");
            } else {
              router.push(`/enter/race/${raceIndex - 1}?roundId=${roundId}`);
            }
          }}
          className="mk-button px-6 py-3"
        >
          Back
        </button>

        <button
          onClick={handleSaveRace}
          disabled={!canSave || saving}
          className={`
            px-8 py-3 rounded-xl font-bold uppercase tracking-wide transition-all
            ${canSave && !saving
              ? "mk-button mk-button-blue"
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
          ) : raceIndex < 4 ? (
            <span className="flex items-center gap-2">
              Next Race <span>→</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>🏁</span> Finish
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default function EnterRacePage({
  params,
}: {
  params: Promise<{ raceNumber: string }>;
}) {
  const { raceNumber } = use(params);
  return (
    <Suspense fallback={
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Loading...</div>
        <div className="mt-2 text-4xl animate-bounce inline-block">🏎️</div>
      </div>
    }>
      <EnterRacePageContent raceNumber={raceNumber} />
    </Suspense>
  );
}
