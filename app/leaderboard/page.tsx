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
}

type SortKey = "wins" | "roundsPlayed" | "winPercentage";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "wins", label: "Wins" },
  { key: "roundsPlayed", label: "Rounds" },
  { key: "winPercentage", label: "Win %" },
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

  const getPositionDisplay = (index: number) => {
    switch (index) {
      case 0: return <span className="text-2xl trophy-glow">🥇</span>;
      case 1: return <span className="text-2xl">🥈</span>;
      case 2: return <span className="text-2xl">🥉</span>;
      default: return <span className="text-gray-400 font-bold">{index + 1}</span>;
    }
  };

  const getRowStyle = (index: number) => {
    switch (index) {
      case 0: return "bg-gradient-to-r from-yellow-500/20 to-transparent border-l-4 border-yellow-400";
      case 1: return "bg-gradient-to-r from-gray-400/20 to-transparent border-l-4 border-gray-400";
      case 2: return "bg-gradient-to-r from-orange-600/20 to-transparent border-l-4 border-orange-500";
      default: return "border-l-4 border-transparent";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen checkered-bg flex items-center justify-center">
        <div className="mk-card p-8 text-center">
          <div className="text-xl font-bold text-white">Loading Leaderboard...</div>
          <div className="mt-2 text-4xl animate-bounce inline-block">🏆</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen checkered-bg flex flex-col items-center justify-center gap-4">
        <div className="mk-card p-8 text-center">
          <p className="text-red-400 text-xl font-bold">{error}</p>
          <Link href="/" className="mk-button mt-4 inline-block px-6 py-3">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen checkered-bg">
      {/* Header */}
      <header className="mk-header">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white"
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
            MK Stats
          </Link>
          <h1 className="text-lg font-bold text-white uppercase tracking-wide"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
            Leaderboard
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {players.length === 0 ? (
          <div className="mk-card p-12 text-center">
            <span className="text-6xl block mb-4">🏁</span>
            <p className="text-gray-400 mb-6 text-lg">No completed rounds yet.</p>
            <Link href="/enter" className="mk-button mk-button-blue inline-block px-8 py-4 text-lg">
              Start a Round
            </Link>
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-black text-white flex items-center justify-center gap-3"
                  style={{ textShadow: "3px 3px 0 rgba(0,0,0,0.5)" }}>
                <span className="text-4xl trophy-glow">🏆</span>
                GRAND PRIX STANDINGS
                <span className="text-4xl trophy-glow">🏆</span>
              </h2>
            </div>

            {/* Sort buttons for mobile */}
            <div className="mb-4 sm:hidden">
              <label className="text-sm text-gray-400 block mb-2 font-bold">Sort by:</label>
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="mk-input w-full px-4 py-3"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Table */}
            <div className="mk-card p-4 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-700">
                    <th className="text-left py-3 px-2 font-bold text-gray-400 uppercase text-sm">#</th>
                    <th className="text-left py-3 px-2 font-bold text-gray-400 uppercase text-sm">Racer</th>
                    {SORT_OPTIONS.map((opt) => (
                      <th
                        key={opt.key}
                        onClick={() => handleSort(opt.key)}
                        className={`text-right py-3 px-2 font-bold uppercase text-sm cursor-pointer transition-colors ${
                          sortKey === opt.key ? "text-yellow-400" : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {opt.label}
                        <SortIcon columnKey={opt.key} />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedPlayers.map((player, index) => (
                    <tr
                      key={player.id}
                      className={`border-b border-gray-700/50 hover:bg-white/5 transition-colors ${getRowStyle(index)}`}
                    >
                      <td className="py-4 px-2 w-12">
                        {getPositionDisplay(index)}
                      </td>
                      <td className="py-4 px-2">
                        <Link href={`/players/${player.id}`} className="flex items-center gap-3 group">
                          {player.avatarUrl ? (
                            <img
                              src={player.avatarUrl}
                              alt={player.name}
                              className={`w-10 h-10 rounded-full object-cover border-2 ${
                                index === 0 ? "border-yellow-400" :
                                index === 1 ? "border-gray-400" :
                                index === 2 ? "border-orange-500" : "border-gray-600"
                              }`}
                            />
                          ) : (
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 ${
                              index === 0 ? "bg-yellow-400 text-yellow-900 border-yellow-300" :
                              index === 1 ? "bg-gray-400 text-gray-900 border-gray-300" :
                              index === 2 ? "bg-orange-500 text-orange-900 border-orange-400" :
                              "bg-gray-600 text-white border-gray-500"
                            }`}>
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="font-bold text-white group-hover:text-yellow-400 transition-colors"
                                style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
                            {player.name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-4 px-2 text-right tabular-nums">
                        <span className={`font-bold text-lg ${
                          sortKey === "wins" ? "text-yellow-400" : "text-white"
                        }`}>
                          {player.wins}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right tabular-nums">
                        <span className={`font-bold text-lg ${
                          sortKey === "roundsPlayed" ? "text-yellow-400" : "text-white"
                        }`}>
                          {player.roundsPlayed}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right tabular-nums">
                        <span className={`font-bold text-lg ${
                          sortKey === "winPercentage" ? "text-yellow-400" : "text-white"
                        }`}>
                          {player.winPercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Back button */}
        <div className="mt-6 text-center">
          <Link href="/" className="mk-button inline-block px-6 py-3">
            Back to Menu
          </Link>
        </div>
      </main>
    </div>
  );
}
