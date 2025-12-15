"use client";
import { motion } from 'framer-motion';

interface GameOverScreenProps {
  onTryAgain: () => void;
  triggerPulls: number;
  deaths: number;
}

export default function GameOverScreen({
  onTryAgain,
  triggerPulls,
  deaths,
}: GameOverScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
    >
      <div className="text-center space-y-8">
        {/* Death Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", duration: 0.8 }}
          className="text-9xl"
        >
          💀
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <h1 className="text-6xl font-bold text-red-500">BANG!</h1>
          <p className="text-3xl text-white">You Died</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 p-6 rounded-2xl border-2 border-gray-700 inline-block"
        >
          <div className="grid grid-cols-2 gap-6 text-white">
            <div>
              <p className="text-gray-400 text-sm">Total Triggers</p>
              <p className="text-3xl font-bold">{triggerPulls}</p>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Total Deaths</p>
              <p className="text-3xl font-bold text-red-500">{deaths}</p>
            </div>
          </div>
        </motion.div>

        {/* Try Again Button */}
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onTryAgain}
          className="relative group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-green-700 rounded-xl blur group-hover:blur-md transition-all" />
          <div className="relative bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-6 px-12 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
            <span className="text-2xl">Try Again</span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}


