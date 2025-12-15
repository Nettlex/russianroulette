"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyFairness, sha256 } from '../utils/provableFair';

interface FairnessVerificationProps {
  commitHash: string;
  serverSeed: string;
  roundId: string;
  bulletIndex: number;
  onClose: () => void;
}

export default function FairnessVerification({
  commitHash,
  serverSeed,
  roundId,
  bulletIndex,
  onClose,
}: FairnessVerificationProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [computedCommit, setComputedCommit] = useState<string>('');
  const [computedBullet, setComputedBullet] = useState<number | null>(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    
    // Compute commit hash
    const commit = await sha256(serverSeed);
    setComputedCommit(commit);
    
    // Compute bullet index
    const combined = serverSeed + roundId;
    const hash = await sha256(combined);
    const num = parseInt(hash.substring(0, 8), 16);
    const bullet = num % 8;
    setComputedBullet(bullet);
    
    // Verify
    const isValid = await verifyFairness(commitHash, serverSeed, roundId, bulletIndex);
    setVerificationResult(isValid);
    setIsVerifying(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="bg-gradient-to-b from-gray-900 to-black border-2 border-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Fairness Verification</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-white text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4 text-sm">
            {/* Explanation */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <h3 className="text-blue-400 font-bold mb-2">How It Works</h3>
              <ol className="text-gray-400 space-y-1 list-decimal list-inside">
                <li>Server generates random seed before round</li>
                <li>Commit hash (SHA-256 of seed) shown to you</li>
                <li>Bullet index derived: SHA-256(seed + roundId) mod 8</li>
                <li>After round, seed revealed for verification</li>
              </ol>
            </div>

            {/* Round Data */}
            <div className="space-y-3">
              <div>
                <p className="text-gray-500 text-xs">Round ID:</p>
                <p className="text-white font-mono text-xs break-all bg-gray-900 p-2 rounded">
                  {roundId}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-xs">Commit Hash (shown at start):</p>
                <p className="text-yellow-400 font-mono text-xs break-all bg-gray-900 p-2 rounded">
                  {commitHash}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-xs">Server Seed (revealed after):</p>
                <p className="text-green-400 font-mono text-xs break-all bg-gray-900 p-2 rounded">
                  {serverSeed}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-xs">Bullet Index:</p>
                <p className="text-red-400 font-mono text-lg bg-gray-900 p-2 rounded text-center">
                  {bulletIndex}
                </p>
              </div>
            </div>

            {/* Verification Steps */}
            {verificationResult !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className={`border ${computedCommit === commitHash ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'} rounded-lg p-3`}>
                  <p className="text-white font-bold mb-1">Step 1: Verify Commit</p>
                  <p className="text-xs text-gray-400">SHA-256(serverSeed) = commitHash?</p>
                  <p className="text-xs text-gray-500 mt-1">Computed: {computedCommit}</p>
                  <p className={`text-sm font-bold mt-1 ${computedCommit === commitHash ? 'text-green-400' : 'text-red-400'}`}>
                    {computedCommit === commitHash ? '✓ MATCH' : '✗ MISMATCH'}
                  </p>
                </div>

                <div className={`border ${computedBullet === bulletIndex ? 'border-green-600 bg-green-900/20' : 'border-red-600 bg-red-900/20'} rounded-lg p-3`}>
                  <p className="text-white font-bold mb-1">Step 2: Verify Bullet</p>
                  <p className="text-xs text-gray-400">SHA-256(seed + roundId) mod 8 = {bulletIndex}?</p>
                  <p className="text-xs text-gray-500 mt-1">Computed: {computedBullet}</p>
                  <p className={`text-sm font-bold mt-1 ${computedBullet === bulletIndex ? 'text-green-400' : 'text-red-400'}`}>
                    {computedBullet === bulletIndex ? '✓ MATCH' : '✗ MISMATCH'}
                  </p>
                </div>

                <div className={`border-2 ${verificationResult ? 'border-green-500 bg-green-900/30' : 'border-red-500 bg-red-900/30'} rounded-lg p-4 text-center`}>
                  <p className={`text-2xl font-bold ${verificationResult ? 'text-green-400' : 'text-red-400'}`}>
                    {verificationResult ? '✓ VERIFIED FAIR' : '✗ VERIFICATION FAILED'}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    {verificationResult 
                      ? 'The result was provably fair and not manipulated.'
                      : 'Verification failed. The result may have been tampered with.'}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Verify Button */}
            {verificationResult === null && (
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50"
              >
                {isVerifying ? 'Verifying...' : 'Verify Fairness'}
              </button>
            )}

            {/* Manual Verification */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
              <h3 className="text-white font-bold mb-2 text-xs">Manual Verification</h3>
              <p className="text-gray-500 text-xs mb-2">
                You can verify this yourself using any SHA-256 calculator:
              </p>
              <ol className="text-gray-400 text-xs space-y-1 list-decimal list-inside">
                <li>Hash the server seed: SHA-256("{serverSeed.substring(0, 20)}...")</li>
                <li>Compare with commit hash</li>
                <li>Hash seed+roundId: SHA-256("{serverSeed.substring(0, 10)}...{roundId.substring(0, 10)}...")</li>
                <li>Take first 8 hex chars, convert to decimal, mod 8</li>
              </ol>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

