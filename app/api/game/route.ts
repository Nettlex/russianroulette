import { NextRequest, NextResponse } from 'next/server';
import { calculatePrizeDistributionForLeaderboard, saveDistributionLog, getDistributionLogs, PrizeDistribution } from '../../utils/prizeDistribution';
import { getData, updateLeaderboardEntry, updatePlayerStats, getPlayerStats, updatePrizePool, initStorage, getPlayerBalance, addBalance, deductBalance, addPendingPrize as addPendingPrizeStorage, approvePendingPrize as approvePendingPrizeStorage } from '../../lib/storage';

// ✅ FIX: Force Node.js runtime (Edge runtime is stateless and loses data!)
export const runtime = 'nodejs';

interface LeaderboardEntry {
  address: string;
  username?: string;
  triggerPulls: number;
  deaths: number;
  maxStreak: number;
  rank?: number;
  isPaid?: boolean;
  lastPlayed?: number;
}

// Initialize storage on first load
let isInitialized = false;
async function ensureInitialized() {
  if (!isInitialized) {
    await initStorage();
    isInitialized = true;
  }
}

export async function GET(request: NextRequest) {
  console.log('🔄 GET request received');
  await ensureInitialized();
  console.log('✅ Storage initialized');
  const data = getData();
  
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const address = searchParams.get('address');

  if (action === 'leaderboard') {
    const mode = searchParams.get('mode') || 'all';
    
    console.log(`📋 Leaderboard request - mode: ${mode}, free: ${data.leaderboard.free.length}, paid: ${data.leaderboard.paid.length}`);
    
    if (mode === 'free') {
      return NextResponse.json({ leaderboard: data.leaderboard.free });
    } else if (mode === 'paid') {
      return NextResponse.json({ 
        leaderboard: data.leaderboard.paid,
        prizePool: data.prizePool 
      });
    }
    
    return NextResponse.json({ 
      free: data.leaderboard.free,
      paid: data.leaderboard.paid,
      prizePool: data.prizePool 
    });
  }

  if (action === 'stats' && address) {
    const stats = await getPlayerStats(address);
    return NextResponse.json({ stats: stats || null });
  }

  if (action === 'balance' && address) {
    // SERVER-AUTHORITATIVE: Get balance from Edge Config
    const balance = await getPlayerBalance(address);
    console.log('💰 Balance fetched for', address, ':', balance);
    return NextResponse.json({ balance });
  }

  if (action === 'prizepool') {
    return NextResponse.json({ prizePool: data.prizePool });
  }

  if (action === 'pendingPrizes' && address) {
    // Get pending prizes from server storage
    const balance = await getPlayerBalance(address);
    console.log('🎁 Pending prizes for', address, ':', balance.pendingPrizes);
    return NextResponse.json({ pendingPrizes: balance.pendingPrizes });
  }

  if (action === 'distributionLogs') {
    const logs = getDistributionLogs();
    return NextResponse.json({ logs });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: NextRequest) {
  await ensureInitialized();
  
  try {
    const body = await request.json();
    const { action, address, username } = body;

    // ========================================
    // SERVER-AUTHORITATIVE GAME EVENTS
    // ========================================
    
    if (action === 'triggerPull') {
      // Server increments trigger pulls
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      const existingStats = await getPlayerStats(address) || {
        address,
        triggerPulls: 0,
        deaths: 0,
        maxStreak: 0,
        currentStreak: 0,
        lastPlayed: Date.now(),
        isPaid: false,
      };

      const updatedStats = {
        ...existingStats,
        triggerPulls: (existingStats.triggerPulls || 0) + 1,
        currentStreak: (existingStats.currentStreak || 0) + 1,
        lastPlayed: Date.now(),
      };

      await updatePlayerStats(address, updatedStats);
      await updateLeaderboardEntry(
        updatedStats.isPaid ? 'paid' : 'free',
        {
          address: updatedStats.address,
          username: updatedStats.username || existingStats.username,
          triggerPulls: updatedStats.triggerPulls,
          deaths: updatedStats.deaths || 0,
          maxStreak: updatedStats.maxStreak || 0,
          isPaid: updatedStats.isPaid,
          lastPlayed: updatedStats.lastPlayed,
        }
      );

      console.log('🔫 Trigger pull recorded:', address, 'pulls:', updatedStats.triggerPulls);
      return NextResponse.json({ success: true, stats: updatedStats });
    }

    if (action === 'death') {
      // Server records death and resets streak
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      const existingStats = await getPlayerStats(address) || {
        address,
        triggerPulls: 0,
        deaths: 0,
        maxStreak: 0,
        currentStreak: 0,
        lastPlayed: Date.now(),
        isPaid: false,
      };

      const updatedStats = {
        ...existingStats,
        deaths: (existingStats.deaths || 0) + 1,
        maxStreak: Math.max(existingStats.maxStreak || 0, existingStats.currentStreak || 0),
        currentStreak: 0, // Reset on death
        lastPlayed: Date.now(),
      };

      await updatePlayerStats(address, updatedStats);
      await updateLeaderboardEntry(
        updatedStats.isPaid ? 'paid' : 'free',
        {
          address: updatedStats.address,
          username: updatedStats.username || existingStats.username,
          triggerPulls: updatedStats.triggerPulls || 0,
          deaths: updatedStats.deaths,
          maxStreak: updatedStats.maxStreak,
          isPaid: updatedStats.isPaid,
          lastPlayed: updatedStats.lastPlayed,
        }
      );

      console.log('💀 Death recorded:', address, 'deaths:', updatedStats.deaths, 'maxStreak:', updatedStats.maxStreak);
      return NextResponse.json({ success: true, stats: updatedStats });
    }

    if (action === 'cashout') {
      // Server records cashout at 7 pulls
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      const existingStats = await getPlayerStats(address) || {
        address,
        triggerPulls: 0,
        deaths: 0,
        maxStreak: 0,
        currentStreak: 0,
        lastPlayed: Date.now(),
        isPaid: false,
      };

      const updatedStats = {
        ...existingStats,
        maxStreak: Math.max(existingStats.maxStreak || 0, 7), // Cash out at 7
        currentStreak: 0, // Reset after cashout
        lastPlayed: Date.now(),
      };

      await updatePlayerStats(address, updatedStats);
      await updateLeaderboardEntry(
        updatedStats.isPaid ? 'paid' : 'free',
        {
          address: updatedStats.address,
          username: updatedStats.username || existingStats.username,
          triggerPulls: updatedStats.triggerPulls || 0,
          deaths: updatedStats.deaths || 0,
          maxStreak: updatedStats.maxStreak,
          isPaid: updatedStats.isPaid,
          lastPlayed: updatedStats.lastPlayed,
        }
      );

      console.log('💰 Cashout recorded:', address, 'maxStreak:', updatedStats.maxStreak);
      return NextResponse.json({ success: true, stats: updatedStats });
    }

    if (action === 'setUsername') {
      // Update username only
      if (!address || !username) {
        return NextResponse.json({ error: 'Missing address or username' }, { status: 400 });
      }

      const existingStats = await getPlayerStats(address) || {
        address,
        triggerPulls: 0,
        deaths: 0,
        maxStreak: 0,
        currentStreak: 0,
        lastPlayed: Date.now(),
        isPaid: false,
      };

      const updatedStats = {
        ...existingStats,
        username,
        lastPlayed: Date.now(),
      };

      await updatePlayerStats(address, updatedStats);
      await updateLeaderboardEntry(
        updatedStats.isPaid ? 'paid' : 'free',
        {
          address: updatedStats.address,
          username: updatedStats.username,
          triggerPulls: updatedStats.triggerPulls || 0,
          deaths: updatedStats.deaths || 0,
          maxStreak: updatedStats.maxStreak || 0,
          isPaid: updatedStats.isPaid,
          lastPlayed: updatedStats.lastPlayed,
        }
      );

      console.log('✏️ Username updated:', address, username);
      return NextResponse.json({ success: true, stats: updatedStats });
    }

    if (action === 'joinPrizePool') {
      if (!address) {
        return NextResponse.json({ error: 'Missing address' }, { status: 400 });
      }

      // Get current data
      const data = getData();

      // Update prize pool
      await updatePrizePool({
        totalAmount: data.prizePool.totalAmount + 1,
        participants: data.prizePool.participants + 1,
      });

      // Update player stats
      const existingStats = await getPlayerStats(address) || {
        address,
        triggerPulls: 0,
        deaths: 0,
        lastPlayed: Date.now(),
        isPaid: false,
      };

      existingStats.isPaid = true;
      await updatePlayerStats(address, existingStats);

      return NextResponse.json({ 
        success: true, 
        prizePool: getData().prizePool 
      });
    }

    if (action === 'distributePrizes') {
      // Get current data
      const data = getData();
      
      // Calculate and distribute prizes to all paid players
      const paidEntries = data.leaderboard.paid.map((entry: any) => ({
        address: entry.address,
        maxStreak: entry.maxStreak || 0,
        totalPulls: entry.triggerPulls || 0,
        totalDeaths: entry.deaths || 0,
      }));

      if (paidEntries.length === 0 || data.prizePool.totalAmount === 0) {
        return NextResponse.json({ 
          error: 'No participants or empty prize pool' 
        }, { status: 400 });
      }

      // Calculate distributions
      const distributions = calculatePrizeDistributionForLeaderboard(
        data.prizePool.totalAmount,
        paidEntries
      );

      // Create distribution log
      const distributionLog = {
        distributionId: distributions[0]?.distributionId || `dist_${Date.now()}`,
        timestamp: Date.now(),
        prizePoolAmount: data.prizePool.totalAmount,
        participants: paidEntries.length,
        distributions,
      };

      // Save log
      saveDistributionLog(distributionLog);

      // Reset prize pool after distribution
      await updatePrizePool({
        totalAmount: 0,
        participants: 0,
      });

      return NextResponse.json({ 
        success: true, 
        distribution: distributionLog,
        prizePool: getData().prizePool 
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

    // ========================================
    // SERVER-AUTHORITATIVE BALANCE OPERATIONS
    // ========================================

    if (action === 'deposit') {
      // Record deposit in server storage
      const { amount } = body;
      
      if (!address || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid deposit data' }, { status: 400 });
      }

      try {
        const updated = await addBalance(address, amount, 'deposit');
        console.log('💰 Deposit recorded:', address, amount, 'USDC');
        return NextResponse.json({ success: true, balance: updated });
      } catch (error) {
        console.error('Error recording deposit:', error);
        return NextResponse.json({ error: 'Failed to record deposit' }, { status: 500 });
      }
    }

    if (action === 'withdraw') {
      // Record withdrawal in server storage
      const { amount } = body;
      
      if (!address || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid withdrawal data' }, { status: 400 });
      }

      try {
        const updated = await deductBalance(address, amount, 'withdrawal');
        console.log('💸 Withdrawal recorded:', address, amount, 'USDC');
        return NextResponse.json({ success: true, balance: updated });
      } catch (error: any) {
        console.error('Error recording withdrawal:', error);
        return NextResponse.json({ 
          error: error.message || 'Failed to record withdrawal' 
        }, { status: 400 });
      }
    }

    if (action === 'approvePrize') {
      // Approve pending prize (move to balance)
      const { amount } = body;
      
      if (!address || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Invalid prize approval data' }, { status: 400 });
      }

      try {
        const updated = await approvePendingPrizeStorage(address, amount);
        console.log('✅ Prize approved:', address, amount, 'USDC');
        return NextResponse.json({ success: true, balance: updated });
      } catch (error: any) {
        console.error('Error approving prize:', error);
        return NextResponse.json({ 
          error: error.message || 'Failed to approve prize' 
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Old updateLeaderboard function removed - now using storage module


