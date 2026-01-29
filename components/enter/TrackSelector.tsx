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
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">Loading Courses...</div>
        <div className="mt-2 text-4xl animate-spin inline-block">🏎️</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-red-400">{error}</div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="mk-card p-8 text-center">
        <div className="text-xl font-bold text-white">No courses found.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-xl font-bold text-white flex items-center gap-2"
            style={{ textShadow: "2px 2px 0 rgba(0,0,0,0.5)" }}>
          <span className="text-2xl">🏁</span>
          SELECT COURSE
        </h2>
        <input
          type="text"
          placeholder="🔍 Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mk-input px-4 py-2 flex-1 max-w-xs"
        />
      </div>

      {/* Track grid */}
      <div className="mk-card p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {filteredTracks.map((track) => {
            const isSelected = track.id === selectedTrackId;

            return (
              <button
                key={track.id}
                onClick={() => onSelect(track.id)}
                className={`mk-select-card p-2 text-left ${isSelected ? "selected" : ""}`}
              >
                {track.imageUrl ? (
                  <div className="relative">
                    <img
                      src={track.imageUrl}
                      alt={track.name}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    {isSelected && (
                      <div className="absolute inset-0 bg-yellow-400/20 rounded-lg flex items-center justify-center">
                        <span className="text-3xl trophy-glow">✓</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-20 bg-gradient-to-b from-gray-600 to-gray-700 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🏎️</span>
                  </div>
                )}
                <span className="text-sm font-bold block truncate mt-2 text-white text-center"
                      style={{ textShadow: "1px 1px 0 rgba(0,0,0,0.5)" }}>
                  {track.name}
                </span>
              </button>
            );
          })}
        </div>

        {filteredTracks.length === 0 && (
          <div className="text-center py-8">
            <span className="text-4xl mb-2 block">🔍</span>
            <span className="text-gray-400 font-medium">No courses match your search.</span>
          </div>
        )}
      </div>
    </div>
  );
}
