import { NextRequest, NextResponse } from 'next/server';
import { calculatePrizeDistributionForLeaderboard, saveDistributionLog, getDistributionLogs, PrizeDistribution } from '../../utils/prizeDistribution';

// In-memory storage (in production, use a database)
const playerStats = new Map();

interface LeaderboardEntry {
  address: string;
  triggerPulls: number;
  deaths: number;
  maxStreak: number;
  rank?: number;
  isPaid?: boolean;
  lastPlayed?: number;
}

const leaderboard: {
  free: LeaderboardEntry[];
  paid: LeaderboardEntry[];
} = {
  free: [],
  paid: [],
};
let prizePool = {
  totalAmount: 0,
  participants: 0,
  lastUpdated: Date.now(),
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const address = searchParams.get('address');

  if (action === 'leaderboard') {
    const mode = searchParams.get('mode') || 'all';
    
    if (mode === 'free') {
      return NextResponse.json({ leaderboard: leaderboard.free });
    } else if (mode === 'paid') {
      return NextResponse.json({ 
        leaderboard: leaderboard.paid,
        prizePool 
      });
    }
    
    return NextResponse.json({ 
      free: leaderboard.free,
      paid: leaderboard.paid,
      prizePool 
    });
  }

  if (action === 'stats' && address) {
    const stats = playerStats.get(address);
    return NextResponse.json({ stats: stats || null });
  }

  if (action === 'prizepool') {
    return NextResponse.json({ prizePool });
  }

  if (action === 'pendingPrizes' && address) {
    // Get pending prizes for address from logs
    const logs = getDistributionLogs();
    let totalPending = 0;
    
    logs.forEach(log => {
      log.distributions.forEach(dist => {
        if (dist.address.toLowerCase() === address.toLowerCase() && dist.status === 'pending') {
          totalPending += dist.amount;
        }
      });
    });

    return NextResponse.json({ pendingPrizes: totalPending });
  }

  if (action === 'distributionLogs') {
    const logs = getDistributionLogs();
    return NextResponse.json({ logs });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, address, stats, username } = body;

    if (action === 'updateStats') {
      if (!address || !stats) {
        return NextResponse.json({ error: 'Missing data' }, { status: 400 });
      }

      // Update player stats
      const existingStats = playerStats.get(address) || {
        address,
        triggerPulls: 0,
        deaths: 0,
        maxStreak: 0,
        lastPlayed: Date.now(),
        isPaid: false,
      };

      const updatedStats = {
        ...existingStats,
        triggerPulls: stats.triggerPulls || existingStats.triggerPulls,
        deaths: stats.deaths || existingStats.deaths,
        maxStreak: stats.maxStreak !== undefined ? Math.max(existingStats.maxStreak || 0, stats.maxStreak) : (existingStats.maxStreak || 0),
        lastPlayed: Date.now(),
        isPaid: stats.isPaid !== undefined ? stats.isPaid : existingStats.isPaid,
        username: username || existingStats.username, // Save username if provided
      };

      playerStats.set(address, updatedStats);

      // Update leaderboard
      updateLeaderboard(updatedStats);

      return NextResponse.json({ success: true, stats: updatedStats });
    }

    if (action === 'joinPrizePool') {
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      // Update prize pool
      prizePool.totalAmount += 1;
      prizePool.participants += 1;
      prizePool.lastUpdated = Date.now();

      // Update player stats
      const stats = playerStats.get(address) || {
        address,
        triggerPulls: 0,
        deaths: 0,
        lastPlayed: Date.now(),
        isPaid: false,
      };

      stats.isPaid = true;
      playerStats.set(address, stats);

      return NextResponse.json({ 
        success: true, 
        prizePool 
      });
    }

    if (action === 'distributePrizes') {
      // Calculate and distribute prizes to all paid players
      const paidEntries = leaderboard.paid.map((entry: any) => ({
        address: entry.address,
        maxStreak: entry.maxStreak || 0,
        totalPulls: entry.triggerPulls || 0,
        totalDeaths: entry.deaths || 0,
      }));

      if (paidEntries.length === 0 || prizePool.totalAmount === 0) {
        return NextResponse.json({ 
          error: 'No participants or empty prize pool' 
        }, { status: 400 });
      }

      // Calculate distributions
      const distributions = calculatePrizeDistributionForLeaderboard(
        prizePool.totalAmount,
        paidEntries
      );

      // Create distribution log
      const distributionLog = {
        distributionId: distributions[0]?.distributionId || `dist_${Date.now()}`,
        timestamp: Date.now(),
        prizePoolAmount: prizePool.totalAmount,
        participants: paidEntries.length,
        distributions,
      };

      // Save log
      saveDistributionLog(distributionLog);

      // Reset prize pool after distribution
      prizePool.totalAmount = 0;
      prizePool.participants = 0;
      prizePool.lastUpdated = Date.now();

      return NextResponse.json({ 
        success: true, 
        distribution: distributionLog,
        prizePool 
      });
    }

    if (action === 'approveDistribution') {
      const { distributionId, address: userAddress } = body;
      
      if (!distributionId || !userAddress) {
        return NextResponse.json({ error: 'Missing distributionId or address' }, { status: 400 });
      }

      // Update distribution status in logs
      const logs = getDistributionLogs();
      let found = false;

      logs.forEach(log => {
        if (log.distributionId === distributionId) {
          for (let i = 0; i < log.distributions.length; i++) {
            const dist = log.distributions[i] as PrizeDistribution;
            if (dist.address.toLowerCase() === userAddress.toLowerCase() && dist.status === 'pending') {
              // Create new object with approvedAt property
              log.distributions[i] = {
                ...dist,
                status: 'approved' as const,
                approvedAt: Date.now()
              };
              found = true;
              break;
            }
          }
          if (found) {
            log.approvedBy = userAddress;
            log.approvedAt = Date.now();
          }
        }
      });

      if (!found) {
        return NextResponse.json({ error: 'Distribution not found' }, { status: 404 });
      }

      // Save updated logs
      if (typeof window === 'undefined') {
        const fs = require('fs');
        const path = require('path');
        const logsDir = path.join(process.cwd(), 'logs');
        const logFile = path.join(logsDir, 'prize_distributions.json');
        fs.writeFileSync(logFile, JSON.stringify(logs, null, 2), 'utf-8');
      }

      return NextResponse.json({ success: true, logs });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function updateLeaderboard(stats: LeaderboardEntry) {
  const mode = stats.isPaid ? 'paid' : 'free';
  const board = leaderboard[mode];

  // Remove existing entry
  const index = board.findIndex((entry) => entry.address.toLowerCase() === stats.address.toLowerCase());
  if (index >= 0) {
    board.splice(index, 1);
  }

  // Add updated entry with all required fields
  const entry: LeaderboardEntry = {
    address: stats.address,
    triggerPulls: stats.triggerPulls || 0,
    deaths: stats.deaths || 0,
    maxStreak: stats.maxStreak || 0,
    isPaid: stats.isPaid || false,
    lastPlayed: stats.lastPlayed || Date.now(),
  };
  board.push(entry);

  // Sort by maxStreak (desc), then trigger pulls (desc), then deaths (asc)
  board.sort((a, b) => {
    if (b.maxStreak !== a.maxStreak) {
      return b.maxStreak - a.maxStreak;
    }
    if (b.triggerPulls !== a.triggerPulls) {
      return b.triggerPulls - a.triggerPulls;
    }
    return a.deaths - b.deaths;
  });

  // Add ranks
  board.forEach((entry, index: number) => {
    entry.rank = index + 1;
  });

  // Keep only top 50
  if (board.length > 50) {
    board.splice(50);
  }
}


