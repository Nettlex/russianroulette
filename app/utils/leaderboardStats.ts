// Leaderboard Stats Management

export interface PlayerStats {
  totalPulls: number;
  totalDeaths: number;
  maxStreak: number;
  lockedRecordAttempts: number;
}

const STATS_KEY = 'rr_player_stats';

export function getPlayerStats(): PlayerStats {
  if (typeof window === 'undefined') {
    return {
      totalPulls: 0,
      totalDeaths: 0,
      maxStreak: 0,
      lockedRecordAttempts: 0,
    };
  }

  const stored = localStorage.getItem(STATS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {
        totalPulls: 0,
        totalDeaths: 0,
        maxStreak: 0,
        lockedRecordAttempts: 0,
      };
    }
  }

  return {
    totalPulls: 0,
    totalDeaths: 0,
    maxStreak: 0,
    lockedRecordAttempts: 0,
  };
}

export function savePlayerStats(stats: PlayerStats): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }
}

export function updateStatsOnPull(stats: PlayerStats): PlayerStats {
  return {
    ...stats,
    totalPulls: stats.totalPulls + 1,
  };
}

export function updateStatsOnDeath(stats: PlayerStats, streak: number): PlayerStats {
  return {
    ...stats,
    totalDeaths: stats.totalDeaths + 1,
    maxStreak: Math.max(stats.maxStreak, streak),
  };
}

export function updateStatsOnCashOut(stats: PlayerStats, streak: number): PlayerStats {
  return {
    ...stats,
    maxStreak: Math.max(stats.maxStreak, streak),
  };
}

export function updateStatsOnLockIn(stats: PlayerStats): PlayerStats {
  return {
    ...stats,
    lockedRecordAttempts: stats.lockedRecordAttempts + 1,
  };
}

// Score formula: maxStreak * (1 + totalDeaths / max(1, totalPulls))
export function calculateScore(stats: PlayerStats): number {
  const riskMultiplier = 1 + (stats.totalDeaths / Math.max(1, stats.totalPulls));
  return stats.maxStreak * riskMultiplier;
}

export function getDeathsPerPullRatio(stats: PlayerStats): number {
  if (stats.totalPulls === 0) return 0;
  return stats.totalDeaths / stats.totalPulls;
}

