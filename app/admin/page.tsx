"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
  avatarUrl: string | null;
  _count: {
    roundPlayers: number;
    wonRounds: number;
  };
}

interface Round {
  id: string;
  createdAt: string;
  status: "DRAFT" | "COMPLETED" | "HIDDEN";
  winnerPlayer: { id: string; name: string } | null;
  roundPlayers: Array<{ player: { id: string; name: string } }>;
  races: Array<{
    raceIndex: number;
    isOvertime: boolean;
    track: { name: string };
  }>;
}

export default function AdminPage() {
  const [adminCode, setAdminCode] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"players" | "rounds">("players");

  // Check for stored code on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("adminCode");
    if (stored) {
      setAdminCode(stored);
      verifyCode(stored);
    }
  }, []);

  const verifyCode = async (code: string) => {
    try {
      const res = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem("adminCode", code);
        setAuthError(null);
      } else {
        setAuthError("Invalid code");
        sessionStorage.removeItem("adminCode");
      }
    } catch {
      setAuthError("Failed to verify code");
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    verifyCode(adminCode);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAdminCode("");
    sessionStorage.removeItem("adminCode");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen checkered-bg flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="mk-card w-full max-w-sm p-6 space-y-4">
          <h1 className="text-2xl font-black text-white text-center"
              style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
            Admin Access
          </h1>
          <input
            type="password"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder="Enter admin code"
            className="w-full px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          {authError && (
            <p className="text-red-400 text-sm text-center font-bold">{authError}</p>
          )}
          <button
            type="submit"
            className="mk-button mk-button-blue w-full py-3"
          >
            Enter
          </button>
          <Link href="/" className="block text-center text-gray-400 hover:text-white font-medium">
            Back to Home
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen checkered-bg">
      <header className="mk-header">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold text-white"
                  style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}>
              MK Stats
            </Link>
            <span className="text-white/60">/ Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-white/60 hover:text-white font-medium"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab("players")}
            className={`pb-2 px-1 font-bold border-b-2 transition-colors ${
              activeTab === "players"
                ? "border-yellow-400 text-yellow-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Players
          </button>
          <button
            onClick={() => setActiveTab("rounds")}
            className={`pb-2 px-1 font-bold border-b-2 transition-colors ${
              activeTab === "rounds"
                ? "border-yellow-400 text-yellow-400"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            Rounds
          </button>
        </div>

        {activeTab === "players" ? (
          <PlayersTab adminCode={adminCode} />
        ) : (
          <RoundsTab adminCode={adminCode} />
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

function PlayersTab({ adminCode }: { adminCode: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchPlayers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/players", {
        headers: { "x-admin-code": adminCode },
      });
      if (!res.ok) throw new Error("Failed to fetch players");
      const data = await res.json();
      setPlayers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load players");
    } finally {
      setLoading(false);
    }
  }, [adminCode]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    setAdding(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/players", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-code": adminCode,
        },
        body: JSON.stringify({ name: newPlayerName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add player");
      }

      setNewPlayerName("");
      fetchPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add player");
    } finally {
      setAdding(false);
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Delete player "${playerName}"? This will also delete all their race results.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/players/${playerId}`, {
        method: "DELETE",
        headers: { "x-admin-code": adminCode },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete player");
      }

      fetchPlayers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete player");
    }
  };

  if (loading) {
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-white font-bold">Loading players...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add player form */}
      <form onSubmit={handleAddPlayer} className="flex gap-3">
        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="New player name"
          className="flex-1 px-4 py-3 bg-gray-800 border-2 border-gray-600 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={adding || !newPlayerName.trim()}
          className={`px-6 py-3 rounded-lg font-bold ${
            adding || !newPlayerName.trim()
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "mk-button mk-button-blue"
          }`}
        >
          {adding ? "Adding..." : "Add Player"}
        </button>
      </form>

      {error && (
        <div className="mk-card p-4 border-2 border-red-500 bg-red-500/20">
          <div className="text-red-300 font-bold">{error}</div>
        </div>
      )}

      {/* Players list */}
      <div className="space-y-2">
        {players.length === 0 ? (
          <div className="mk-card p-8 text-center">
            <p className="text-gray-400">No players yet. Add one above.</p>
          </div>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="mk-card flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-white">{player.name}</p>
                  <p className="text-sm text-gray-400">
                    {player._count.roundPlayers} rounds, {player._count.wonRounds} wins
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeletePlayer(player.id, player.name)}
                className="px-4 py-2 text-red-400 hover:bg-red-500/20 rounded-lg font-bold transition-colors"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RoundsTab({ adminCode }: { adminCode: string }) {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRounds = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/rounds", {
        headers: { "x-admin-code": adminCode },
      });
      if (!res.ok) throw new Error("Failed to fetch rounds");
      const data = await res.json();
      setRounds(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rounds");
    } finally {
      setLoading(false);
    }
  }, [adminCode]);

  useEffect(() => {
    fetchRounds();
  }, [fetchRounds]);

  const handleDeleteRound = async (roundId: string) => {
    if (!confirm("Delete this round? This cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/rounds/${roundId}`, {
        method: "DELETE",
        headers: { "x-admin-code": adminCode },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete round");
      }

      fetchRounds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete round");
    }
  };

  const handleUpdateStatus = async (roundId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/rounds/${roundId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-code": adminCode,
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update round");
      }

      fetchRounds();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update round");
    }
  };

  if (loading) {
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-white font-bold">Loading rounds...</div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="mk-card p-4 border-2 border-red-500 bg-red-500/20">
          <div className="text-red-300 font-bold">{error}</div>
        </div>
      )}

      {rounds.length === 0 ? (
        <div className="mk-card p-8 text-center">
          <p className="text-gray-400">No rounds yet.</p>
        </div>
      ) : (
        rounds.map((round) => (
          <div
            key={round.id}
            className="mk-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`
                    px-2 py-0.5 text-xs font-bold rounded
                    ${round.status === "COMPLETED" ? "bg-green-500/30 text-green-400 border border-green-500" : ""}
                    ${round.status === "DRAFT" ? "bg-yellow-500/30 text-yellow-400 border border-yellow-500" : ""}
                    ${round.status === "HIDDEN" ? "bg-gray-500/30 text-gray-400 border border-gray-500" : ""}
                  `}>
                    {round.status}
                  </span>
                  <span className="text-sm text-gray-400">{formatDate(round.createdAt)}</span>
                </div>
                <p className="mt-2 text-white">
                  <span className="text-gray-400">Players: </span>
                  <span className="font-bold">{round.roundPlayers.map((rp) => rp.player.name).join(", ")}</span>
                </p>
                {round.winnerPlayer && (
                  <p className="text-sm">
                    <span className="text-gray-400">Winner: </span>
                    <span className="font-bold text-yellow-400">{round.winnerPlayer.name}</span>
                  </p>
                )}
                <p className="text-sm text-gray-400">
                  {round.races.length} race{round.races.length !== 1 ? "s" : ""}
                  {round.races.some((r) => r.isOvertime) && " (with overtime)"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={round.status}
                  onChange={(e) => handleUpdateStatus(round.id, e.target.value)}
                  className="text-sm px-3 py-2 bg-gray-800 border-2 border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
                <button
                  onClick={() => handleDeleteRound(round.id)}
                  className="px-3 py-2 text-red-400 hover:bg-red-500/20 rounded-lg text-sm font-bold transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
