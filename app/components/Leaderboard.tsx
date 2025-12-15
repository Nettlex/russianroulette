"use client";
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

interface LeaderboardEntry {
  address: string;
  name?: string;
  maxStreak: number;
  totalPulls: number;
  totalDeaths: number;
  score: number;
}

export default function Leaderboard({ mode: initialMode }: { mode: 'free' | 'paid' }) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeFrame, setTimeFrame] = useState<'all' | 'week' | 'day'>('all');
  const [currentMode, setCurrentMode] = useState<'free' | 'paid'>(initialMode);

  useEffect(() => {
    // Load leaderboard data from localStorage - separate for free and paid
    const prefix = currentMode === 'free' ? 'stats_free_' : 'stats_paid_';
    const keys = Object.keys(localStorage).filter(k => k.startsWith(prefix));
    const entries: LeaderboardEntry[] = keys.map(key => {
      const address = key.replace(prefix, '');
      const stats = JSON.parse(localStorage.getItem(key) || '{}');
      const riskMultiplier = 1 + (stats.totalDeaths / Math.max(1, stats.totalPulls));
      const score = stats.maxStreak * riskMultiplier;
      
      return {
        address,
        maxStreak: stats.maxStreak || 0,
        totalPulls: stats.totalPulls || 0,
        totalDeaths: stats.totalDeaths || 0,
        score: score || 0,
      };
    });

    // Sort by score descending
    entries.sort((a, b) => b.score - a.score);
    setLeaderboard(entries.slice(0, 50)); // Top 50
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
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-4">👻</p>
            <p>No players yet. Be the first!</p>
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
                    <p className="font-bold text-sm">
                      {entry.name || `${entry.address.slice(0, 6)}...${entry.address.slice(-4)}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Streak: {entry.maxStreak} • Deaths: {entry.totalDeaths} • Pulls: {entry.totalPulls}
                    </p>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-400">{entry.score.toFixed(2)}</p>
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
            {leaderboard.length} USDC
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
