"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface PlayerStats {
  id: string;
  name: string;
  avatarUrl: string | null;
  wins: number;
  roundsPlayed: number;
  winPercentage: number;
  totalPoints: number;
  racesRaced: number;
  avgPointsPerRace: number;
  firstPlaceRaces: number;
  secondPlaceRaces: number;
  thirdPlaceRaces: number;
  podiumFinishes: number;
}

type SortKey = keyof Omit<PlayerStats, "id" | "name" | "avatarUrl">;

const SORT_OPTIONS: { key: SortKey; label: string; description: string }[] = [
  { key: "wins", label: "Wins", description: "Total round wins" },
  { key: "roundsPlayed", label: "Rounds", description: "Rounds played" },
  { key: "winPercentage", label: "Win %", description: "Win percentage" },
  { key: "totalPoints", label: "Points", description: "Total points scored" },
  { key: "avgPointsPerRace", label: "Avg Pts", description: "Average points per race" },
  { key: "firstPlaceRaces", label: "1st", description: "First place race finishes" },
  { key: "podiumFinishes", label: "Podiums", description: "Top 3 race finishes" },
];

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("wins");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch("/api/leaderboard");
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const sortedPlayers = useMemo(() => {
    return [...players].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (sortAsc) {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    });
  }, [players, sortKey, sortAsc]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (columnKey !== sortKey) return null;
    return (
      <span className="ml-1">
        {sortAsc ? "↑" : "↓"}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error}</p>
        <Link href="/" className="text-blue-500 hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">MK Stats</Link>
          <h1 className="text-lg font-semibold">Leaderboard</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {players.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No completed rounds yet.</p>
            <Link href="/enter" className="text-blue-500 hover:underline">
              Start a round
            </Link>
          </div>
        ) : (
          <>
            {/* Sort buttons for mobile */}
            <div className="mb-4 sm:hidden">
              <label className="text-sm text-gray-500 block mb-2">Sort by:</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Desktop table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-2 font-semibold">#</th>
                    <th className="text-left py-3 px-2 font-semibold">Player</th>
                    {SORT_OPTIONS.map((opt) => (
                      <th
                        key={opt.key}
                        onClick={() => handleSort(opt.key)}
                        className="text-right py-3 px-2 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        title={opt.description}
                      >
                        <span className="hidden sm:inline">{opt.label}</span>
                        <span className="sm:hidden">{opt.label.slice(0, 3)}</span>
                        <SortIcon columnKey={opt.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => (
                    <tr
                      key={player.id}
                      className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="py-3 px-2 text-gray-500 font-mono">
                        {index + 1}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-3">
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
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        <span className={sortKey === "wins" ? "font-bold" : ""}>
                          {player.wins}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        <span className={sortKey === "roundsPlayed" ? "font-bold" : ""}>
                          {player.roundsPlayed}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        <span className={sortKey === "winPercentage" ? "font-bold" : ""}>
                          {player.winPercentage}%
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        <span className={sortKey === "totalPoints" ? "font-bold" : ""}>
                          {player.totalPoints}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        <span className={sortKey === "avgPointsPerRace" ? "font-bold" : ""}>
                          {player.avgPointsPerRace}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        <span className={sortKey === "firstPlaceRaces" ? "font-bold" : ""}>
                          {player.firstPlaceRaces}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right tabular-nums">
                        <span className={sortKey === "podiumFinishes" ? "font-bold" : ""}>
                          {player.podiumFinishes}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </>
        )}
      </main>
    </div>
  );
}
