import { calculatePrizeDistribution } from './gameLogic';

export interface PrizeDistribution {
  address: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: number;
  distributionId: string;
  rank: number;
  approvedAt?: number;
}

export interface DistributionLog {
  distributionId: string;
  timestamp: number;
  prizePoolAmount: number;
  participants: number;
  distributions: PrizeDistribution[];
  approvedBy?: string;
  approvedAt?: number;
}

/**
 * Calculate prize distribution for paid leaderboard
 */
export function calculatePrizeDistributionForLeaderboard(
  prizePoolAmount: number,
  leaderboardEntries: Array<{ address: string; maxStreak: number; totalPulls: number; totalDeaths: number }>
): PrizeDistribution[] {
  if (leaderboardEntries.length === 0 || prizePoolAmount === 0) {
    return [];
  }

  // Convert to PlayerStats format for gameLogic
  const participants = leaderboardEntries.map(entry => ({
    address: entry.address,
    triggerPulls: entry.totalPulls,
    deaths: entry.totalDeaths,
    lastPlayed: Date.now(),
    isPaid: true, // Prize distribution is only for paid entries
  }));

  // Calculate distribution using existing logic
  const distributionMap = calculatePrizeDistribution(prizePoolAmount, participants);

  // Create distribution records
  const distributions: PrizeDistribution[] = [];
  const distributionId = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Sort entries by rank (1st, 2nd, 3rd, etc.)
  const sortedEntries = [...leaderboardEntries].sort((a, b) => {
    if (b.maxStreak !== a.maxStreak) {
      return b.maxStreak - a.maxStreak;
    }
    const aRatio = a.totalDeaths / Math.max(1, a.totalPulls);
    const bRatio = b.totalDeaths / Math.max(1, b.totalPulls);
    return aRatio - bRatio; // Lower death ratio = better
  });

  sortedEntries.forEach((entry, index) => {
    const amount = distributionMap.get(entry.address) || 0;
    if (amount > 0) {
      distributions.push({
        address: entry.address,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimals
        status: 'pending',
        timestamp: Date.now(),
        distributionId,
        rank: index + 1,
      });
    }
  });

  return distributions;
}

/**
 * Save distribution log to file (server-side) or localStorage (client-side)
 */
export function saveDistributionLog(log: DistributionLog): void {
  if (typeof window === 'undefined') {
    // Server-side: Save to file
    const fs = require('fs');
    const path = require('path');
    const logsDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logsDir, 'prize_distributions.json');

    // Ensure logs directory exists
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Read existing logs
    let logs: DistributionLog[] = [];
    if (fs.existsSync(logFile)) {
      try {
        const content = fs.readFileSync(logFile, 'utf-8');
        logs = JSON.parse(content);
      } catch (error) {
        console.error('Error reading distribution logs:', error);
      }
    }

    // Add new log
    logs.push(log);

    // Write back to file
    fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
  } else {
    // Client-side: Save to localStorage
    const logsKey = 'prize_distribution_logs';
    const existingLogs = localStorage.getItem(logsKey);
    const logs: DistributionLog[] = existingLogs ? JSON.parse(existingLogs) : [];
    logs.push(log);
    localStorage.setItem(logsKey, JSON.stringify(logs));
  }
}

/**
 * Get all distribution logs
 */
export function getDistributionLogs(): DistributionLog[] {
  if (typeof window === 'undefined') {
    // Server-side: Read from file
    const fs = require('fs');
    const path = require('path');
    const logFile = path.join(process.cwd(), 'logs', 'prize_distributions.json');

    if (!fs.existsSync(logFile)) {
      return [];
    }

    try {
      const content = fs.readFileSync(logFile, 'utf-8');
      return JSON.parse(content) as DistributionLog[];
    } catch (error) {
      console.error('Error reading distribution logs:', error);
      return [];
    }
  } else {
    // Client-side: Read from localStorage
    const logsKey = 'prize_distribution_logs';
    const existingLogs = localStorage.getItem(logsKey);
    return existingLogs ? (JSON.parse(existingLogs) as DistributionLog[]) : [];
  }
}

/**
 * Get pending distributions for a specific address
 */
export function getPendingDistributionsForAddress(address: string): PrizeDistribution[] {
  const logs = getDistributionLogs();
  const pending: PrizeDistribution[] = [];

  logs.forEach(log => {
    log.distributions.forEach(dist => {
      if (dist.address.toLowerCase() === address.toLowerCase() && dist.status === 'pending') {
        pending.push(dist);
      }
    });
  });

  return pending;
}

/**
 * Get total pending amount for an address
 */
export function getTotalPendingAmount(address: string): number {
  const pending = getPendingDistributionsForAddress(address);
  return pending.reduce((sum, dist) => sum + dist.amount, 0);
}

