"use client";
import { motion, AnimatePresence } from 'framer-motion';

interface RevolverChamberProps {
  bulletPosition: number | null;
  currentChamber: number;
  isSpinning: boolean;
  showBullet: boolean;
  isLoading?: boolean;
  showMuzzleFlash?: boolean;
  chamberOpen?: boolean;
  onChamberClick?: () => void;
  isFacingPlayer?: boolean;
}

const CHAMBERS_COUNT = 8;

export default function RevolverChamber({
  bulletPosition,
  currentChamber,
  isSpinning,
  showBullet,
  isLoading = false,
  showMuzzleFlash = false,
  chamberOpen = false,
  onChamberClick,
  isFacingPlayer = true,
}: RevolverChamberProps) {
  const chambers = Array.from({ length: CHAMBERS_COUNT }, (_, i) => i);
  const canClickToSpin = chamberOpen && bulletPosition !== null && !isSpinning;
  
  return (
    <div className="relative w-full max-w-lg h-[500px] flex items-center justify-center">
      {/* Instruction overlay when chamber is open */}
      {chamberOpen && !isFacingPlayer && canClickToSpin && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-10 left-1/2 transform -translate-x-1/2 z-50 bg-black/90 backdrop-blur-md px-6 py-3 rounded-xl border-2 border-yellow-500/50"
        >
          <motion.p
            className="text-yellow-400 font-bold text-lg"
            animate={{
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          >
            👆 Click Barrel to Spin!
          </motion.p>
        </motion.div>
      )}
      {/* Muzzle Flash Effect */}
      <AnimatePresence>
        {showMuzzleFlash && (
          <motion.div
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50"
          >
            <div className="w-full h-full bg-orange-500 rounded-full blur-3xl opacity-90" />
            <div className="absolute inset-0 w-full h-full bg-red-500 rounded-full blur-2xl opacity-70" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete Gun Assembly */}
      <motion.div 
        className="absolute inset-0 flex items-center justify-center"
        animate={isFacingPlayer ? {} : {
          rotateY: 180,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="relative">
          {/* Gun Barrel - Clickable to spin */}
          <motion.div 
            className={`relative z-20 opacity-40 ${canClickToSpin ? 'cursor-pointer' : ''}`}
            animate={showMuzzleFlash ? { y: [0, -8, 0], opacity: 1 } : canClickToSpin ? {
              opacity: [0.4, 0.7, 0.4],
            } : {}}
            transition={{ duration: canClickToSpin ? 2 : 0.15, repeat: canClickToSpin ? Infinity : 0 }}
            style={{ transform: 'translateY(-20px)' }}
            onClick={canClickToSpin ? onChamberClick : undefined}
            whileHover={canClickToSpin ? { scale: 1.05 } : {}}
          >
            {/* Barrel */}
            <div className="w-24 h-48 bg-gradient-to-b from-gray-900 via-black to-black rounded-t-3xl shadow-[inset_0_-2px_15px_rgba(0,0,0,0.9)] border-2 border-black mx-auto">
              {/* Barrel opening - dark and menacing */}
              <div className="w-16 h-16 bg-black rounded-full mx-auto mt-4 shadow-[inset_0_0_25px_rgba(0,0,0,1)] border-4 border-gray-950 ring-2 ring-black" />
              {/* Subtle metallic highlight */}
              <div className="w-4 h-20 bg-gray-800/10 absolute top-8 left-8 blur-sm" />
            </div>
            {/* Frame connection */}
            <div className="w-28 h-10 bg-gradient-to-b from-black to-black mx-auto -mt-2 rounded-b-xl shadow-2xl border-x-2 border-black opacity-80" />
          </motion.div>

          {/* Gun Handle/Grip - Barely visible in darkness */}
          <div className="absolute top-[180px] left-1/2 transform -translate-x-1/2 z-10 opacity-30">
            {/* Trigger guard */}
            <div className="w-20 h-16 border-4 border-gray-950 rounded-b-3xl bg-gradient-to-b from-transparent to-black/50 relative">
              {/* Trigger */}
              <motion.div 
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-3 h-6 bg-gray-900 rounded-sm shadow-lg"
                whileHover={{ y: 2 }}
              />
            </div>
            {/* Grip/Handle */}
            <div className="w-16 h-24 bg-gradient-to-br from-gray-950 via-black to-black mx-auto -mt-2 rounded-b-2xl shadow-2xl border-2 border-black relative overflow-hidden">
              {/* Wood grain texture - barely visible */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-1 bg-gray-900 mt-2" />
                <div className="w-full h-1 bg-gray-900 mt-3" />
                <div className="w-full h-1 bg-gray-900 mt-3" />
                <div className="w-full h-1 bg-gray-900 mt-3" />
              </div>
              {/* Grip texture */}
              <div className="absolute inset-2 grid grid-cols-3 gap-1 opacity-20">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div key={i} className="w-1 h-1 bg-gray-900 rounded-full" />
                ))}
              </div>
              {/* Subtle highlight */}
              <div className="absolute top-2 left-2 w-4 h-8 bg-gray-800 opacity-10 blur-sm rounded-l-full" />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Revolver Chamber Cylinder - Opens sideways */}
      <motion.div
        className="absolute top-[120px] left-1/2 transform -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-br from-gray-900 via-black to-black shadow-[0_0_50px_rgba(0,0,0,0.9)] border-4 border-black z-10"
        style={{
          boxShadow: '0 20px 60px rgba(0,0,0,0.95), inset 0 0 30px rgba(0,0,0,0.9)',
        }}
        animate={{
          rotate: isSpinning ? [currentChamber * (360 / CHAMBERS_COUNT), currentChamber * (360 / CHAMBERS_COUNT) + 720] : currentChamber * (360 / CHAMBERS_COUNT),
          x: chamberOpen && !isFacingPlayer ? 80 : 0,
          opacity: chamberOpen && !isFacingPlayer ? 1 : isFacingPlayer ? 0.6 : 1,
        }}
        transition={{
          duration: isSpinning ? 1.5 : 0.5,
          ease: isSpinning ? [0.43, 0.13, 0.23, 0.96] : "easeOut",
        }}
      >
        {/* Chamber holes */}
        {chambers.map((chamber) => {
          const angle = (chamber * 360) / CHAMBERS_COUNT;
          const radian = (angle * Math.PI) / 180;
          const radius = 95;
          const x = Math.cos(radian) * radius;
          const y = Math.sin(radian) * radius;
          
          const hasBullet = bulletPosition === chamber;
          const isCurrent = currentChamber === chamber;
          const isLoadingThis = isLoading && hasBullet;
          
          return (
            <div
              key={chamber}
              className="absolute w-12 h-12 transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `calc(50% + ${x}px)`,
                top: `calc(50% + ${y}px)`,
              }}
            >
              <motion.div
                className={`w-full h-full rounded-full border-3 shadow-lg relative overflow-hidden ${
                  isCurrent
                    ? 'border-red-600 shadow-red-600/70 bg-gradient-to-br from-gray-900 to-black ring-2 ring-red-500/50'
                    : 'border-gray-950 bg-gradient-to-br from-black to-black'
                }`}
                animate={isCurrent ? {
                  boxShadow: [
                    '0 0 10px rgba(239, 68, 68, 0.5)',
                    '0 0 20px rgba(239, 68, 68, 0.8)',
                    '0 0 10px rgba(239, 68, 68, 0.5)',
                  ],
                } : {}}
                transition={{ duration: 1, repeat: Infinity }}
                style={{
                  boxShadow: isCurrent ? '0 0 15px rgba(239, 68, 68, 0.6), inset 0 0 10px rgba(0,0,0,0.8)' : 'inset 0 0 10px rgba(0,0,0,0.9)',
                }}
              >
                {/* Show bullet - visible when chamber is open and facing away */}
                <AnimatePresence>
                  {hasBullet && ((chamberOpen && !isFacingPlayer) || showBullet || isLoadingThis) && (
                    <motion.div
                      initial={isLoadingThis ? { scale: 0, y: -20 } : { scale: 1 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", duration: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <div className="w-6 h-8 bg-gradient-to-b from-amber-600 via-amber-700 to-amber-900 rounded-full shadow-lg relative">
                        {/* Bullet tip */}
                        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-4 h-3 bg-gradient-to-b from-gray-400 to-gray-600 rounded-t-full" />
                        {/* Bullet shine */}
                        <div className="absolute top-2 left-1 w-2 h-2 bg-yellow-400 rounded-full opacity-60 blur-sm" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Empty chamber detail */}
                {!hasBullet && (
                  <div className="absolute inset-2 rounded-full bg-black opacity-80" />
                )}
              </motion.div>
            </div>
          );
        })}
        
        {/* Center cylinder pin - more detailed */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full shadow-2xl border-4 border-gray-900 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-900">
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-gray-800 to-black shadow-inner" />
          <div className="absolute top-2 left-3 w-3 h-3 bg-gray-600 rounded-full opacity-40 blur-sm" />
        </div>

        {/* Cylinder edge details */}
        <div className="absolute inset-0 rounded-full border-2 border-gray-700 opacity-30" style={{ transform: 'scale(0.95)' }} />
        <div className="absolute inset-0 rounded-full border-2 border-gray-900 opacity-50" style={{ transform: 'scale(1.02)' }} />
      </motion.div>

      {/* Spinning indicator */}
      {isSpinning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-yellow-400 font-bold text-lg"
        >
          SPINNING...
        </motion.div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-amber-400 font-bold text-lg"
        >
          LOADING BULLET...
        </motion.div>
      )}
    </div>
  );
}


