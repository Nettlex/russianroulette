"use client";
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Wallet, ConnectWallet } from '@coinbase/onchainkit/wallet';
import { Identity, Avatar, Name, Address } from '@coinbase/onchainkit/identity';

interface ProfileProps {
  playerStats: {
    totalPulls: number;
    totalDeaths: number;
    maxStreak: number;
  };
  userBalance: number;
  onDeposit: () => void;
  onWithdraw: () => void;
}

export default function Profile({ playerStats, userBalance, onDeposit, onWithdraw }: ProfileProps) {
  const { address, isConnected } = useAccount();

  const calculateScore = (maxStreak: number, totalPulls: number, totalDeaths: number) => {
    const riskMultiplier = 1 + (totalDeaths / Math.max(1, totalPulls));
    return maxStreak * riskMultiplier;
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 max-w-md mx-auto w-full">
      <div className="pt-4 pb-6">
        <h1 className="text-3xl font-bold text-center text-blue-400 mb-2">
          👤 PROFILE
        </h1>
      </div>

      {/* Wallet Section */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 text-gray-300">Wallet</h2>
        
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12" />
              <div className="flex-1">
                <Name className="font-bold" />
                <Address className="text-xs text-gray-500" />
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Game Balance</p>
              <p className="text-3xl font-bold text-yellow-400">{userBalance.toFixed(2)} USDC</p>
            </div>
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={onDeposit}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-all"
              >
                + Deposit
              </button>
              <button
                onClick={onWithdraw}
                disabled={userBalance === 0}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50"
              >
                Withdraw
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-gray-400 mb-4">Connect wallet to view balance</p>
            <div className="flex justify-center">
              <Wallet>
                <ConnectWallet className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg">
                  Connect Wallet
                </ConnectWallet>
              </Wallet>
            </div>
          </div>
        )}
      </div>

      {/* Stats Section */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 text-gray-300">Statistics</h2>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Max Streak</span>
            <span className="text-2xl font-bold text-green-400">{playerStats.maxStreak}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Pulls</span>
            <span className="text-xl font-bold text-white">{playerStats.totalPulls}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Total Deaths</span>
            <span className="text-xl font-bold text-red-400">{playerStats.totalDeaths}</span>
          </div>
          
          <div className="flex justify-between items-center pt-4 border-t border-gray-800">
            <span className="text-gray-400">Risk Ratio</span>
            <span className="text-lg font-bold text-orange-400">
              {(playerStats.totalDeaths / Math.max(1, playerStats.totalPulls)).toFixed(3)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Score</span>
            <span className="text-2xl font-bold text-blue-400">
              {calculateScore(playerStats.maxStreak, playerStats.totalPulls, playerStats.totalDeaths).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-3">
        <button className="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-lg transition-all">
          Reset Stats
        </button>
        <button className="w-full bg-red-900/40 hover:bg-red-800/50 border border-red-700 text-red-400 py-3 rounded-lg transition-all">
          Delete Account Data
        </button>
        
        {/* Admin Access Link */}
        <a
          href="/admin/withdrawals"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full bg-purple-900/40 hover:bg-purple-800/50 border border-purple-700 text-purple-400 py-3 rounded-lg transition-all text-center block text-sm"
        >
          🔐 Admin Dashboard (Withdrawals)
        </a>
      </div>
    </div>
  );
}

