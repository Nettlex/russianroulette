"use client";
import { motion } from 'framer-motion';

interface BulletItemProps {
  onLoadBullet: () => void;
  isLoading: boolean;
  canLoad: boolean;
}

export default function BulletItem({ onLoadBullet, isLoading, canLoad }: BulletItemProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <motion.button
        onClick={canLoad ? onLoadBullet : undefined}
        disabled={!canLoad}
        className={`relative group ${canLoad ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
        whileHover={canLoad ? { scale: 1.1, y: -5 } : {}}
        whileTap={canLoad ? { scale: 0.95 } : {}}
      >
        {/* Glow effect */}
        {canLoad && (
          <motion.div
            className="absolute inset-0 blur-xl bg-amber-500/50 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          />
        )}

        {/* The Bullet */}
        <motion.div
          className="relative w-24 h-32 flex items-center justify-center"
          animate={isLoading ? {
            y: [0, -100],
            opacity: [1, 0],
          } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Bullet casing */}
          <div className="relative">
            {/* Brass casing */}
            <div className="w-16 h-24 bg-gradient-to-b from-amber-400 via-amber-500 to-amber-700 rounded-b-2xl shadow-2xl relative overflow-hidden border-2 border-amber-600">
              {/* Metallic shine */}
              <div className="absolute top-4 left-2 w-6 h-12 bg-gradient-to-r from-amber-200 to-transparent opacity-60 blur-sm" />
              <div className="absolute top-8 right-2 w-4 h-8 bg-gradient-to-l from-amber-300 to-transparent opacity-40" />
              
              {/* Rim detail */}
              <div className="absolute bottom-0 w-full h-3 bg-amber-600 border-t-2 border-amber-700" />
              
              {/* Side grooves */}
              <div className="absolute inset-x-2 top-4 space-y-2">
                <div className="h-px bg-amber-800 opacity-30" />
                <div className="h-px bg-amber-800 opacity-30" />
                <div className="h-px bg-amber-800 opacity-30" />
              </div>
            </div>
            
            {/* Bullet tip */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-10 bg-gradient-to-b from-gray-400 via-gray-500 to-gray-600 rounded-t-full shadow-lg border-2 border-gray-600">
              {/* Tip shine */}
              <div className="absolute top-1 left-2 w-4 h-3 bg-gray-300 rounded-full opacity-60 blur-[2px]" />
            </div>

            {/* Primer (bottom) */}
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-4 bg-gradient-to-b from-gray-600 to-gray-800 rounded-full border border-gray-900" />
          </div>
        </motion.div>

        {/* Shadow */}
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-4 bg-black/40 rounded-full blur-md" />
      </motion.button>

      {/* Instruction text */}
      <motion.p
        className="text-amber-400 text-sm font-bold text-center"
        animate={canLoad ? {
          opacity: [0.6, 1, 0.6],
        } : {}}
        transition={{
          duration: 2,
          repeat: Infinity,
        }}
      >
        {isLoading ? 'LOADING...' : canLoad ? 'Click to Load' : 'Bullet Loaded'}
      </motion.p>
    </div>
  );
}

