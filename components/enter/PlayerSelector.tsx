"use client";

import { useState, useEffect } from "react";
import type { Player } from "@/lib/types";

interface PlayerSelectorProps {
  onSelectionChange: (playerIds: string[]) => void;
  initialSelected?: string[];
  minPlayers?: number;
  maxPlayers?: number;
}

export function PlayerSelector({
  onSelectionChange,
  initialSelected = [],
  minPlayers = 2,
  maxPlayers = 4,
}: PlayerSelectorProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const res = await fetch("/api/players");
        if (!res.ok) throw new Error("Failed to fetch players");
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load players");
      } finally {
        setLoading(false);
      }
    }
    fetchPlayers();
  }, []);

  const togglePlayer = (playerId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else if (newSelected.size < maxPlayers) {
      newSelected.add(playerId);
    }
    setSelected(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  if (loading) {
    return <div className="text-center py-8">Loading players...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (players.length === 0) {
    return <div className="text-center py-8">No players found. Add some players first.</div>;
  }

  const isValid = selected.size >= minPlayers && selected.size <= maxPlayers;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Select Players</h2>
        <span className={`text-sm ${isValid ? "text-green-600" : "text-gray-500"}`}>
          {selected.size} / {maxPlayers} selected
          {selected.size < minPlayers && ` (need at least ${minPlayers})`}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {players.map((player) => {
          const isSelected = selected.has(player.id);
          const isDisabled = !isSelected && selected.size >= maxPlayers;

          return (
            <button
              key={player.id}
              onClick={() => togglePlayer(player.id)}
              disabled={isDisabled}
              className={`
                p-4 rounded-lg border-2 transition-all text-left
                ${isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <div className="flex items-center gap-3">
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-lg font-semibold">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-medium truncate">{player.name}</span>
              </div>
              {isSelected && (
                <div className="mt-2 text-xs text-blue-600 dark:text-blue-400">
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
