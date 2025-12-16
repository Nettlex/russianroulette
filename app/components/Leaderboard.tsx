"use client";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  address: string;
  name?: string;
  maxStreak: number;
  totalPulls: number;
  totalDeaths: number;
  triggerPulls?: number;
  deaths?: number;
  score?: number;
  rank?: number;
}

export default function Leaderboard({ mode: initialMode }: { mode: 'free' | 'paid' }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeFrame, setTimeFrame] = useState<'all' | 'week' | 'day'>('all');
  const [currentMode, setCurrentMode] = useState<'free' | 'paid'>(initialMode);
  const [loading, setLoading] = useState(true);
  const [prizePool, setPrizePool] = useState(0);

  useEffect(() => {
    // Fetch leaderboard from API (global leaderboard)
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/game?action=leaderboard&mode=${currentMode}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        console.log('Leaderboard API response:', data); // Debug log
        
        if (currentMode === 'paid' && data.prizePool) {
          setPrizePool(data.prizePool.totalAmount || 0);
        }
        
        // Transform API data to match component format
        const entries: LeaderboardEntry[] = (data.leaderboard || []).map((entry: any) => {
          const pulls = entry.triggerPulls || entry.totalPulls || 0;
          const deaths = entry.deaths || entry.totalDeaths || 0;
          const maxStreak = entry.maxStreak || 0;
          const riskMultiplier = 1 + (deaths / Math.max(1, pulls));
          const score = maxStreak * riskMultiplier;
          
          return {
            address: entry.address,
            name: entry.username || entry.name, // Use username from API
            maxStreak,
            totalPulls: pulls,
            totalDeaths: deaths,
            triggerPulls: pulls,
            deaths,
            score,
            rank: entry.rank,
          };
        });

        // Sort by score descending (if not already sorted by API)
        entries.sort((a, b) => (b.score || 0) - (a.score || 0));
        setLeaderboard(entries);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, [currentMode, timeFrame]);

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-md mx-auto w-full">
      <div className="pt-4 pb-6">
        <h1 className="text-3xl font-bold text-center text-yellow-400 mb-2">
          🏆 LEADERBOARD
        </h1>
        <p className="text-center text-xs text-gray-500 mb-3">
          {currentMode === 'free' ? 'Free Play Rankings' : 'USDC Prize Pool Rankings'}
        </p>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 justify-center mb-3">
          <button
            onClick={() => setCurrentMode('free')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentMode === 'free'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🆓 Free
          </button>
          <button
            onClick={() => setCurrentMode('paid')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              currentMode === 'paid'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            💰 USDC
          </button>
        </div>
      </div>

      {/* Time Frame Selector */}
      <div className="flex gap-2 mb-6">
        {(['all', 'week', 'day'] as const).map((tf) => (
          <button
            key={tf}
            onClick={() => setTimeFrame(tf)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${
              timeFrame === tf
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tf === 'all' ? 'All Time' : tf === 'week' ? 'This Week' : 'Today'}
          </button>
        ))}
      </div>

      {/* Leaderboard List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4 animate-pulse">⏳</p>
            <p>Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">👻</p>
            <p>No players yet. Be the first!</p>
            <p className="text-xs mt-2 text-gray-600">
              Play the game to appear on the leaderboard
            </p>
          </div>
        ) : (
          leaderboard.map((entry, index) => (
            <motion.div
              key={entry.address}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-gray-900/50 border rounded-lg p-4 ${
                index === 0
                  ? 'border-yellow-500 bg-gradient-to-r from-yellow-900/20 to-gray-900/50'
                  : index === 1
                  ? 'border-gray-400'
                  : index === 2
                  ? 'border-amber-700'
                  : 'border-gray-800'
              }`}
            >
              <div className="flex items-center justify-between">
                {/* Rank & Name */}
                <div className="flex items-center gap-3">
                  <div className={`text-2xl font-bold ${
                    index === 0 ? 'text-yellow-400' :
                    index === 1 ? 'text-gray-300' :
                    index === 2 ? 'text-amber-600' :
                    'text-gray-600'
                  }`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div>
                    {entry.name ? (
                      <>
                        <p className="font-bold text-sm text-white">
                          {entry.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-sm">
                        {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                      </p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      Streak: {entry.maxStreak} • Deaths: {entry.totalDeaths} • Pulls: {entry.totalPulls}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">{(entry.score || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">Score</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Prize Pool Info (if paid mode) */}
      {currentMode === 'paid' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700 rounded-xl p-6"
        >
          <h3 className="text-xl font-bold text-yellow-400 mb-2 text-center">
            💰 Weekly Prize Pool
          </h3>
          <p className="text-3xl font-bold text-center text-white mb-2">
            {prizePool.toFixed(2)} USDC
          </p>
          <p className="text-xs text-gray-400 text-center">
            Distributed every Sunday at midnight
          </p>
          <div className="mt-4 pt-4 border-t border-yellow-800/50">
            <div className="space-y-1 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>1st Place:</span>
                <span className="text-yellow-400">50%</span>
              </div>
              <div className="flex justify-between">
                <span>2nd Place:</span>
                <span className="text-gray-300">30%</span>
              </div>
              <div className="flex justify-between">
                <span>3rd Place:</span>
                <span className="text-amber-600">20%</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
