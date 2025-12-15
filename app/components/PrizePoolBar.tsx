"use client";
import { motion } from 'framer-motion';
import { PrizePool } from '../types/game';

interface PrizePoolBarProps {
  prizePool: PrizePool;
  isPaidMode: boolean;
}

export default function PrizePoolBar({ prizePool, isPaidMode }: PrizePoolBarProps) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-black/80 backdrop-blur-md border-b border-yellow-900/30 py-3 px-4"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Prize Pool Amount */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500 text-2xl">💰</span>
            <div>
              <p className="text-xs text-gray-600">PRIZE POOL</p>
              <motion.p
                className="text-2xl font-bold text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                {prizePool.totalAmount} USDC
              </motion.p>
            </div>
          </div>

          {/* Visual bar showing growth */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-48 h-3 bg-black rounded-full border border-yellow-900/30 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.6)]"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((prizePool.totalAmount / 100) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            <span className="text-xs text-gray-600">
              {prizePool.participants} players
            </span>
          </div>
        </div>

        {/* Distribution Preview */}
        <div className="hidden lg:flex items-center gap-4 text-xs">
          <div className="text-center">
            <p className="text-gray-600">🥇 1st</p>
            <p className="text-yellow-400 font-bold">{(prizePool.totalAmount * 0.4).toFixed(1)} USDC</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">🥈 2nd</p>
            <p className="text-gray-400 font-bold">{(prizePool.totalAmount * 0.25).toFixed(1)} USDC</p>
          </div>
          <div className="text-center">
            <p className="text-gray-600">🥉 3rd</p>
            <p className="text-orange-400 font-bold">{(prizePool.totalAmount * 0.15).toFixed(1)} USDC</p>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 bg-green-500 rounded-full"
            animate={{
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
          <span className="text-xs text-gray-600">LIVE</span>
        </div>
      </div>
    </motion.div>
  );
}

