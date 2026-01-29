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
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Loading Racers...</div>
        <div className="mt-2 text-4xl animate-bounce inline-block">🏎️</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-red-400">{error}</div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white mb-2">No racers found!</div>
        <div className="text-gray-400">Add some players in the Admin panel first.</div>
      </div>
    );
  }

  const isValid = selected.size >= minPlayers && selected.size <= maxPlayers;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
          <span className="text-2xl">👥</span>
          SELECT RACERS
        </h2>
        <div className={`px-4 py-2 rounded-lg font-bold ${
          isValid
            ? "bg-green-500/20 text-green-400 border-2 border-green-500"
            : "bg-gray-700/50 text-gray-400 border-2 border-gray-600"
        }`}>
          {selected.size} / {maxPlayers} selected
          {selected.size < minPlayers && (
            <span className="ml-2 text-yellow-400">
              (need {minPlayers - selected.size} more)
            </span>
          )}
        </div>
      </div>

      {/* Player grid */}
      <div className="mk-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {players.map((player) => {
            const isSelected = selected.has(player.id);
            const isDisabled = !isSelected && selected.size >= maxPlayers;

            return (
              <button
                key={player.id}
                onClick={() => togglePlayer(player.id)}
                disabled={isDisabled}
                className={`
                  mk-select-card p-4 text-center relative
                  ${isSelected ? "selected" : ""}
                  ${isDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}
                `}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white font-bold shadow-lg">
                    ✓
                  </div>
                )}

                {/* Avatar */}
                <div className="flex justify-center mb-3">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className={`w-16 h-16 rounded-full object-cover border-4 ${
                        isSelected ? "border-yellow-400" : "border-gray-600"
                      }`}
                    />
                  ) : (
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${
                      isSelected
                        ? "bg-yellow-400 text-yellow-900 border-yellow-300"
                        : "bg-gradient-to-b from-gray-500 to-gray-600 text-white border-gray-500"
                    }`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name */}
                <span className="font-bold text-white block truncate"
                      style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
                  {player.name}
                </span>

                {/* Status */}
                {isSelected && (
                  <div className="mt-2 text-xs font-bold text-green-400 uppercase tracking-wide">
                    Ready!
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
