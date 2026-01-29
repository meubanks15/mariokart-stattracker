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

  // Check if we can enter this race
  const completedRaces = round.races.filter((r) => !r.isOvertime).length;
  if (raceIndex > completedRaces + 1) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">
          Please complete race {completedRaces + 1} first.
        </p>
        <button
          onClick={() => router.push(`/enter/race/${completedRaces + 1}?roundId=${roundId}`)}
          className="text-blue-500 hover:underline"
        >
          Go to Race {completedRaces + 1}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Race {raceIndex}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Select a track and enter finish positions.
        </p>
      </div>

      {/* Current standings */}
      {round.races.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
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
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex justify-between">
        <button
          onClick={() => {
            if (raceIndex === 1) {
              router.push("/enter");
            } else {
              router.push(`/enter/race/${raceIndex - 1}?roundId=${roundId}`);
            }
          }}
          className="px-6 py-3 rounded-lg font-semibold border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          Back
        </button>

        <button
          onClick={handleSaveRace}
          disabled={!canSave || saving}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-all
            ${canSave && !saving
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }
          `}
        >
          {saving
            ? "Saving..."
            : raceIndex < 4
              ? "Save & Next Race"
              : "Save & View Summary"
          }
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
    <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
      <EnterRacePageContent raceNumber={raceNumber} />
    </Suspense>
  );
}
