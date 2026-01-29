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

  const getPositionStyle = (index: number, isLeading: boolean, isTied: boolean) => {
    if (highlightWinner && isLeading && !isTied) {
      return "bg-gradient-to-r from-yellow-500/30 to-yellow-600/10 border-2 border-yellow-400";
    }
    switch (index) {
      case 0: return "bg-gradient-to-r from-yellow-900/40 to-transparent border-2 border-yellow-600/50";
      case 1: return "bg-gradient-to-r from-gray-500/30 to-transparent border-2 border-gray-500/50";
      case 2: return "bg-gradient-to-r from-orange-900/40 to-transparent border-2 border-orange-700/50";
      default: return "bg-gradient-to-r from-gray-800/50 to-transparent border-2 border-gray-700";
    }
  };

  const getPositionBadge = (index: number) => {
    switch (index) {
      case 0: return <span className="text-2xl trophy-glow">🥇</span>;
      case 1: return <span className="text-2xl">🥈</span>;
      case 2: return <span className="text-2xl">🥉</span>;
      default: return <span className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-gray-400">{index + 1}</span>;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white flex items-center gap-2"
          style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
        <span className="text-2xl">📊</span>
        STANDINGS
      </h3>

      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const points = playerTotals.get(player.id) ?? 0;
          const isLeading = points === maxPoints && maxPoints > 0;

          return (
            <div
              key={player.id}
              className={`flex items-center justify-between p-4 rounded-xl ${getPositionStyle(index, isLeading, isTied)}`}
            >
              <div className="flex items-center gap-3">
                {getPositionBadge(index)}
                {player.avatarUrl ? (
                  <img
                    src={player.avatarUrl}
                    alt={player.name}
                    className={`w-10 h-10 rounded-full object-cover border-2 ${
                      index === 0 ? "border-yellow-400" : "border-gray-600"
                    }`}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
                    index === 0
                      ? "bg-yellow-400 text-yellow-900 border-yellow-300"
                      : "bg-gradient-to-b from-gray-500 to-gray-600 text-white border-gray-500"
                  }`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="font-bold text-white"
                      style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
                  {player.name}
                </span>
                {isTied && isLeading && (
                  <span className="text-xs px-3 py-1 rounded-full bg-orange-500/30 text-orange-300 font-bold border border-orange-500/50 uppercase">
                    Tied!
                  </span>
                )}
              </div>

              <div className={`text-2xl font-black tabular-nums px-4 py-2 rounded-lg ${
                highlightWinner && isLeading && !isTied
                  ? "bg-yellow-400 text-yellow-900"
                  : index === 0
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "text-white"
              }`}
                   style={highlightWinner && isLeading && !isTied ? {} : { textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
                {points}
                <span className="text-sm font-bold ml-1 opacity-70">pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Race-by-race breakdown */}
      {races.length > 0 && (
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-white font-medium flex items-center gap-2">
            <span>📋</span> View race breakdown
          </summary>
          <div className="mt-3 mk-card p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-700">
                  <th className="text-left py-2 pr-4 text-gray-400 font-bold">RACER</th>
                  {races.map((race) => (
                    <th key={race.id} className="text-center py-2 px-2 text-gray-400 font-bold">
                      {race.isOvertime ? (
                        <span className="text-orange-400">OT</span>
                      ) : (
                        `R${race.raceIndex}`
                      )}
                    </th>
                  ))}
                  <th className="text-right py-2 pl-4 text-yellow-400 font-bold">TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {sortedPlayers.map((player, idx) => (
                  <tr key={player.id} className={`border-b border-gray-700/50 ${idx === 0 ? "bg-yellow-500/10" : ""}`}>
                    <td className="py-3 pr-4 font-bold text-white">{player.name}</td>
                    {races.map((race) => {
                      const result = race.results.find(
                        (r) => r.playerId === player.id
                      );
                      return (
                        <td key={race.id} className="text-center py-3 px-2">
                          {result ? (
                            race.isOvertime ? (
                              <span className={result.finishPosition === 1 ? "text-green-400 font-bold" : "text-gray-400"}>
                                {result.finishPosition === 1 ? "W" : result.finishPosition}
                              </span>
                            ) : (
                              <span className={`font-bold ${
                                (result.pointsAwarded ?? 0) >= 4 ? "text-yellow-300" :
                                (result.pointsAwarded ?? 0) >= 2 ? "text-white" : "text-gray-400"
                              }`}>
                                {result.pointsAwarded ?? 0}
                              </span>
                            )
                          ) : (
                            <span className="text-gray-600">-</span>
                          )}
                        </td>
                      );
                    })}
                    <td className={`text-right py-3 pl-4 font-black text-lg ${idx === 0 ? "text-yellow-400" : "text-white"}`}>
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
