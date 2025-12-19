"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface UsernameModalProps {
  isOpen: boolean;
  currentUsername?: string;
  onSave: (username: string) => void;
  onClose: () => void;
}

export default function UsernameModal({ isOpen, currentUsername, onSave, onClose }: UsernameModalProps) {
  const [username, setUsername] = useState(currentUsername || '');
  const [error, setError] = useState('');

  const handleSave = () => {
    // Validate username
    if (!username.trim()) {
      setError('Username cannot be empty');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (username.length > 20) {
      setError('Username must be less than 20 characters');
      return;
    }
    
    // Check for valid characters (alphanumeric, spaces, underscores, hyphens)
    if (!/^[a-zA-Z0-9 _-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, spaces, _ and -');
      return;
    }
    
    onSave(username.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-gradient-to-b from-gray-900 to-black border-2 border-yellow-600 rounded-2xl p-6 max-w-md w-full shadow-2xl"
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                👤 Set Username
              </h2>
              <p className="text-gray-400 text-sm">
                Choose a display name for the leaderboard
              </p>
            </div>

            {/* Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                onKeyPress={handleKeyPress}
                placeholder="Enter your username"
                maxLength={20}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all"
                autoFocus
              />
              
              {/* Character count */}
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">
                  3-20 characters
                </span>
                <span className={`text-xs ${username.length > 20 ? 'text-red-500' : 'text-gray-500'}`}>
                  {username.length}/20
                </span>
              </div>
              
              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm mt-2"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Preview */}
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <p className="text-xs text-gray-500 mb-2">Preview:</p>
              <div>
                <p className="font-bold text-white">
                  {username.trim() || 'Your Username'}
                </p>
                <p className="text-xs text-gray-500">
                  0x1234...5678
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold py-3 rounded-lg transition-all transform hover:scale-105"
              >
                Save
              </button>
            </div>

            {/* Skip option */}
            {!currentUsername && (
              <button
                onClick={onClose}
                className="w-full mt-3 text-gray-500 hover:text-gray-400 text-sm transition-all"
              >
                Skip for now
              </button>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}






