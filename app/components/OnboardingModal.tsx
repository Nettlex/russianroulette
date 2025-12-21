'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      emoji: '🎲',
      title: 'Welcome to Russian Roulette',
      description: 'A game of chance built onchain. Test your luck and compete on the leaderboard!',
      bullets: [
        'Transparent onchain odds',
        'Global competitive leaderboards',
        'Built on Base for fast gameplay',
      ],
    },
    {
      emoji: '🔫',
      title: 'How to Play',
      description: 'Pull the trigger and survive 7 rounds:',
      bullets: [
        '1️⃣ Connect your wallet',
        '2️⃣ Deposit USDC or ETH to play',
        '3️⃣ Pull the trigger (1 in 6 chance)',
        '4️⃣ Survive 7 pulls to complete the round',
        '5️⃣ Cash out anytime to save your streak',
      ],
    },
    {
      emoji: '🏆',
      title: 'Compete',
      description: 'Build streaks and climb the leaderboard:',
      bullets: [
        '📊 Track your stats & max streak',
        '🥇 Compete with players globally',
        '⚡ Fast onchain transactions on Base',
        '🎮 For entertainment purposes only',
      ],
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      localStorage.setItem('hasSeenOnboarding', 'true');
    }
  };

  const handleSkip = () => {
    onClose();
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={handleSkip}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-blue-500 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mb-6">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-8 bg-blue-500'
                      : index < currentStep
                      ? 'w-2 bg-blue-700'
                      : 'w-2 bg-gray-700'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">{steps[currentStep].emoji}</div>
                <h2 className="text-2xl font-bold text-white mb-3">
                  {steps[currentStep].title}
                </h2>
                <p className="text-gray-300 mb-6">
                  {steps[currentStep].description}
                </p>
                <div className="bg-gray-800/50 rounded-lg p-4 mb-6 text-left">
                  {steps[currentStep].bullets.map((bullet, index) => (
                    <p key={index} className="text-sm text-gray-300 mb-2 last:mb-0">
                      {bullet}
                    </p>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-all"
              >
                Skip
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
              >
                {currentStep < steps.length - 1 ? 'Next' : 'Start Playing'}
              </button>
            </div>

            {/* Step indicator */}
            <p className="text-center text-gray-500 text-xs mt-4">
              {currentStep + 1} of {steps.length}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

