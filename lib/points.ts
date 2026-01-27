// Points awarded based on finish position and number of players
const POINTS_TABLE: Record<number, number[]> = {
  4: [5, 3, 2, 1], // 4 players: 1st=5, 2nd=3, 3rd=2, 4th=1
  3: [4, 2, 1],    // 3 players: 1st=4, 2nd=2, 3rd=1
  2: [2, 1],       // 2 players: 1st=2, 2nd=1
};

/**
 * Get points for a given finish position based on number of players
 * @param position - Finish position (1-based: 1=first, 2=second, etc.)
 * @param playerCount - Total number of players in the round (2-4)
 * @returns Points awarded for that position
 */
export function getPointsForPosition(position: number, playerCount: number): number {
  const table = POINTS_TABLE[playerCount];
  if (!table) {
    throw new Error(`Invalid player count: ${playerCount}. Must be 2, 3, or 4.`);
  }
  if (position < 1 || position > playerCount) {
    throw new Error(`Invalid position: ${position}. Must be between 1 and ${playerCount}.`);
  }
  return table[position - 1];
}

/**
 * Calculate total points for each player from race results
 * @param results - Array of race results with playerId and pointsAwarded
 * @returns Map of playerId to total points
 */
export function calculateTotalPoints(
  results: Array<{ playerId: string; pointsAwarded: number | null }>
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const result of results) {
    const current = totals.get(result.playerId) ?? 0;
    totals.set(result.playerId, current + (result.pointsAwarded ?? 0));
  }

  return totals;
}

/**
 * Determine the winner(s) from point totals
 * Returns array because there could be a tie
 * @param totals - Map of playerId to total points
 * @returns Array of playerIds with the highest points
 */
export function getWinners(totals: Map<string, number>): string[] {
  let maxPoints = -1;
  let winners: string[] = [];

  for (const [playerId, points] of totals) {
    if (points > maxPoints) {
      maxPoints = points;
      winners = [playerId];
    } else if (points === maxPoints) {
      winners.push(playerId);
    }
  }

  return winners;
}

/**
 * Check if there's a tie for first place
 * @param totals - Map of playerId to total points
 * @returns true if two or more players are tied for first
 */
export function hasTie(totals: Map<string, number>): boolean {
  return getWinners(totals).length > 1;
}
