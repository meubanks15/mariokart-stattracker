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
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-2xl font-bold text-center">Admin Access</h1>
          <input
            type="password"
            value={adminCode}
            onChange={(e) => setAdminCode(e.target.value)}
            placeholder="Enter admin code"
            className="w-full px-4 py-3 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            autoFocus
          />
          {authError && (
            <p className="text-red-500 text-sm text-center">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold"
          >
            Enter
          </button>
          <Link href="/" className="block text-center text-gray-500 hover:underline">
            Back to Home
          </Link>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-xl font-bold">MK Stats</Link>
            <span className="text-gray-500">/ Admin</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-4 border-b dark:border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab("players")}
            className={`pb-2 px-1 font-medium border-b-2 transition-colors ${
              activeTab === "players"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Players
          </button>
          <button
            onClick={() => setActiveTab("rounds")}
            className={`pb-2 px-1 font-medium border-b-2 transition-colors ${
              activeTab === "rounds"
                ? "border-blue-500 text-blue-600 dark:text-blue-400"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
    return <div className="text-center py-8">Loading players...</div>;
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
          className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
        />
        <button
          type="submit"
          disabled={adding || !newPlayerName.trim()}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg font-medium"
        >
          {adding ? "Adding..." : "Add Player"}
        </button>
      </form>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Players list */}
      <div className="space-y-2">
        {players.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No players yet. Add one above.</p>
        ) : (
          players.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center font-semibold">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{player.name}</p>
                  <p className="text-sm text-gray-500">
                    {player._count.roundPlayers} rounds, {player._count.wonRounds} wins
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDeletePlayer(player.id, player.name)}
                className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
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
    return <div className="text-center py-8">Loading rounds...</div>;
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
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {rounds.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No rounds yet.</p>
      ) : (
        rounds.map((round) => (
          <div
            key={round.id}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`
                    px-2 py-0.5 text-xs font-medium rounded
                    ${round.status === "COMPLETED" ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300" : ""}
                    ${round.status === "DRAFT" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300" : ""}
                    ${round.status === "HIDDEN" ? "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400" : ""}
                  `}>
                    {round.status}
                  </span>
                  <span className="text-sm text-gray-500">{formatDate(round.createdAt)}</span>
                </div>
                <p className="mt-1">
                  <span className="text-gray-500">Players: </span>
                  {round.roundPlayers.map((rp) => rp.player.name).join(", ")}
                </p>
                {round.winnerPlayer && (
                  <p className="text-sm">
                    <span className="text-gray-500">Winner: </span>
                    <span className="font-medium">{round.winnerPlayer.name}</span>
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {round.races.length} race{round.races.length !== 1 ? "s" : ""}
                  {round.races.some((r) => r.isOvertime) && " (with overtime)"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={round.status}
                  onChange={(e) => handleUpdateStatus(round.id, e.target.value)}
                  className="text-sm px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="HIDDEN">Hidden</option>
                </select>
                <button
                  onClick={() => handleDeleteRound(round.id)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-sm"
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
