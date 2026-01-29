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
      <div className="min-h-screen checkered-bg flex items-center justify-center">
        <div className="mk-card p-8 text-center">
          <div className="text-xl font-bold text-white">Loading Player...</div>
          <div className="mt-2 text-4xl">🏎️</div>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-screen checkered-bg flex flex-col items-center justify-center gap-4">
        <div className="mk-card p-8 text-center">
          <p className="text-red-400 text-xl font-bold mb-4">{error || "Player not found"}</p>
          <Link href="/players" className="mk-button px-6 py-3">
            Back to Players
          </Link>
        </div>
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
    <div className="min-h-screen checkered-bg">
      <header className="mk-header">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white"
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
            MK Stats
          </Link>
          <Link href="/players" className="text-white/80 hover:text-white font-medium">
            All Players
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Player header */}
        <div className="mk-card p-6">
          <div className="flex items-center gap-4">
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-20 h-20 rounded-full object-cover border-4 border-yellow-400"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-yellow-400">
                {player.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-black text-white"
                  style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
                {player.name}
              </h1>
              <p className="text-gray-400 font-medium">
                {player.stats.roundsPlayed} rounds played
              </p>
            </div>
          </div>
        </div>

        {/* Main stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Wins" value={player.stats.wins} icon="🏆" />
          <StatCard label="Win %" value={`${player.stats.winPercentage}%`} icon="📊" />
          <StatCard label="Total Points" value={player.stats.totalPoints} icon="⭐" />
          <StatCard label="Avg Pts/Race" value={player.stats.avgPointsPerRace} icon="📈" />
        </div>

        {/* Race finish breakdown */}
        <div>
          <h2 className="text-xl font-bold text-white mb-3"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
            RACE FINISHES
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <div className="mk-card p-3 text-center border-2 border-yellow-400">
              <div className="text-2xl font-black text-yellow-400">
                {player.stats.firstPlaceRaces}
              </div>
              <div className="text-sm text-yellow-300 font-bold">1st Place</div>
            </div>
            <div className="mk-card p-3 text-center border-2 border-gray-400">
              <div className="text-2xl font-black text-gray-300">
                {player.stats.secondPlaceRaces}
              </div>
              <div className="text-sm text-gray-400 font-bold">2nd Place</div>
            </div>
            <div className="mk-card p-3 text-center border-2 border-orange-400">
              <div className="text-2xl font-black text-orange-400">
                {player.stats.thirdPlaceRaces}
              </div>
              <div className="text-sm text-orange-300 font-bold">3rd Place</div>
            </div>
            <div className="mk-card p-3 text-center border-2 border-gray-600">
              <div className="text-2xl font-black text-gray-400">
                {player.stats.fourthPlaceRaces}
              </div>
              <div className="text-sm text-gray-500 font-bold">4th Place</div>
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
            <h2 className="text-xl font-bold text-white mb-3"
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
              RECENT ROUNDS
            </h2>
            <div className="space-y-2">
              {player.recentRounds.map((round) => (
                <Link
                  key={round.id}
                  href={`/rounds/${round.id}`}
                  className="mk-card flex items-center justify-between p-4 hover:border-yellow-400 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {round.won ? (
                      <span className="text-2xl trophy-glow">🏆</span>
                    ) : (
                      <span className="w-8 text-center text-gray-500 text-xl">-</span>
                    )}
                    <div>
                      <div className="font-bold text-white">
                        vs {round.players.filter((p) => p !== player.name).join(", ")}
                      </div>
                      <div className="text-sm text-gray-400">
                        {formatDate(round.createdAt)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white text-lg">{round.playerPoints} pts</div>
                    {round.won && (
                      <div className="text-sm text-green-400 font-bold">Won</div>
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
            <h2 className="text-xl font-bold text-white mb-3"
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
              TRACK PERFORMANCE
            </h2>
            <div className="mk-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700 bg-gray-800/50">
                    <th className="text-left py-3 px-4 text-gray-300 font-bold">Track</th>
                    <th className="text-right py-3 px-2 text-gray-300 font-bold">Races</th>
                    <th className="text-right py-3 px-2 text-gray-300 font-bold">1st</th>
                    <th className="text-right py-3 px-4 text-gray-300 font-bold">Avg Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {player.trackStats.slice(0, 10).map((track, index) => (
                    <tr key={track.trackId} className={`border-b border-gray-700/50 ${index % 2 === 0 ? 'bg-gray-800/30' : ''}`}>
                      <td className="py-3 px-4 text-white font-medium">{track.trackName}</td>
                      <td className="text-right py-3 px-2 text-gray-300">{track.races}</td>
                      <td className="text-right py-3 px-2 text-yellow-400 font-bold">{track.firstPlaces}</td>
                      <td className="text-right py-3 px-4 text-white font-bold">{track.avgPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {player.trackStats.length > 10 && (
                <p className="text-sm text-gray-400 p-4 border-t border-gray-700">
                  Showing top 10 of {player.trackStats.length} tracks
                </p>
              )}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="pt-4 text-center">
          <Link href="/players" className="mk-button px-6 py-3">
            Back to Players
          </Link>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="mk-card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-2xl font-black text-white">{value}</div>
      <div className="text-sm text-gray-400 font-medium">{label}</div>
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
      <h2 className="text-xl font-bold text-white mb-3"
          style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
        BEST & WORST TRACKS
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Best Tracks */}
        <div className="mk-card p-4 border-2 border-green-500">
          <h3 className="text-sm font-bold text-green-400 mb-3 uppercase tracking-wide">Best Tracks</h3>
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
        <div className="mk-card p-4 border-2 border-red-500">
          <h3 className="text-sm font-bold text-red-400 mb-3 uppercase tracking-wide">Worst Tracks</h3>
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
      <p className="text-xs text-gray-500 mt-3">Based on average points (minimum 2 races)</p>
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
          ? "bg-green-500/20"
          : "bg-red-500/20"
      }`}
    >
      <span className="text-lg font-black text-gray-500 w-6">{rank}</span>
      {track.trackImageUrl ? (
        <img
          src={track.trackImageUrl}
          alt={track.trackName}
          className="w-16 h-10 object-cover rounded border-2 border-gray-600"
        />
      ) : (
        <div className="w-16 h-10 bg-gray-700 rounded flex items-center justify-center text-xs text-gray-500 border-2 border-gray-600">
          No img
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white text-sm truncate">{track.trackName}</div>
        <div className="text-xs text-gray-400">{track.races} races</div>
      </div>
      <div
        className={`text-lg font-black ${
          variant === "best"
            ? "text-green-400"
            : "text-red-400"
        }`}
      >
        {track.avgPoints}
      </div>
    </div>
  );
}
