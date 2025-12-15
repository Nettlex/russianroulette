"use client";
import { motion } from 'framer-motion';

interface GameControlsProps {
  onLoadBullet: () => void;
  onSpin: () => void;
  onFire: () => void;
  onPayAndPlay: () => void;
  gameState: {
    bulletPosition: number | null;
    isSpinning: boolean;
    isPaid: boolean;
  };
  isConnected: boolean;
}

export default function GameControls({
  onLoadBullet,
  onSpin,
  onFire,
  onPayAndPlay,
  gameState,
  isConnected,
}: GameControlsProps) {
  const canLoadBullet = gameState.bulletPosition === null && !gameState.isSpinning;
  const canSpin = gameState.bulletPosition !== null && !gameState.isSpinning;
  const canFire = !gameState.isSpinning && gameState.bulletPosition !== null;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {/* Load Bullet Button */}
      {canLoadBullet && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
          onClick={onLoadBullet}
          disabled={!canLoadBullet}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-600 to-yellow-700 rounded-xl blur group-hover:blur-md transition-all" />
          <div className="relative bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🔫</span>
              <span>Load Bullet</span>
            </div>
          </div>
        </motion.button>
      )}

      {/* Spin Button */}
      {canSpin && !gameState.isSpinning && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
          onClick={onSpin}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl blur group-hover:blur-md transition-all" />
          <div className="relative bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-2xl transition-all">
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🔄</span>
              <span>Spin Chamber</span>
            </div>
          </div>
        </motion.button>
      )}

      {/* Fire Button */}
      {canFire && !gameState.isSpinning && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
          onClick={onFire}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-xl blur group-hover:blur-md transition-all" />
          <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-6 px-8 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl">💥</span>
              <span className="text-xl">FIRE!</span>
            </div>
          </div>
        </motion.button>
      )}

      {/* Payment Options */}
      {!gameState.isPaid && isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-gray-800 rounded-xl border-2 border-gray-700"
        >
          <p className="text-center text-gray-300 text-sm mb-3">
            Join the prize pool for a chance to win!
          </p>
          <button
            onClick={onPayAndPlay}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-2xl transition-all hover:scale-105"
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">💰</span>
              <span>Play for 1 USDC</span>
            </div>
          </button>
        </motion.div>
      )}

      {gameState.isPaid && (
        <div className="text-center p-2 bg-green-900 text-green-200 rounded-lg">
          <span className="text-sm">✓ Entered in Prize Pool</span>
        </div>
      )}
    </div>
  );
}


