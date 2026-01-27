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

  const allAssigned = players.every((p) => positions[p.id] > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Enter Positions</h2>
        <span className={`text-sm ${allAssigned ? "text-green-600" : "text-gray-500"}`}>
          {Object.keys(positions).length} / {players.length} assigned
        </span>
      </div>

      <div className="space-y-3">
        {players.map((player) => {
          const currentPosition = positions[player.id];

          return (
            <div
              key={player.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center gap-3 flex-1">
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
                <span className="font-medium">{player.name}</span>
              </div>

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
                          w-12 h-12 rounded-lg border-2 font-semibold transition-all
                          ${isSelected
                            ? position === 1
                              ? "border-yellow-500 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200"
                              : "border-blue-500 bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
                            : isUsed
                              ? "border-gray-200 dark:border-gray-700 opacity-30 cursor-not-allowed"
                              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
                          }
                        `}
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
        <p className="text-sm text-gray-500 text-center">
          Click a position button to assign that finish position to a player.
        </p>
      )}
    </div>
  );
}
