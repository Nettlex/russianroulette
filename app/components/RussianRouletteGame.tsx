"use client";
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import RevolverChamber from './RevolverChamber';
import GameControls from './GameControls';
import GameOverScreen from './GameOverScreen';
import Leaderboard from './Leaderboard';
import StatsCard from './StatsCard';
import ChamberReloadAnimation from './ChamberReloadAnimation';
import BulletItem from './BulletItem';
import PrizePoolBar from './PrizePoolBar';
import { useUSDCPayment } from '../hooks/useUSDCPayment';
import {
  initializeGame,
  loadBullet,
  spinChamber,
  finishSpin,
  pullTrigger,
  resetGame,
} from '../utils/gameLogic';
import { GameState, PlayerStats, LeaderboardEntry, PrizePool } from '../types/game';

export default function RussianRouletteGame() {
  const { address, isConnected } = useAccount();
  const { payEntryFee, isPending, isConfirming, isSuccess, balance } = useUSDCPayment(address);
  const [gameState, setGameState] = useState<GameState>(initializeGame());
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [chambersCleared, setChambersCleared] = useState(0);
  const [showReloadAnimation, setShowReloadAnimation] = useState(false);
  const [isLoadingBullet, setIsLoadingBullet] = useState(false);
  const [showMuzzleFlash, setShowMuzzleFlash] = useState(false);
  const [tension, setTension] = useState(0);
  const [chamberOpen, setChamberOpen] = useState(false);
  const [gunFacingPlayer, setGunFacingPlayer] = useState(true);
  
  const [leaderboardData, setLeaderboardData] = useState<{
    free: LeaderboardEntry[];
    paid: LeaderboardEntry[];
    prizePool: PrizePool;
  }>({
    free: [],
    paid: [],
    prizePool: {
      totalAmount: 0,
      participants: 0,
      lastUpdated: Date.now(),
    },
  });

  // Load leaderboard on mount
  useEffect(() => {
    loadLeaderboard();
  }, []);

  // Sound effects using AudioManager
  const playSound = (soundType: 'click' | 'spin' | 'shot' | 'empty') => {
    if (typeof window === 'undefined') return;
    
    import('../utils/audioManager').then(({ AudioManager }) => {
      const audio = AudioManager.getInstance();
      switch (soundType) {
        case 'click':
          audio.playClick();
          break;
        case 'spin':
          audio.playSpin();
          break;
        case 'shot':
          audio.playShot();
          break;
        case 'empty':
          audio.playEmptyClick();
          break;
      }
    });
  };

  const handleLoadBullet = () => {
    setIsLoadingBullet(true);
    playSound('click');
    
    // Step 1: Open chamber (rotate gun sideways)
    setGunFacingPlayer(false);
    setChamberOpen(true);
    
    // Step 2: Load bullet after chamber opens
    setTimeout(() => {
      const newState = loadBullet(gameState);
      setGameState(newState);
      setIsLoadingBullet(false);
      setTension(1);
    }, 1000);
  };

  const handleSpin = () => {
    playSound('spin');
    const newState = spinChamber(gameState);
    setGameState(newState);
    setTension(tension + 1);
    
    // Finish spinning after animation
    setTimeout(() => {
      setGameState(finishSpin(newState));
      
      // Close chamber and face player
      setTimeout(() => {
        setChamberOpen(false);
        setGunFacingPlayer(true);
      }, 500);
    }, 1500);
  };

  const handleFire = () => {
    const newState = pullTrigger(gameState);
    setTension(0);
    
    if (newState.isGameOver) {
      // DEATH!
      setShowMuzzleFlash(true);
      playSound('shot');
      
      setTimeout(() => {
        setShowMuzzleFlash(false);
      }, 300);
    } else {
      // Survived!
      playSound('empty');
      
      // Check if chambers cleared (7 shots survived)
      if (newState.bulletPosition === null) {
        setChambersCleared(chambersCleared + 1);
      }
    }
    
    setGameState(newState);
    
    // Save stats to backend
    savePlayerStats(newState);
  };

  const handlePayAndPlay = async () => {
    if (!isConnected || !address) {
      alert('Please connect your wallet first');
      return;
    }
    
    if (isPending || isConfirming) {
      alert('Transaction in progress...');
      return;
    }
    
    try {
      // Show balance
      if (balance < 1) {
        alert(`❌ Insufficient USDC balance.\n\nYou have: ${balance} USDC\nNeeded: 1 USDC\n\nGet testnet USDC from: https://faucet.circle.com/`);
        return;
      }
      
      const confirmed = confirm(`Pay 1 USDC to join prize pool?\n\nYour balance: ${balance} USDC`);
      if (!confirmed) return;
      
      // Make payment
      await payEntryFee(1);
      
    } catch (error: any) {
      console.error('Payment failed:', error);
      alert(`❌ Payment failed: ${error.message || 'Please try again'}`);
    }
  };

  // Watch for successful payment
  useEffect(() => {
    if (isSuccess && !gameState.isPaid) {
      // Update backend
      const updateBackend = async () => {
        try {
          const { joinPrizePool } = await import('../utils/api');
          const result = await joinPrizePool(address!);
          
          if (result && result.success) {
            setGameState({ ...gameState, isPaid: true });
            
            if (result.prizePool) {
              setLeaderboardData({
                ...leaderboardData,
                prizePool: result.prizePool,
              });
            }
            
            alert('✅ Payment successful! You are now in the prize pool.');
          }
        } catch (error) {
          console.error('Backend update failed:', error);
        }
      };
      
      updateBackend();
    }
  }, [isSuccess, gameState.isPaid]);

  const handleTryAgain = () => {
    setGameState(initializeGame(gameState.isPaid));
    setTension(0);
    setShowMuzzleFlash(false);
    setChamberOpen(false);
    setGunFacingPlayer(true);
  };

  const savePlayerStats = async (state: GameState) => {
    if (!address) return;
    
    const stats: PlayerStats = {
      address,
      triggerPulls: state.triggerPulls,
      deaths: state.deaths,
      lastPlayed: Date.now(),
      isPaid: state.isPaid,
    };
    
    try {
      const { updatePlayerStats } = await import('../utils/api');
      await updatePlayerStats(address, stats);
      
      // Refresh leaderboard
      await loadLeaderboard();
    } catch (error) {
      console.error('Error saving stats:', error);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const { getLeaderboard, getPrizePool } = await import('../utils/api');
      const [leaderboardData, prizePoolData] = await Promise.all([
        getLeaderboard(),
        getPrizePool(),
      ]);
      
      if (leaderboardData) {
        setLeaderboardData({
          free: leaderboardData.free || [],
          paid: leaderboardData.paid || [],
          prizePool: prizePoolData || {
            totalAmount: 0,
            participants: 0,
            lastUpdated: Date.now(),
          },
        });
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    }
  };

  // Show chamber reload animation
  useEffect(() => {
    if (gameState.bulletPosition === null && gameState.triggerPulls > 0 && !gameState.isGameOver) {
      setShowReloadAnimation(true);
      const timer = setTimeout(() => {
        setShowReloadAnimation(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState.bulletPosition, gameState.triggerPulls, gameState.isGameOver]);

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Dark vignette effect */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black pointer-events-none" />
      
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' /%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\' /%3E%3C/svg%3E")',
      }} />
      {/* Game Over Screen */}
      {gameState.isGameOver && (
        <GameOverScreen
          onTryAgain={handleTryAgain}
          triggerPulls={gameState.triggerPulls}
          deaths={gameState.deaths}
        />
      )}

      {/* Chamber Reload Animation */}
      <ChamberReloadAnimation 
        show={showReloadAnimation} 
        chambersCleared={chambersCleared}
      />

      {/* Prize Pool Bar */}
      <PrizePoolBar 
        prizePool={leaderboardData.prizePool}
        isPaidMode={gameState.isPaid}
      />

      {/* Header */}
      <div className="relative p-4 border-b border-gray-900/50 bg-black/80 backdrop-blur-sm z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              RUSSIAN ROULETTE
            </h1>
            <p className="text-sm text-gray-600">Dare to pull the trigger?</p>
          </div>
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="px-4 py-2 bg-gray-900/50 hover:bg-gray-800 rounded-lg transition-colors border border-gray-800 backdrop-blur-sm"
          >
            {showLeaderboard ? '🎮 Play' : '🏆 Leaderboard'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto p-4 z-10">
        {showLeaderboard ? (
          <div className="space-y-8 py-8">
            <Leaderboard
              entries={leaderboardData.paid}
              prizePool={leaderboardData.prizePool}
              isPaidMode={true}
            />
            <Leaderboard
              entries={leaderboardData.free}
              prizePool={leaderboardData.prizePool}
              isPaidMode={false}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-8">
            {/* Stats Display */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              <StatsCard 
                label="Triggers" 
                value={gameState.triggerPulls}
                icon="🔫"
                color="default"
              />
              <StatsCard 
                label="Deaths" 
                value={gameState.deaths}
                icon="💀"
                color="red"
              />
              <StatsCard 
                label="Survived" 
                value={chambersCleared}
                icon="🎉"
                color="green"
              />
            </div>

            {/* Chamber reload message */}
            {gameState.bulletPosition === null && gameState.triggerPulls > 0 && !gameState.isGameOver && (
              <div className="bg-yellow-900 border-2 border-yellow-600 rounded-xl p-4 text-center animate-pulse">
                <p className="text-xl font-bold">🎉 Chamber Empty!</p>
                <p className="text-sm">You survived 7 shots! Click the bullet to reload.</p>
              </div>
            )}

            {/* Main Game Area - Two columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-6xl items-center">
              {/* Left: Bullet to load */}
              <div className="flex justify-center">
                <BulletItem
                  onLoadBullet={handleLoadBullet}
                  isLoading={isLoadingBullet}
                  canLoad={gameState.bulletPosition === null && !isLoadingBullet}
                />
              </div>

              {/* Right: Revolver Chamber */}
              <div className="flex justify-center">
                <RevolverChamber
                  bulletPosition={gameState.bulletPosition}
                  currentChamber={gameState.currentChamber}
                  isSpinning={gameState.isSpinning}
                  showBullet={false} // Never show to player when facing them
                  isLoading={isLoadingBullet}
                  showMuzzleFlash={showMuzzleFlash}
                  chamberOpen={chamberOpen}
                  onChamberClick={handleSpin}
                  isFacingPlayer={gunFacingPlayer}
                />
              </div>
            </div>

            {/* Tension Meter - Dark theme */}
            {tension > 0 && gameState.bulletPosition !== null && !gameState.isSpinning && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md px-4"
              >
                <div className="bg-black/70 backdrop-blur-md p-4 rounded-xl border-2 border-red-950 shadow-[0_0_20px_rgba(139,0,0,0.3)]">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-red-500 font-bold drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]">DANGER LEVEL</span>
                    <span className="text-2xl">
                      {tension === 1 && "😰"}
                      {tension === 2 && "😨"}
                      {tension === 3 && "😱"}
                      {tension >= 4 && "💀"}
                    </span>
                  </div>
                  <div className="w-full bg-black h-3 rounded-full overflow-hidden border border-gray-900">
                    <motion.div
                      className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600 shadow-[0_0_10px_rgba(239,68,68,0.6)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(tension * 25, 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2 text-center">
                    {tension === 1 && "First spin... feeling lucky?"}
                    {tension === 2 && "Odds are getting worse..."}
                    {tension === 3 && "Are you sure about this?"}
                    {tension >= 4 && "EXTREMELY DANGEROUS!"}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Fire Button - Only show when gun is facing player and ready */}
            {gameState.bulletPosition !== null && gunFacingPlayer && !gameState.isSpinning && !chamberOpen && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleFire}
                className="relative group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-700 rounded-xl blur group-hover:blur-md transition-all" />
                <div className="relative bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-8 px-16 rounded-xl shadow-lg hover:shadow-2xl transition-all transform hover:scale-105">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-4xl">💥</span>
                    <span className="text-3xl">FIRE!</span>
                  </div>
                </div>
              </motion.button>
            )}

            {/* Free Play Notice */}
            {!isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-blue-900/20 backdrop-blur-md rounded-xl border-2 border-blue-800/50 max-w-md"
              >
                <p className="text-center text-blue-400 text-sm mb-2">
                  🎮 <strong>Free Play Mode</strong>
                </p>
                <p className="text-center text-gray-500 text-xs">
                  Playing without wallet. Connect to join prize pool and compete!
                </p>
              </motion.div>
            )}

            {/* Payment Option */}
            {!gameState.isPaid && isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-4 bg-black/70 backdrop-blur-md rounded-xl border-2 border-green-900/50 max-w-md"
              >
                <p className="text-center text-gray-400 text-sm mb-3">
                  Join the prize pool for a chance to win!
                </p>
                <button
                  onClick={handlePayAndPlay}
                  disabled={isPending || isConfirming}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-2xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-xl">💰</span>
                    <span>{isPending || isConfirming ? 'Processing...' : 'Play for 1 USDC'}</span>
                  </div>
                </button>
                {balance > 0 && (
                  <p className="text-xs text-gray-600 text-center mt-2">
                    Your balance: {balance} USDC
                  </p>
                )}
              </motion.div>
            )}

            {gameState.isPaid && (
              <div className="text-center p-2 bg-green-900/30 text-green-400 rounded-lg border border-green-800">
                <span className="text-sm">✓ Entered in Prize Pool</span>
              </div>
            )}

            {/* Instructions */}
            {gameState.triggerPulls === 0 && (
              <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-md">
                <h3 className="text-xl font-bold mb-3">How to Play</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                  <li>Click "Load Bullet" to place a bullet in a random chamber</li>
                  <li>Click "Spin Chamber" to randomize the chamber position</li>
                  <li>Click "FIRE!" to pull the trigger</li>
                  <li>Survive 7 shots and the chamber reloads automatically</li>
                  <li>Compete on the leaderboard for the prize pool!</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

