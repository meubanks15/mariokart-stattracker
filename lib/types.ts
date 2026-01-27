// Shared TypeScript types for the Mario Kart stat tracker

export interface Player {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface Track {
  id: string;
  name: string;
  imageUrl: string | null;
}

export interface RaceResult {
  playerId: string;
  finishPosition: number;
  pointsAwarded: number | null;
}

export interface Race {
  id: string;
  raceIndex: number;
  isOvertime: boolean;
  trackId: string;
  track: Track;
  results: RaceResult[];
}

export interface RoundPlayer {
  playerId: string;
  player: Player;
}

export interface Round {
  id: string;
  createdAt: string;
  status: "DRAFT" | "COMPLETED" | "HIDDEN";
  winnerPlayerId: string | null;
  winnerPlayer: Player | null;
  roundPlayers: RoundPlayer[];
  races: Race[];
}

// API request/response types

export interface CreateRoundRequest {
  playerIds: string[];
}

export interface CreateRoundResponse {
  roundId: string;
}

export interface SaveRaceRequest {
  trackId: string;
  results: Array<{
    playerId: string;
    finishPosition: number;
  }>;
}

export interface SaveRaceResponse {
  raceId: string;
  pointsAwarded: Array<{
    playerId: string;
    points: number;
  }>;
}

export interface CompleteRoundResponse {
  winnerId: string | null;
  isTied: boolean;
}

export interface OvertimeRequest {
  trackId: string;
  results: Array<{
    playerId: string;
    finishPosition: number;
  }>;
}

// Points calculation types
export interface PlayerPoints {
  playerId: string;
  playerName: string;
  totalPoints: number;
}
