"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
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

  if (loading) {
    return (
      <div className="min-h-screen checkered-bg flex items-center justify-center">
        <div className="mk-card p-8 text-center">
          <div className="text-xl font-bold text-white">Loading Players...</div>
          <div className="mt-2 text-4xl">👤</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen checkered-bg flex flex-col items-center justify-center gap-4">
        <div className="mk-card p-8 text-center">
          <p className="text-red-400 text-xl font-bold mb-4">{error}</p>
          <Link href="/" className="mk-button px-6 py-3">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen checkered-bg">
      <header className="mk-header">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white"
                style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
            MK Stats
          </Link>
          <h1 className="text-lg font-bold text-white"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
            Players
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {players.length === 0 ? (
          <div className="mk-card p-8 text-center">
            <p className="text-gray-400 mb-4 text-lg">No players yet.</p>
            <Link href="/admin" className="mk-button mk-button-blue px-6 py-3">
              Add players in Admin
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {players.map((player) => (
              <Link
                key={player.id}
                href={`/players/${player.id}`}
                className="mk-card p-4 hover:border-yellow-400 transition-colors"
              >
                <div className="flex flex-col items-center gap-3 text-center">
                  {player.avatarUrl ? (
                    <img
                      src={player.avatarUrl}
                      alt={player.name}
                      className="w-16 h-16 rounded-full object-cover border-4 border-gray-600"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-2xl font-bold text-white border-4 border-gray-600">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="font-bold text-white">{player.name}</span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Back link */}
        <div className="pt-8 text-center">
          <Link href="/" className="mk-button px-6 py-3">
            Back to Menu
          </Link>
        </div>
      </main>
    </div>
  );
}
