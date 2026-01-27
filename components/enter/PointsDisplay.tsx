"use client";

import type { Player, Race } from "@/lib/types";

interface PointsDisplayProps {
  players: Player[];
  races: Race[];
  highlightWinner?: boolean;
}

export function PointsDisplay({
  players,
  races,
  highlightWinner = false,
}: PointsDisplayProps) {
  // Calculate total points for each player
  const playerTotals = new Map<string, number>();

  for (const player of players) {
    playerTotals.set(player.id, 0);
  }

  for (const race of races) {
    if (!race.isOvertime) {
      for (const result of race.results) {
        const current = playerTotals.get(result.playerId) ?? 0;
        playerTotals.set(result.playerId, current + (result.pointsAwarded ?? 0));
      }
    }
  }

  // Sort players by points (descending)
  const sortedPlayers = [...players].sort((a, b) => {
    const aPoints = playerTotals.get(a.id) ?? 0;
    const bPoints = playerTotals.get(b.id) ?? 0;
    return bPoints - aPoints;
  });

  // Find max points for highlighting
  const maxPoints = Math.max(...Array.from(playerTotals.values()));
  const leadingPlayers = sortedPlayers.filter(
    (p) => playerTotals.get(p.id) === maxPoints
  );
  const isTied = leadingPlayers.length > 1 && maxPoints > 0;

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Standings</h3>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const points = playerTotals.get(player.id) ?? 0;
          const isLeading = points === maxPoints && maxPoints > 0;

          return (
            <div
              key={player.id}
              className={`
                flex items-center justify-between p-3 rounded-lg
                ${highlightWinner && isLeading && !isTied
                  ? "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700"
                  : "bg-gray-50 dark:bg-gray-800"
                }
              `}
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-gray-500 font-mono">{index + 1}.</span>
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
                {isTied && isLeading && (
                  <span className="text-xs px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300">
                    TIED
                  </span>
                )}
              </div>

              <span className={`
                text-xl font-bold tabular-nums
                ${highlightWinner && isLeading && !isTied
                  ? "text-yellow-700 dark:text-yellow-300"
                  : ""
                }
              `}>
                {points} pts
              </span>
            </div>
          );
        })}
      </div>

      {/* Race-by-race breakdown */}
      {races.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            View race breakdown
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 pr-4">Player</th>
                  {races.map((race) => (
                    <th key={race.id} className="text-center py-2 px-2">
                      {race.isOvertime ? "OT" : `R${race.raceIndex}`}
                    </th>
                  ))}
                  <th className="text-right py-2 pl-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player) => (
                  <tr key={player.id} className="border-b dark:border-gray-700">
                    <td className="py-2 pr-4 font-medium">{player.name}</td>
                    {races.map((race) => {
                      const result = race.results.find(
                        (r) => r.playerId === player.id
                      );
                      return (
                        <td key={race.id} className="text-center py-2 px-2">
                          {result ? (
                            race.isOvertime ? (
                              <span>{result.finishPosition === 1 ? "W" : result.finishPosition}</span>
                            ) : (
                              <span>{result.pointsAwarded ?? 0}</span>
                            )
                          ) : (
                            "-"
                          )}
                        </td>
                      );
                    })}
                    <td className="text-right py-2 pl-4 font-bold">
                      {playerTotals.get(player.id) ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
