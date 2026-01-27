"use client";

import { useState, useEffect, useMemo } from "react";
import type { Track } from "@/lib/types";

interface TrackSelectorProps {
  onSelect: (trackId: string) => void;
  selectedTrackId?: string | null;
  excludeTrackIds?: string[];
}

export function TrackSelector({
  onSelect,
  selectedTrackId = null,
  excludeTrackIds = [],
}: TrackSelectorProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracks() {
      try {
        const res = await fetch("/api/tracks");
        if (!res.ok) throw new Error("Failed to fetch tracks");
        const data = await res.json();
        setTracks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load tracks");
      } finally {
        setLoading(false);
      }
    }
    fetchTracks();
  }, []);

  const filteredTracks = useMemo(() => {
    const searchLower = search.toLowerCase();
    return tracks.filter(
      (track) =>
        track.name.toLowerCase().includes(searchLower) &&
        !excludeTrackIds.includes(track.id)
    );
  }, [tracks, search, excludeTrackIds]);

  if (loading) {
    return <div className="text-center py-8">Loading tracks...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>;
  }

  if (tracks.length === 0) {
    return <div className="text-center py-8">No tracks found.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Select Track</h2>
        <input
          type="text"
          placeholder="Search tracks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 flex-1 max-w-xs"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto">
        {filteredTracks.map((track) => {
          const isSelected = track.id === selectedTrackId;

          return (
            <button
              key={track.id}
              onClick={() => onSelect(track.id)}
              className={`
                p-3 rounded-lg border-2 transition-all text-left
                ${isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }
              `}
            >
              {track.imageUrl ? (
                <img
                  src={track.imageUrl}
                  alt={track.name}
                  className="w-full h-20 object-cover rounded mb-2"
                />
              ) : (
                <div className="w-full h-20 bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center text-gray-400">
                  No image
                </div>
              )}
              <span className="text-sm font-medium block truncate">{track.name}</span>
            </button>
          );
        })}
      </div>

      {filteredTracks.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No tracks match your search.
        </div>
      )}
    </div>
  );
}
