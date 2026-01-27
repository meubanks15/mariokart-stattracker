"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";

interface PlayerProfile {
  id: string;
  name: string;
  avatarUrl: string | null;
  stats: {
    wins: number;
    roundsPlayed: number;
    winPercentage: number;
    totalPoints: number;
    racesRaced: number;
    avgPointsPerRace: number;
    firstPlaceRaces: number;
    secondPlaceRaces: number;
    thirdPlaceRaces: number;
    fourthPlaceRaces: number;
  };
  trackStats: Array<{
    trackId: string;
    trackName: string;
    trackImageUrl: string | null;
    races: number;
    firstPlaces: number;
    totalPoints: number;
    avgPoints: number;
  }>;
  recentRounds: Array<{
    id: string;
    createdAt: string;
    won: boolean;
    winner: { id: string; name: string } | null;
    players: string[];
    playerPoints: number;
  }>;
}

export default function PlayerProfilePage({
  params,
}: {
  params: Promise<{ playerId: string }>;
}) {
  const { playerId } = use(params);
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const res = await fetch(`/api/players/${playerId}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error("Player not found");
          throw new Error("Failed to fetch player");
        }
        const data = await res.json();
        setPlayer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load player");
      } finally {
        setLoading(false);
      }
    }
    fetchPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading player...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-500">{error || "Player not found"}</p>
        <Link href="/players" className="text-blue-500 hover:underline">
          Back to Players
        </Link>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">MK Stats</Link>
          <Link href="/players" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            All Players
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Player header */}
        <div className="flex items-center gap-4">
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={player.name}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-3xl font-bold">
              {player.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold">{player.name}</h1>
            <p className="text-gray-500">
              {player.stats.roundsPlayed} rounds played
            </p>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Wins" value={player.stats.wins} />
          <StatCard label="Win %" value={`${player.stats.winPercentage}%`} />
          <StatCard label="Total Points" value={player.stats.totalPoints} />
          <StatCard label="Avg Pts/Race" value={player.stats.avgPointsPerRace} />
        </div>

        {/* Race finish breakdown */}
        <div>
          <h2 className="text-xl font-semibold mb-3">Race Finishes</h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 text-center">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {player.stats.firstPlaceRaces}
              </div>
              <div className="text-sm text-yellow-600 dark:text-yellow-400">1st Place</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-center">
              <div className="text-2xl font-bold">{player.stats.secondPlaceRaces}</div>
              <div className="text-sm text-gray-500">2nd Place</div>
            </div>
            <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-center">
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {player.stats.thirdPlaceRaces}
              </div>
              <div className="text-sm text-orange-600 dark:text-orange-400">3rd Place</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-center">
              <div className="text-2xl font-bold">{player.stats.fourthPlaceRaces}</div>
              <div className="text-sm text-gray-500">4th Place</div>
            </div>
          </div>
        </div>

        {/* Best & Worst Tracks */}
        {player.trackStats.length >= 2 && (
          <BestWorstTracks trackStats={player.trackStats} />
        )}

        {/* Recent rounds */}
        {player.recentRounds.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Recent Rounds</h2>
            <div className="space-y-2">
              {player.recentRounds.map((round) => (
                <Link
                  key={round.id}
                  href={`/rounds/${round.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {round.won ? (
                      <span className="text-xl">🏆</span>
                    ) : (
                      <span className="w-7 text-center text-gray-400">-</span>
                    )}
                    <div>
                      <div className="font-medium">
                        vs {round.players.filter((p) => p !== player.name).join(", ")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(round.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{round.playerPoints} pts</div>
                    {round.won && (
                      <div className="text-sm text-green-600 dark:text-green-400">Won</div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Track stats */}
        {player.trackStats.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Track Performance</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-2 pr-4">Track</th>
                    <th className="text-right py-2 px-2">Races</th>
                    <th className="text-right py-2 px-2">1st</th>
                    <th className="text-right py-2 px-2">Avg Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {player.trackStats.slice(0, 10).map((track) => (
                    <tr key={track.trackId} className="border-b dark:border-gray-800">
                      <td className="py-2 pr-4">{track.trackName}</td>
                      <td className="text-right py-2 px-2">{track.races}</td>
                      <td className="text-right py-2 px-2">{track.firstPlaces}</td>
                      <td className="text-right py-2 px-2">{track.avgPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {player.trackStats.length > 10 && (
                <p className="text-sm text-gray-500 mt-2">
                  Showing top 10 of {player.trackStats.length} tracks
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function BestWorstTracks({
  trackStats,
}: {
  trackStats: Array<{
    trackId: string;
    trackName: string;
    trackImageUrl: string | null;
    races: number;
    avgPoints: number;
  }>;
}) {
  // Only consider tracks with at least 2 races for meaningful stats
  const qualifiedTracks = trackStats.filter((t) => t.races >= 2);

  if (qualifiedTracks.length < 2) return null;

  // Sort by average points
  const sortedByAvg = [...qualifiedTracks].sort((a, b) => b.avgPoints - a.avgPoints);

  const bestTracks = sortedByAvg.slice(0, 3);
  const worstTracks = sortedByAvg.slice(-3).reverse();

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Best & Worst Tracks</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Best Tracks */}
        <div>
          <h3 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2">Best Tracks</h3>
          <div className="space-y-2">
            {bestTracks.map((track, index) => (
              <TrackCard
                key={track.trackId}
                track={track}
                rank={index + 1}
                variant="best"
              />
            ))}
          </div>
        </div>

        {/* Worst Tracks */}
        <div>
          <h3 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Worst Tracks</h3>
          <div className="space-y-2">
            {worstTracks.map((track, index) => (
              <TrackCard
                key={track.trackId}
                track={track}
                rank={index + 1}
                variant="worst"
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-2">Based on average points (minimum 2 races)</p>
    </div>
  );
}

function TrackCard({
  track,
  rank,
  variant,
}: {
  track: {
    trackName: string;
    trackImageUrl: string | null;
    races: number;
    avgPoints: number;
  };
  rank: number;
  variant: "best" | "worst";
}) {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-lg ${
        variant === "best"
          ? "bg-green-50 dark:bg-green-900/20"
          : "bg-red-50 dark:bg-red-900/20"
      }`}
    >
      <span className="text-lg font-bold text-gray-400 w-6">{rank}</span>
      {track.trackImageUrl ? (
        <img
          src={track.trackImageUrl}
          alt={track.trackName}
          className="w-16 h-10 object-cover rounded"
        />
      ) : (
        <div className="w-16 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-xs text-gray-400">
          No img
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{track.trackName}</div>
        <div className="text-xs text-gray-500">{track.races} races</div>
      </div>
      <div
        className={`text-lg font-bold ${
          variant === "best"
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        {track.avgPoints}
      </div>
    </div>
  );
}
