"use client";
import { motion, AnimatePresence } from 'framer-motion';

interface ChamberReloadAnimationProps {
  show: boolean;
  chambersCleared: number;
}

export default function ChamberReloadAnimation({ show, chambersCleared }: ChamberReloadAnimationProps) {
  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        exit={{ scale: 0, rotate: 180 }}
        className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-40 pointer-events-none"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
          }}
          className="text-center space-y-4"
        >
          <div className="text-8xl">🎉</div>
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white px-8 py-4 rounded-2xl shadow-2xl">
            <p className="text-3xl font-bold">SURVIVED!</p>
            <p className="text-xl mt-2">7 Shots Cleared</p>
            {chambersCleared > 0 && (
              <p className="text-sm mt-2 opacity-90">
                Total Rounds: {chambersCleared + 1}
              </p>
            )}
          </div>
          <p className="text-white text-lg">Loading new bullet...</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


