import { PlayerStats, LeaderboardEntry, PrizePool } from '../types/game';

const API_BASE = '/api/game';

export async function getLeaderboard(mode: 'free' | 'paid' | 'all' = 'all') {
  try {
    const response = await fetch(`${API_BASE}?action=leaderboard&mode=${mode}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return null;
  }
}

export async function getPlayerStats(address: string) {
  try {
    const response = await fetch(`${API_BASE}?action=stats&address=${address}`);
    const data = await response.json();
    return data.stats;
  } catch (error) {
    console.error('Error fetching player stats:', error);
    return null;
  }
}

export async function getPrizePool() {
  try {
    const response = await fetch(`${API_BASE}?action=prizepool`);
    const data = await response.json();
    return data.prizePool;
  } catch (error) {
    console.error('Error fetching prize pool:', error);
    return null;
  }
}

export async function updatePlayerStats(address: string, stats: PlayerStats) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'updateStats',
        address,
        stats,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating stats:', error);
    return null;
  }
}

export async function joinPrizePool(address: string) {
  try {
    const response = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'joinPrizePool',
        address,
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error joining prize pool:', error);
    return null;
  }
}


