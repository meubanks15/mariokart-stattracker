"use client";

import { useState, useEffect } from "react";
import type { Player } from "@/lib/types";

interface PositionEntryProps {
  players: Player[];
  onPositionsChange: (results: Array<{ playerId: string; finishPosition: number }>) => void;
  initialPositions?: Record<string, number>;
}

export function PositionEntry({
  players,
  onPositionsChange,
  initialPositions = {},
}: PositionEntryProps) {
  // positions[playerId] = finishPosition (1-4)
  const [positions, setPositions] = useState<Record<string, number>>(initialPositions);

  useEffect(() => {
    // Convert to array format for parent
    const results = Object.entries(positions)
      .filter(([, pos]) => pos > 0)
      .map(([playerId, finishPosition]) => ({ playerId, finishPosition }));
    onPositionsChange(results);
  }, [positions, onPositionsChange]);

  const assignPosition = (playerId: string, position: number) => {
    setPositions((prev) => {
      const newPositions = { ...prev };

      // Remove this position from any other player
      for (const [pid, pos] of Object.entries(newPositions)) {
        if (pos === position && pid !== playerId) {
          delete newPositions[pid];
        }
      }

      // Assign to this player
      if (newPositions[playerId] === position) {
        // Toggle off if clicking same position
        delete newPositions[playerId];
      } else {
        newPositions[playerId] = position;
      }

      return newPositions;
    });
  };

  const getPositionLabel = (position: number): string => {
    switch (position) {
      case 1: return "1st";
      case 2: return "2nd";
      case 3: return "3rd";
      case 4: return "4th";
      default: return `${position}th`;
    }
  };

  const getPositionClass = (position: number, isSelected: boolean): string => {
    if (!isSelected) return "";
    switch (position) {
      case 1: return "position-1st";
      case 2: return "position-2nd";
      case 3: return "position-3rd";
      case 4: return "position-4th";
      default: return "";
    }
  };

  const getPositionEmoji = (position: number): string => {
    switch (position) {
      case 1: return "🥇";
      case 2: return "🥈";
      case 3: return "🥉";
      case 4: return "4️⃣";
      default: return "";
    }
  };

  const allAssigned = players.every((p) => positions[p.id] > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
          <span className="text-2xl">🏆</span>
          FINISH POSITIONS
        </h2>
        <div className={`px-4 py-2 rounded-lg font-bold ${
          allAssigned
            ? "bg-green-500/20 text-green-400 border-2 border-green-500"
            : "bg-gray-700/50 text-gray-400 border-2 border-gray-600"
        }`}>
          {Object.keys(positions).length} / {players.length} assigned
        </div>
      </div>

      {/* Player list */}
      <div className="mk-card p-4">
        <div className="space-y-3">
          {players.map((player) => {
            const currentPosition = positions[player.id];

            return (
              <div
                key={player.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  currentPosition
                    ? "bg-gradient-to-r from-green-900/30 to-transparent border-2 border-green-500/50"
                    : "bg-gradient-to-r from-gray-800/50 to-transparent border-2 border-gray-700"
                }`}
              >
                {/* Player info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-12 h-12 rounded-full object-cover border-3 border-gray-600"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-b from-gray-500 to-gray-600 flex items-center justify-center text-xl font-bold text-white border-3 border-gray-500">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-bold text-white truncate"
                        style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
                    {player.name}
                  </span>
                  {currentPosition && (
                    <span className="text-2xl ml-2">{getPositionEmoji(currentPosition)}</span>
                  )}
                </div>

                {/* Position buttons */}
                <div className="flex gap-2">
                  {Array.from({ length: players.length }, (_, i) => i + 1).map(
                    (position) => {
                      const isSelected = currentPosition === position;
                      const isUsed =
                        !isSelected &&
                        Object.values(positions).includes(position);

                      return (
                        <button
                          key={position}
                          onClick={() => assignPosition(player.id, position)}
                          disabled={isUsed}
                          className={`
                            w-14 h-14 rounded-xl font-bold text-lg transition-all
                            ${isSelected
                              ? `${getPositionClass(position, isSelected)} shadow-lg transform scale-105`
                              : isUsed
                                ? "bg-gray-800 border-2 border-gray-700 opacity-30 cursor-not-allowed text-gray-600"
                                : "bg-gradient-to-b from-gray-600 to-gray-700 border-2 border-gray-500 hover:border-yellow-400 hover:shadow-lg text-white"
                            }
                          `}
                          style={isSelected ? {} : { boxShadow: "0 3px 0 #374151" }}
                        >
                          {getPositionLabel(position)}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {!allAssigned && (
          <p className="text-sm text-gray-400 text-center mt-4 font-medium">
            Tap a position to assign the finish place for each racer
          </p>
        )}
      </div>
    </div>
  );
}
