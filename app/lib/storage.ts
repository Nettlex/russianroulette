/**
 * Edge Config storage for leaderboard data
 * Uses Vercel Edge Config for global, persistent storage
 * All server instances share the same data instantly
 */

import { get } from '@vercel/edge-config';

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

export interface PlayerBalance {
  balance: number;
  pendingPrizes: number;
  totalDeposited: number;
  totalWithdrawn: number;
  lastUpdated: number;
}

interface StorageData {
  leaderboard: {
    free: LeaderboardEntry[];
    paid: LeaderboardEntry[];
  };
  prizePool: {
    totalAmount: number;
    participants: number;
    lastUpdated: number;
  };
  playerStats: Record<string, any>;
  playerBalances: Record<string, PlayerBalance>; // NEW: Server-side balances
}

// In-memory cache (syncs with Edge Config)
let cachedData: StorageData = {
  leaderboard: {
    free: [],
    paid: [],
  },
  prizePool: {
    totalAmount: 0,
    participants: 0,
    lastUpdated: Date.now(),
  },
  playerStats: {},
  playerBalances: {}, // NEW: Server-side balances
};

let lastFetch = 0;
const CACHE_TTL = 5000; // ⚠️ REDUCED: 5 seconds cache (was 30s) - minimize stale data on cold starts

/**
 * Load data from Edge Config
 * 
 * ⚠️ CRITICAL: Always tries Edge Config first!
 * Cache is ONLY used as fallback on errors, not for performance.
 */
export async function loadData(): Promise<StorageData> {
  try {
    const now = Date.now();
    
    // ✅ FIX: ALWAYS fetch from Edge Config (don't trust cache on serverless!)
    // Cache check removed to prevent stale data on cold starts
    console.log('🌐 Fetching fresh data from Edge Config (no cache)...');
    
    // Fetch from Edge Config
    const data = await get<StorageData>('game-data');
    
    if (data) {
      cachedData = data;
      lastFetch = now;
      console.log('🌐 Loaded data from Edge Config:', {
        freeLeaderboard: data.leaderboard?.free?.length || 0,
        paidLeaderboard: data.leaderboard?.paid?.length || 0,
        playerStats: Object.keys(data.playerStats || {}).length,
        prizePool: data.prizePool?.totalAmount || 0
      });
      return data;
    } else {
      // Edge Config is empty - DON'T overwrite!
      // Return cached data without saving (let init-edge-config API handle initialization)
      console.log('⚠️ No data in Edge Config - using empty cache (not overwriting!)');
      return cachedData;
    }
  } catch (error) {
    console.log('⚠️ Edge Config error, using cache:', error instanceof Error ? error.message : 'Unknown');
    return cachedData;
  }
}

/**
 * Save data to Edge Config
 */
export async function saveData(data: StorageData): Promise<void> {
  // Update cache immediately
  cachedData = data;
  lastFetch = Date.now();
  
  const edgeConfigId = process.env.EDGE_CONFIG_ID;
  const vercelToken = process.env.VERCEL_TOKEN;
  
  if (!edgeConfigId || !vercelToken) {
    console.error('❌ Cannot save: Missing EDGE_CONFIG_ID or VERCEL_TOKEN');
    return;
  }
  
  try {
    console.log('💾 Saving to Edge Config...', {
      freeLeaderboard: data.leaderboard?.free?.length || 0,
      paidLeaderboard: data.leaderboard?.paid?.length || 0,
      playerStats: Object.keys(data.playerStats || {}).length,
    });
    
    // Save directly to Edge Config via Vercel API
    const response = await fetch(
      `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              operation: 'upsert',
              key: 'game-data',
              value: data,
            },
          ],
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to save to Edge Config:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
    } else {
      const result = await response.json();
      console.log('✅ Successfully saved to Edge Config!', result);
    }
  } catch (error) {
    console.error('❌ Error saving to Edge Config:', error instanceof Error ? error.message : 'Unknown');
  }
}

/**
 * Get current data (from cache)
 */
export function getData(): StorageData {
  console.log('📊 getData called - current cache:', {
    freeLeaderboard: cachedData.leaderboard?.free?.length || 0,
    paidLeaderboard: cachedData.leaderboard?.paid?.length || 0,
    playerStats: Object.keys(cachedData.playerStats || {}).length
  });
  return cachedData;
}

/**
 * Update leaderboard entry
 */
export async function updateLeaderboardEntry(
  mode: 'free' | 'paid',
  entry: LeaderboardEntry
): Promise<void> {
  // ✅ FIX: ALWAYS load fresh data before writing to prevent overwriting!
  const data = await loadData();
  const board = data.leaderboard[mode];
  
  // Remove existing entry
  const index = board.findIndex(
    (e) => e.address.toLowerCase() === entry.address.toLowerCase()
  );
  if (index >= 0) {
    board.splice(index, 1);
  }
  
  // Add new entry
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
  
  // Update ranks
  board.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });
  
  await saveData(data);
}

/**
 * Update player stats
 */
export async function updatePlayerStats(
  address: string,
  stats: any
): Promise<void> {
  // ✅ FIX: ALWAYS load fresh data before writing to prevent overwriting!
  const data = await loadData();
  data.playerStats[address] = {
    ...data.playerStats[address],
    ...stats,
    lastUpdated: Date.now(),
  };
  
  await saveData(data);
}

/**
 * Get player stats
 */
export async function getPlayerStats(address: string): Promise<any> {
  // ✅ FIX: Load fresh data to avoid returning stale cache
  const data = await loadData();
  return data.playerStats[address] || null;
}

/**
 * Update prize pool
 */
export async function updatePrizePool(update: {
  totalAmount?: number;
  participants?: number;
}): Promise<void> {
  // ✅ FIX: ALWAYS load fresh data before writing to prevent overwriting!
  const data = await loadData();
  data.prizePool = {
    ...data.prizePool,
    ...update,
    lastUpdated: Date.now(),
  };
  
  await saveData(data);
}

/**
 * Initialize storage (call on server startup)
 */
export async function initStorage(): Promise<void> {
  await loadData();
}

// ========================================
// SERVER-AUTHORITATIVE BALANCE MANAGEMENT
// ========================================

/**
 * Get player balance from server
 */
export async function getPlayerBalance(address: string): Promise<PlayerBalance> {
  // ✅ FIX: Load fresh data to avoid returning stale cache
  const data = await loadData();
  return data.playerBalances[address] || {
    balance: 0,
    pendingPrizes: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Add balance (deposit or prize)
 */
export async function addBalance(
  address: string,
  amount: number,
  type: 'deposit' | 'prize'
): Promise<PlayerBalance> {
  // ✅ FIX: ALWAYS load fresh data before writing to prevent overwriting!
  const data = await loadData();
  const current = data.playerBalances[address] || {
    balance: 0,
    pendingPrizes: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    lastUpdated: Date.now(),
  };
  
  const updated: PlayerBalance = {
    ...current,
    balance: current.balance + amount,
    totalDeposited: type === 'deposit' ? current.totalDeposited + amount : current.totalDeposited,
    lastUpdated: Date.now(),
  };
  
  data.playerBalances[address] = updated;
  await saveData(data);
  
  console.log(`💰 Added ${amount} USDC to ${address} (${type}), new balance: ${updated.balance}`);
  return updated;
}

/**
 * Deduct balance (bet or withdrawal)
 */
export async function deductBalance(
  address: string,
  amount: number,
  type: 'bet' | 'withdrawal'
): Promise<PlayerBalance> {
  // ✅ FIX: ALWAYS load fresh data before writing to prevent overwriting!
  const data = await loadData();
  const current = data.playerBalances[address] || {
    balance: 0,
    pendingPrizes: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    lastUpdated: Date.now(),
  };
  
  if (current.balance < amount) {
    throw new Error(`Insufficient balance: have ${current.balance}, need ${amount}`);
  }
  
  const updated: PlayerBalance = {
    ...current,
    balance: current.balance - amount,
    totalWithdrawn: type === 'withdrawal' ? current.totalWithdrawn + amount : current.totalWithdrawn,
    lastUpdated: Date.now(),
  };
  
  data.playerBalances[address] = updated;
  await saveData(data);
  
  console.log(`💸 Deducted ${amount} USDC from ${address} (${type}), new balance: ${updated.balance}`);
  return updated;
}

/**
 * Add pending prize (to be claimed later)
 */
export async function addPendingPrize(
  address: string,
  amount: number
): Promise<PlayerBalance> {
  // ✅ FIX: ALWAYS load fresh data before writing to prevent overwriting!
  const data = await loadData();
  const current = data.playerBalances[address] || {
    balance: 0,
    pendingPrizes: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    lastUpdated: Date.now(),
  };
  
  const updated: PlayerBalance = {
    ...current,
    pendingPrizes: current.pendingPrizes + amount,
    lastUpdated: Date.now(),
  };
  
  data.playerBalances[address] = updated;
  await saveData(data);
  
  console.log(`🎁 Added ${amount} USDC pending prize for ${address}, total pending: ${updated.pendingPrizes}`);
  return updated;
}

/**
 * Approve pending prize (move to balance)
 */
export async function approvePendingPrize(
  address: string,
  amount: number
): Promise<PlayerBalance> {
  // ✅ FIX: ALWAYS load fresh data before writing to prevent overwriting!
  const data = await loadData();
  const current = data.playerBalances[address] || {
    balance: 0,
    pendingPrizes: 0,
    totalDeposited: 0,
    totalWithdrawn: 0,
    lastUpdated: Date.now(),
  };
  
  if (current.pendingPrizes < amount) {
    throw new Error(`Insufficient pending prizes: have ${current.pendingPrizes}, trying to approve ${amount}`);
  }
  
  const updated: PlayerBalance = {
    ...current,
    balance: current.balance + amount,
    pendingPrizes: current.pendingPrizes - amount,
    lastUpdated: Date.now(),
  };
  
  data.playerBalances[address] = updated;
  await saveData(data);
  
  console.log(`✅ Approved ${amount} USDC prize for ${address}, new balance: ${updated.balance}`);
  return updated;
}


