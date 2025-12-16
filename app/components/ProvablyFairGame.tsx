"use client";
import { useReducer, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSendCalls, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, encodeFunctionData } from 'viem';
import { sdk } from '@farcaster/miniapp-sdk';
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownFundLink
} from '@coinbase/onchainkit/wallet';
import {
  Identity,
  Avatar,
  Name,
  Address,
} from '@coinbase/onchainkit/identity';
import { gameReducer, initialState, CHAMBERS_COUNT } from '../utils/gameStateMachine';
import { generateFairRound } from '../utils/provableFair';
import FairnessVerification from './FairnessVerification';
import Leaderboard from './Leaderboard';
import Profile from './Profile';
import UsernameModal from './UsernameModal';
import { getUserBalance, getTotalAvailableBalance, approvePendingPrize } from '../utils/balanceManager';
import { getPendingDistributionsForAddress } from '../utils/prizeDistribution';
import { useUSDCPayment } from '../hooks/useUSDCPayment';

export default function ProvablyFairGame() {
  const { address: wagmiAddress, isConnected: wagmiConnected } = useAccount();
  
  // Check for Farcaster context and use its wallet address
  const [farcasterAddress, setFarcasterAddress] = useState<string | null>(null);
  const [isInMiniapp, setIsInMiniapp] = useState(false);
  
  useEffect(() => {
    sdk.context
      .then((context) => {
        if (context && context.user) {
          setIsInMiniapp(true);
          const walletAddr = (context.user as any).custodyAddress || 
                           (context.user as any).walletAddress || 
                           (context.user as any).address;
          if (walletAddr) {
            setFarcasterAddress(walletAddr as string);
            console.log('🎯 Farcaster wallet detected in game:', walletAddr);
          }
        }
      })
      .catch(() => setIsInMiniapp(false));
  }, []);
  
  // Use Farcaster address if in miniapp and available, otherwise use wagmi
  const address = (isInMiniapp && farcasterAddress) ? farcasterAddress as `0x${string}` : wagmiAddress;
  const isConnected = (isInMiniapp && farcasterAddress) ? true : wagmiConnected;
  const { payEntryFee, isPending: isPaymentPending, isConfirming: isPaymentConfirming, isSuccess: isPaymentSuccess, error: paymentError, balance: usdcBalance } = useUSDCPayment(address);
  const { sendCalls, data: depositTxData, isPending: isDepositPending } = useSendCalls();
  
  // USDC contract address
  const USDC_ADDRESS = process.env.NEXT_PUBLIC_CHAIN === 'mainnet'
    ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
    : '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
  
  // Deposit wallet (use prize pool wallet for now, or set a separate one)
  const DEPOSIT_WALLET = process.env.NEXT_PUBLIC_DEPOSIT_WALLET || process.env.NEXT_PUBLIC_PRIZE_POOL_WALLET || address;
  
  // Wait for deposit transaction
  let depositHash: `0x${string}` | undefined = undefined;
  if (depositTxData && typeof depositTxData === 'object' && depositTxData !== null && 'id' in depositTxData) {
    const id = (depositTxData as { id: unknown }).id;
    if (typeof id === 'string' && id.startsWith('0x')) {
      depositHash = id as `0x${string}`;
    }
  }
  
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } = useWaitForTransactionReceipt({
    hash: depositHash,
    query: { enabled: !!depositHash },
  });
  
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const [showVerification, setShowVerification] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [triggerCooldown, setTriggerCooldown] = useState(false); // Cooldown to prevent spam
  const [showDeathVideo, setShowDeathVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasPlayedVideo = useRef(false);
  const isProcessingTrigger = useRef(false); // Prevent double trigger pulls
  const [hasCompletedFirstRound, setHasCompletedFirstRound] = useState(false);
  const [showPaymentChoice, setShowPaymentChoice] = useState(false);
  const [isFreeModePlayer, setIsFreeModePlayer] = useState(true);
  
  // Username management
  const [username, setUsername] = useState<string>('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  
  // Load username from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && address) {
      const savedUsername = localStorage.getItem(`username_${address}`);
      if (savedUsername) {
        setUsername(savedUsername);
      }
    }
  }, [address]);
  
  // Save username to localStorage
  const handleSaveUsername = (newUsername: string) => {
    if (typeof window !== 'undefined' && address) {
      localStorage.setItem(`username_${address}`, newUsername);
      setUsername(newUsername);
      setShowUsernameModal(false);
      
      // Re-sync stats with new username
      if (playerStats.totalPulls > 0 || playerStats.totalDeaths > 0) {
        savePlayerStats(playerStats);
      }
    }
  };
  
  // Reload stats when mode changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(getStatsKey());
      setPlayerStats(saved ? JSON.parse(saved) : { totalPulls: 0, totalDeaths: 0, maxStreak: 0 });
    }
  }, [isFreeModePlayer, address]);
  
  // Balance management
  const [userBalance, setUserBalance] = useState(0); // USDC balance in game
  const [pendingPrizes, setPendingPrizes] = useState(0); // Pending prize amount
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showPendingPrizesModal, setShowPendingPrizesModal] = useState(false);
  
  // Handle deposit success (after userBalance is declared)
  useEffect(() => {
    if (isDepositSuccess && depositHash) {
      // Transaction confirmed, update balance
      const depositAmount = parseFloat(localStorage.getItem(`lastDepositAmount_${address}`) || '0');
      if (depositAmount > 0) {
        setUserBalance(userBalance + depositAmount);
        localStorage.setItem(`balance_${address}`, (userBalance + depositAmount).toString());
        localStorage.removeItem(`lastDepositAmount_${address}`);
        setShowDepositModal(false);
        alert(`✅ Deposited ${depositAmount} USDC successfully!`);
      }
    }
  }, [isDepositSuccess, depositHash, address, userBalance]);
  
  // Handle payment success
  useEffect(() => {
    if (isPaymentSuccess) {
      console.log('✅ Payment successful!');
      // Payment was processed, user can now play
    }
    if (paymentError) {
      console.error('❌ Payment error:', paymentError);
    }
  }, [isPaymentSuccess, paymentError]);

  // Ensure video plays when showDeathVideo becomes true
  useEffect(() => {
    if (showDeathVideo && videoRef.current) {
      const video = videoRef.current;
      // Reset and play video
      video.currentTime = 0;
      video.muted = true; // Start muted for autoplay
      
      const playVideo = async () => {
        try {
          await video.play();
          console.log('✅ Video play() succeeded');
          // Unmute after play starts
          video.muted = false;
        } catch (error) {
          console.error('❌ Video play() failed, trying muted:', error);
          // Try with muted if unmuted fails
          video.muted = true;
          try {
            await video.play();
            console.log('✅ Video play() succeeded (muted)');
          } catch (mutedError) {
            console.error('❌ Video play() failed even muted:', mutedError);
            // Close overlay if video can't play
            setTimeout(() => {
              hasPlayedVideo.current = false;
              setShowDeathVideo(false);
            }, 500);
          }
        }
      };
      
      // Small delay to ensure video element is ready
      setTimeout(() => {
        playVideo();
      }, 100);
    }
  }, [showDeathVideo]);
  
  // Visual states for loading sequence
  const [viewMode, setViewMode] = useState<'ready' | 'loading' | 'spinning' | 'closing' | 'front'>('ready');
  const [isLoadingBullet, setIsLoadingBullet] = useState(false);
  const [cylinderRotation, setCylinderRotation] = useState(0); // Accumulated rotation for smooth animation
  const [showPage, setShowPage] = useState<'game' | 'leaderboard' | 'profile'>('game');
  
  // Decision point at 7 pulls
  const [currentRunSafePulls, setCurrentRunSafePulls] = useState(0);
  const [showDecisionUI, setShowDecisionUI] = useState(false);
  const [runLockedIn, setRunLockedIn] = useState(false);
  
  // Player stats for leaderboard - separate for free and paid
  const getStatsKey = () => {
    const mode = isFreeModePlayer ? 'free' : 'paid';
    return `stats_${mode}_${address || 'guest'}`;
  };
  
  const [playerStats, setPlayerStats] = useState(() => {
    if (typeof window === 'undefined') return { totalPulls: 0, totalDeaths: 0, maxStreak: 0 };
    const saved = localStorage.getItem(getStatsKey());
    return saved ? JSON.parse(saved) : { totalPulls: 0, totalDeaths: 0, maxStreak: 0 };
  });

  // Preload and prepare all sounds for INSTANT playback
  const [sounds] = useState(() => {
    if (typeof window === 'undefined') return null;
    
    const audioFiles = {
      click: [
        new Audio('/sounds/click1.mp3'),
        new Audio('/sounds/click2.mp3'),
        new Audio('/sounds/click3.mp3'),
      ],
      spin: [
        new Audio('/sounds/spin1.mp3'),
        new Audio('/sounds/spin2.mp3'),
      ],
      bang: new Audio('/sounds/bang.mp3'),
      loading: new Audio('/sounds/loading.mp3'),
      buildup: new Audio('/sounds/buildup.mp3'),
    };
    
    // Preload all audio files
    [...audioFiles.click, ...audioFiles.spin, audioFiles.bang, audioFiles.loading, audioFiles.buildup].forEach(audio => {
      audio.preload = 'auto';
      audio.load();
    });
    
    return audioFiles;
  });

  // Buildup sound state - simple playback from start
  const [buildupAudio, setBuildupAudio] = useState<HTMLAudioElement | null>(null);

  // Initialize buildup audio
  useEffect(() => {
    if (typeof window === 'undefined' || !sounds?.buildup) return;

    // Create a new Audio element using the source from the original
    const audio = new Audio(sounds.buildup.src);
    audio.loop = false;
    audio.preload = 'auto';
    audio.volume = 0.6;
    
    setBuildupAudio(audio);
    
    return () => {
      // Cleanup
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [sounds]);

  // Start buildup sound from beginning
  const startBuildup = () => {
    if (!buildupAudio) return;
    
    // Always start from the beginning
    buildupAudio.currentTime = 0;
    buildupAudio.playbackRate = 1;
    buildupAudio.play().catch(err => {
      console.error('Error playing buildup sound:', err);
    });
  };

  // Stop buildup sound
  const stopBuildup = () => {
    if (!buildupAudio) return;
    
    buildupAudio.pause();
    buildupAudio.currentTime = 0;
  };

  // Play sound effects - INSTANT playback
  const playSound = (type: 'click' | 'bang' | 'spin' | 'loading') => {
    if (!sounds) return;
    
    try {
      if (type === 'click') {
        const variation = Math.floor(Math.random() * 3);
        const audio = sounds.click[variation];
        audio.currentTime = 0;
        audio.volume = 0.8;
        audio.play();
      } else if (type === 'spin') {
        const variation = Math.floor(Math.random() * 2);
        const audio = sounds.spin[variation];
        audio.currentTime = 0;
        audio.volume = 0.8;
        audio.play();
      } else if (type === 'bang') {
        const audio = sounds.bang;
        audio.currentTime = 0;
        audio.volume = 0.9;
        audio.play();
      } else if (type === 'loading') {
        const audio = sounds.loading;
        audio.currentTime = 0;
        audio.volume = 0.8;
        audio.play();
      }
    } catch (error) {
      console.error(`Sound error: ${type}`, error);
    }
  };

  // Start new round with loading sequence
  const handleNewRound = async () => {
    const roundId = Date.now().toString();
    const round = await generateFairRound(roundId);
    
    // Reset run state
    setCurrentRunSafePulls(0);
    setRunLockedIn(false);
    hasPlayedVideo.current = false; // Reset video flag on new round
    isProcessingTrigger.current = false; // Reset trigger processing flag
    setShowDecisionUI(false);
    
    // STEP 0: Start loading sequence - BACK VIEW (cylinder open left)
    setIsLoadingBullet(true);
    setViewMode('loading');
    playSound('loading');
    
    // Dispatch game state
    dispatch({
      type: 'NEW_ROUND',
      payload: {
        bulletIndex: round.bulletIndex,
        commitHash: round.commitHash,
        roundId,
      },
    });

    // Store server seed for later reveal
    sessionStorage.setItem(`seed_${roundId}`, round.serverSeed);
    
    // Wait 2 seconds to show bullet in chamber
    setTimeout(() => {
      setIsLoadingBullet(false);
    }, 2000);
  };

  // Load user balance and pending prizes from storage/API
  useEffect(() => {
    if (address && isConnected) {
      const balanceData = getUserBalance(address);
      setUserBalance(balanceData.balance);
      setPendingPrizes(balanceData.pendingPrizes);

      // Also fetch from API
      fetch(`/api/game?action=pendingPrizes&address=${address}`)
        .then(res => res.json())
        .then(data => {
          if (data.pendingPrizes) {
            setPendingPrizes(data.pendingPrizes);
            // Update localStorage
            localStorage.setItem(`pending_prizes_${address}`, data.pendingPrizes.toString());
          }
        })
        .catch(err => console.error('Error fetching pending prizes:', err));
    }
  }, [address, isConnected]);

  // Save player stats - separate for free and paid
  const savePlayerStats = async (stats: typeof playerStats) => {
    setPlayerStats(stats);
    localStorage.setItem(getStatsKey(), JSON.stringify(stats));
    
    // Sync to API for global leaderboard (only if wallet is connected)
    if (address && isConnected) {
      try {
        await fetch('/api/game', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'updateStats',
            address,
            username: username || undefined, // Include username if set
            stats: {
              triggerPulls: stats.totalPulls,
              deaths: stats.totalDeaths,
              maxStreak: stats.maxStreak,
              isPaid: !isFreeModePlayer,
            },
          }),
        });
      } catch (error) {
        console.error('Error syncing stats to API:', error);
        // Don't block the UI if API sync fails
      }
    }
  };

  // Calculate leaderboard score
  const calculateScore = (maxStreak: number, totalPulls: number, totalDeaths: number) => {
    const riskMultiplier = 1 + (totalDeaths / Math.max(1, totalPulls));
    return maxStreak * riskMultiplier;
  };

  // Save balance to storage
  const saveBalance = (newBalance: number) => {
    setUserBalance(newBalance);
    if (address) {
      localStorage.setItem(`balance_${address}`, newBalance.toString());
    }
  };

  // Approve pending prize (move to balance)
  const handleApprovePendingPrize = async (amount: number) => {
    if (!address) return;

    try {
      // Get pending distributions
      const pending = getPendingDistributionsForAddress(address);
      if (pending.length === 0) {
        alert('No pending prizes to approve');
        return;
      }

      // Approve the first pending distribution
      const dist = pending[0];
      
      // Call API to approve
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approveDistribution',
          distributionId: dist.distributionId,
          address: address,
        }),
      });

      if (response.ok) {
        // Move from pending to balance
        approvePendingPrize(address, dist.amount);
        setUserBalance(userBalance + dist.amount);
        setPendingPrizes(pendingPrizes - dist.amount);
        setShowPendingPrizesModal(false);
        alert(`✅ Approved ${dist.amount.toFixed(2)} USDC prize! Added to your balance.`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Failed to approve prize'}`);
      }
    } catch (error) {
      console.error('Error approving prize:', error);
      alert('Failed to approve prize. Please try again.');
    }
  };

  // Handle deposit - actually transfer USDC from wallet to deposit address
  const handleDeposit = async (amount: number) => {
    if (!isConnected || !address) {
      alert('Please connect wallet first');
      return;
    }

    if (amount <= 0) {
      alert('Invalid deposit amount');
      return;
    }

    // Check if user has enough USDC in wallet
    if (usdcBalance < amount) {
      alert(`Insufficient USDC balance. You have ${usdcBalance.toFixed(2)} USDC.`);
      return;
    }

    if (!DEPOSIT_WALLET || DEPOSIT_WALLET === '0x0000000000000000000000000000000000000000') {
      alert('Deposit wallet not configured');
      return;
    }

    try {
      // Convert amount to USDC units (6 decimals)
      const amountInUnits = parseUnits(amount.toString(), 6);
      
      // USDC ABI for transfer
      const USDC_ABI = [
        {
          name: 'transfer',
          type: 'function',
          stateMutability: 'nonpayable',
          inputs: [
            { name: 'to', type: 'address' },
            { name: 'amount', type: 'uint256' },
          ],
          outputs: [{ name: '', type: 'bool' }],
        },
      ] as const;
      
      // Encode the transfer function call
      const data = encodeFunctionData({
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [DEPOSIT_WALLET as `0x${string}`, amountInUnits],
      });

      // Save deposit amount for later confirmation
      localStorage.setItem(`lastDepositAmount_${address}`, amount.toString());
      
      // Send USDC transfer
      sendCalls({
        calls: [
          {
            to: USDC_ADDRESS as `0x${string}`,
            data: data,
          },
        ],
      });
      
      // Show pending message
      alert(`💰 Deposit transaction submitted! Waiting for confirmation...`);
    } catch (error: any) {
      console.error('Deposit error:', error);
      alert(`Deposit failed: ${error.message || 'Unknown error'}`);
      localStorage.removeItem(`lastDepositAmount_${address}`);
    }
  };

  // Handle withdrawal - submits a request for manual processing
  const handleWithdraw = async (amount: number) => {
    if (!address) {
      alert('Please connect wallet first');
      return;
    }
    
    if (amount > userBalance) {
      alert('Insufficient balance');
      return;
    }
    
    if (amount <= 0) {
      alert('Invalid withdrawal amount');
      return;
    }

    try {
      // Submit withdrawal request to API
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          address: address,
          amount: amount,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Deduct from local balance immediately (will be sent manually)
        saveBalance(userBalance - amount);
        setShowWithdrawModal(false);
        alert(`✅ Withdrawal request submitted!\n\nAmount: ${amount.toFixed(2)} USDC\nRequest ID: ${data.requestId}\n\nYour withdrawal will be processed manually. Check your wallet in 24-48 hours.`);
        console.log('📝 Withdrawal request submitted:', data.requestId);
      } else {
        alert(`Withdrawal request failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Withdrawal error:', error);
      alert('Failed to submit withdrawal request. Please try again.');
    }
  };

  // Handle USDC payment choice
  const handleChooseUSDC = async () => {
    if (!isConnected) {
      alert('Please connect wallet first to play with USDC');
      return;
    }
    
    // Check real USDC balance
    if (usdcBalance < 1) {
      alert(`Insufficient USDC balance. You have ${usdcBalance.toFixed(2)} USDC. Please deposit at least 1 USDC.`);
      setShowDepositModal(true);
      return;
    }
    
    try {
      // Process real USDC payment
      await payEntryFee(1);
      setIsFreeModePlayer(false);
      setShowPaymentChoice(false);
      console.log('💰 Switched to USDC mode - 1 USDC payment processed');
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(`Payment failed: ${error.message || 'Unknown error'}`);
    }
  };

  const handleStayFree = () => {
    setIsFreeModePlayer(true);
    setShowPaymentChoice(false);
    console.log('🆓 Staying in free mode');
  };

  // Spin chamber (happens on the OPEN cylinder in back view)
  const handleSpin = () => {
    if (viewMode !== 'loading') return;
    if (isAnimating) return;
    
    // Play sound IMMEDIATELY
    playSound('spin');
    
    setIsAnimating(true);
    setViewMode('spinning');
    dispatch({ type: 'SPIN_CHAMBER' });
    
    // Spin for 2 seconds
    setTimeout(() => {
      setIsAnimating(false);
      // STEP 1: Close the cylinder
      setViewMode('closing');
      
      // STEP 2: After closing, switch to front view
      setTimeout(() => {
        setViewMode('front');
      }, 1000);
    }, 2000);
  };

  // Pull trigger
  const handlePullTrigger = () => {
    // Prevent double firing with ref check
    if (isProcessingTrigger.current) {
      console.log('🚫 Trigger already processing, ignoring');
      return;
    }
    
    console.log('🔫 PULL - Phase:', state.phase, 'Chamber:', state.chamberIndex, 'Bullet:', state.bulletIndex);
    
    // Stop buildup sound immediately
    stopBuildup();
    
    if (state.phase !== 'LOADED' && state.phase !== 'PLAYING') return;
    if (isAnimating) return;
    if (triggerCooldown) return; // Block during cooldown
    if (viewMode !== 'front') return;
    if (showDecisionUI) return; // Block trigger during decision
    if (showDeathVideo) return; // Block trigger when death video is showing
    
    // Set processing flag immediately to prevent double calls
    isProcessingTrigger.current = true;
    
    const currentChamber = state.chamberIndex;
    const isHit = currentChamber === state.bulletIndex;
    
    // Update stats - increment total pulls
    const newTotalPulls = playerStats.totalPulls + 1;
    
    // Play sound IMMEDIATELY before any state changes
    if (isHit) {
      playSound('bang');
      console.log('💀 BANG!');
      // Show death video IMMEDIATELY
      hasPlayedVideo.current = true;
      setShowDeathVideo(true);
    } else {
      playSound('click');
      console.log('✓ CLICK');
    }
    
    // Set cooldown and animation states immediately
    setIsAnimating(true);
    setTriggerCooldown(true);
    dispatch({ type: 'PULL_TRIGGER' });
    
    // Cylinder rotates 45 degrees forward (always forward, never back)
    setCylinderRotation(prev => prev + 45);
    
    if (isHit) {
      // DEATH - Update stats
      const runStreak = currentRunSafePulls;
      const newMaxStreak = Math.max(playerStats.maxStreak, runStreak);
      const newTotalDeaths = playerStats.totalDeaths + 1;
      
      savePlayerStats({
        totalPulls: newTotalPulls,
        totalDeaths: newTotalDeaths,
        maxStreak: newMaxStreak,
      });
      
      console.log('📊 Stats updated:', { runStreak, newMaxStreak, deaths: newTotalDeaths, pulls: newTotalPulls });
      
      // Auto-close video after max 3 seconds if it's still showing (safety timeout)
      const videoTimeout = setTimeout(() => {
        console.log('⏱️ Video timeout, closing overlay');
        hasPlayedVideo.current = false;
        setShowDeathVideo(false);
      }, 3000);
      
      setTimeout(() => {
        const serverSeed = sessionStorage.getItem(`seed_${state.roundId}`);
        if (serverSeed) {
          dispatch({ type: 'REVEAL', payload: { serverSeed } });
        }
        setIsAnimating(false);
        setTriggerCooldown(false); // Clear cooldown after animation (1000ms)
        isProcessingTrigger.current = false; // Reset processing flag
        
        // Reset run state
        setCurrentRunSafePulls(0);
        setRunLockedIn(false);
        
        // Clear video timeout if video already closed
        clearTimeout(videoTimeout);
        
        // After first round death, show payment choice
        if (!hasCompletedFirstRound) {
          setHasCompletedFirstRound(true);
          setTimeout(() => {
            setShowPaymentChoice(true);
          }, 3000);
        }
      }, 1000);
    } else {
      // CLICK - survived (sound already played above)
      
      // Increment safe pulls for this run
      const newSafePulls = currentRunSafePulls + 1;
      setCurrentRunSafePulls(newSafePulls);
      
      // Update total pulls stat
      savePlayerStats({
        ...playerStats,
        totalPulls: newTotalPulls,
      });
      
      // Check for decision point at 7 pulls
      if (newSafePulls === 7 && !runLockedIn) {
        setTimeout(() => {
          setShowDecisionUI(true);
          console.log('🎯 Decision point reached at 7 pulls');
        }, 500);
      }
      
        setTimeout(() => {
          setIsAnimating(false);
          setTriggerCooldown(false); // Clear cooldown after animation (300ms)
          isProcessingTrigger.current = false; // Reset processing flag
        }, 300);
    }
  };
  
  // Handle cash out decision
  const handleCashOut = () => {
    console.log('💰 Cash out at 7');
    
    // Update max streak if 7 is better
    const newMaxStreak = Math.max(playerStats.maxStreak, 7);
    const updatedStats = {
      ...playerStats,
      maxStreak: newMaxStreak,
    };
    
    savePlayerStats(updatedStats);
    setShowDecisionUI(false);
    
    // End run - go back to ready state
    setCurrentRunSafePulls(0);
    setRunLockedIn(false);
    hasPlayedVideo.current = false; // Reset video flag on new round
    isProcessingTrigger.current = false; // Reset trigger processing flag
    setViewMode('ready');
  };
  
  // Handle go for record decision
  const handleGoForRecord = () => {
    console.log('🔥 Going for record - need to re-spin!');
    setRunLockedIn(true);
    setShowDecisionUI(false);
    
    // Go back to loading view to re-spin (bullet position is now known)
    setViewMode('loading');
    setIsLoadingBullet(false);
  };

  // DON'T auto-start - let user click bullet!
  // useEffect removed so bullet shows

  // Show different pages based on navigation
  if (showPage === 'leaderboard') {
    return (
      <div className="min-h-screen bg-black pb-16">
        <Leaderboard mode={isFreeModePlayer ? 'free' : 'paid'} />
        
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 w-full mx-auto">
          <div className="grid grid-cols-3 gap-0 max-w-md mx-auto w-full">
            <button
              onClick={() => setShowPage('game')}
              className="py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <div className="text-xl">🎮</div>
              <div className="text-[10px]">Play</div>
            </button>
            <button
              onClick={() => setShowPage('leaderboard')}
              className="py-3 text-white bg-gray-800 border-t-2 border-yellow-500"
            >
              <div className="text-xl">🏆</div>
              <div className="text-[10px] font-bold">Leaderboard</div>
            </button>
            <button
              onClick={() => setShowPage('profile')}
              className="py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <div className="text-xl">👤</div>
              <div className="text-[10px]">Profile</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPage === 'profile') {
    return (
      <div className="min-h-screen bg-black pb-16">
        <Profile 
          playerStats={playerStats}
          userBalance={userBalance}
          username={username}
          onDeposit={() => setShowDepositModal(true)}
          onWithdraw={() => setShowWithdrawModal(true)}
          onEditUsername={() => setShowUsernameModal(true)}
        />
        
        {/* Bottom Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 w-full mx-auto">
          <div className="grid grid-cols-3 gap-0 max-w-md mx-auto w-full">
            <button
              onClick={() => setShowPage('game')}
              className="py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <div className="text-xl">🎮</div>
              <div className="text-[10px]">Play</div>
            </button>
            <button
              onClick={() => setShowPage('leaderboard')}
              className="py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
            >
              <div className="text-xl">🏆</div>
              <div className="text-[10px]">Leaderboard</div>
            </button>
            <button
              onClick={() => setShowPage('profile')}
              className="py-3 text-white bg-gray-800 border-t-2 border-blue-500"
            >
              <div className="text-xl">👤</div>
              <div className="text-[10px] font-bold">Profile</div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-white flex flex-col items-center p-1 w-full mx-auto overflow-hidden">
      {/* Header - Title centered, buttons below */}
      <div className="w-full pt-1 pb-2 flex-shrink-0">
        {/* Title Row - Compact */}
        <div className="flex items-center justify-between mb-1">
          <div className="w-8"></div>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
              RUSSIAN ROULETTE
            </h1>
            <p className="text-[10px] text-gray-500">Provably Fair</p>
          </div>
          <button
            onClick={() => setShowPage('leaderboard')}
            className="w-8 h-8 bg-yellow-900/30 hover:bg-yellow-800/40 border border-yellow-700 text-yellow-400 rounded-lg transition-all flex items-center justify-center text-sm"
          >
            🏆
          </button>
        </div>
        
        {/* Buttons Row - Compact */}
        <div className="flex items-center justify-between mb-1 gap-1">
          {/* Left - Wallet with Base logo */}
          <Wallet>
            <ConnectWallet className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] px-2 py-1 rounded-lg transition-all flex items-center gap-1">
              <svg className="h-3 w-3" viewBox="0 0 111 111" fill="none">
                <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="white"/>
              </svg>
              <Avatar className="h-4 w-4" />
              <Name />
            </ConnectWallet>
            <WalletDropdown>
              <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                <Avatar />
                <Name />
                <Address />
              </Identity>
              <WalletDropdownFundLink />
              <WalletDropdownDisconnect />
            </WalletDropdown>
          </Wallet>
          
          {/* Right - Free/Paid Mode Buttons */}
          <div className="flex gap-1">
            <button
              onClick={() => setIsFreeModePlayer(true)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                isFreeModePlayer
                  ? 'bg-green-600 text-white border border-green-500'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              🆓 FREE
            </button>
            <button
              onClick={() => {
                if (!isConnected) {
                  alert('Connect wallet first');
                  return;
                }
                if (userBalance < 1) {
                  alert('Need at least 1 USDC');
                  setShowDepositModal(true);
                  return;
                }
                setIsFreeModePlayer(false);
              }}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                !isFreeModePlayer
                  ? 'bg-yellow-600 text-white border border-yellow-500'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 hover:bg-gray-700'
              }`}
            >
              💰 USDC
            </button>
          </div>
        </div>

        {/* Balance Row (only if connected) */}
        {isConnected && (
          <div className="bg-gray-900/50 border border-gray-800 rounded-lg px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs">
                <span className="text-gray-500">Balance: </span>
                <span className="text-yellow-400 font-bold">{userBalance.toFixed(2)} USDC</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded transition-all"
                >
                  + Deposit
                </button>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  disabled={userBalance === 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Withdraw
                </button>
              </div>
            </div>
            {pendingPrizes > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-800">
                <span className="text-gray-500">Pending Prizes: </span>
                <button
                  onClick={() => setShowPendingPrizesModal(true)}
                  className="text-orange-400 font-bold hover:text-orange-300 underline"
                >
                  {pendingPrizes.toFixed(2)} USDC (Click to approve)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats - 5 Cards in One Row (only when playing) */}
      {viewMode === 'front' && (state.phase === 'LOADED' || state.phase === 'PLAYING') && (
        <div className="w-full max-w-md mx-auto mb-2 flex-shrink-0">
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Run Streak</p>
              <p className="text-base font-bold text-yellow-500">{currentRunSafePulls}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Max Streak</p>
              <p className="text-base font-bold text-green-500">{playerStats.maxStreak}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Score</p>
              <p className="text-base font-bold text-blue-500">{calculateScore(playerStats.maxStreak, playerStats.totalPulls, playerStats.totalDeaths).toFixed(2)}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Deaths/Pulls</p>
              <p className="text-xs font-bold text-red-400">{playerStats.totalDeaths}/{playerStats.totalPulls}</p>
            </div>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Risk Ratio</p>
              <p className="text-xs font-bold text-orange-400">
                {(playerStats.totalDeaths / Math.max(1, playerStats.totalPulls)).toFixed(3)}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Locked In Indicator */}
      {state.runLockedIn && viewMode === 'front' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-900/40 border border-orange-700 text-orange-300 text-[10px] px-2 py-0.5 rounded-lg text-center font-bold mb-2"
        >
          🔒 LOCKED IN
        </motion.div>
      )}

      {/* STEP 0: Bullet to Load (Ready state) */}
      {viewMode === 'ready' && state.phase === 'READY' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="my-1 flex flex-col items-center justify-center flex-1 min-h-0"
        >
          <p className="text-[11px] text-gray-500 text-center mb-2">Click bullet to load</p>
          <motion.button
            onClick={handleNewRound}
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.95 }}
            className="relative group"
          >
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 blur-xl bg-amber-500/50 rounded-full"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Bullet Image */}
            <div className="relative w-20 h-32">
              <img 
                src="/images/bullet.png" 
                alt="Bullet"
                className="w-full h-full object-contain drop-shadow-[0_5px_15px_rgba(245,158,11,0.5)]"
              />
            </div>
          </motion.button>
        </motion.div>
      )}

      {/* STEP 0: BACK VIEW - Loading bullet (cylinder open, swung LEFT) */}
      {(viewMode === 'loading' || viewMode === 'spinning') && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="my-1 flex flex-col items-center justify-center flex-1 min-h-0"
        >
          {viewMode === 'loading' && !isLoadingBullet && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-yellow-400 text-center mb-2 font-bold text-sm"
            >
              👆 TAP CYLINDER TO SPIN
            </motion.p>
          )}
          {isLoadingBullet && (
            <p className="text-yellow-400 text-center mb-4 font-bold">Loading bullet...</p>
          )}
          {viewMode === 'spinning' && (
            <p className="text-yellow-400 text-center mb-4 font-bold">Spinning...</p>
          )}
          
          {/* BACK VIEW: Cylinder swung out to the LEFT */}
          <div className="relative w-80 h-64">
            {/* Gun body (right side) */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-32 h-40 bg-gradient-to-br from-gray-700 via-gray-900 to-black rounded-lg border-2 border-gray-700 shadow-2xl">
              <div className="absolute top-8 left-4 w-20 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded" />
            </div>
            
            {/* Cylinder (swung LEFT, OPEN) - showing bullet from BACK - CLICKABLE */}
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ 
                x: 0, 
                opacity: 1,
                rotate: viewMode === 'spinning' ? [0, 720] : 0
              }}
              transition={{ 
                x: { duration: 0.5 },
                opacity: { duration: 0.5 },
                rotate: { duration: 2, ease: [0.43, 0.13, 0.23, 0.96] }
              }}
              onClick={viewMode === 'loading' && !isLoadingBullet ? handleSpin : undefined}
              className={`absolute left-8 top-1/2 transform -translate-y-1/2 w-48 h-48 ${viewMode === 'loading' && !isLoadingBullet ? 'cursor-pointer' : ''}`}
              whileHover={viewMode === 'loading' && !isLoadingBullet ? { scale: 1.05 } : {}}
            >
              {/* Cylinder base */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border-4 border-gray-700 shadow-2xl" />
              
              {/* 8 chamber holes (BACK VIEW - showing backs of chambers) */}
              {Array.from({ length: 8 }).map((_, i) => {
                const angle = (i * 360) / 8;
                const radian = (angle * Math.PI) / 180;
                const radius = 60;
                const x = Math.cos(radian) * radius;
                const y = Math.sin(radian) * radius;
                const hasBullet = i === state.bulletIndex;
                
                return (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="absolute w-10 h-10 transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `calc(50% + ${x}px)`,
                      top: `calc(50% + ${y}px)`,
                    }}
                  >
                    {/* Chamber hole */}
                    <div className="w-full h-full rounded-full bg-gray-900 border-2 border-gray-700 flex items-center justify-center">
                      {/* Show bullet BACK (brass bottom) in the correct chamber */}
                      {hasBullet && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-2 border-amber-700 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
              
              {/* Center pin */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-gray-800 rounded-full border-2 border-gray-600" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* STEP 1: Closing cylinder animation */}
      {viewMode === 'closing' && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="my-1 flex flex-col items-center justify-center flex-1 min-h-0"
        >
          <p className="text-green-400 text-center mb-2 font-bold text-sm">Closing...</p>
          
          {/* BACK VIEW: Cylinder closing INTO the gun */}
          <div className="relative w-80 h-64">
            {/* Gun body (right side) */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-32 h-40 bg-gradient-to-br from-gray-700 via-gray-900 to-black rounded-lg border-2 border-gray-700 shadow-2xl">
              <div className="absolute top-8 left-4 w-20 h-16 bg-gradient-to-r from-gray-800 to-gray-900 rounded" />
            </div>
            
            {/* Cylinder (closing into gun) */}
            <motion.div
              initial={{ x: 0 }}
              animate={{ x: 150, opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute left-8 top-1/2 transform -translate-y-1/2 w-48 h-48"
            >
              {/* Cylinder base */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full border-4 border-gray-700 shadow-2xl" />
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* STEP 2: FRONT VIEW - Proper revolver geometry */}
      {viewMode === 'front' && state.phase !== 'READY' && state.phase !== 'REVEAL' && (
        <motion.div
          initial={{ scale: 0.5, rotateY: 180 }}
          animate={{ scale: 1, rotateY: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="flex flex-col items-center justify-center w-full max-w-md flex-1"
        >
          <p className="text-green-400 text-center mb-6 mt-0 font-bold text-sm">Ready to play!</p>
          
          {/* FRONT VIEW: Barrel aligned with TOP chamber hole */}
          <div className="relative w-full flex flex-col items-center justify-center">
            
            {/* Barrel + Chamber Container - Centered */}
            <div className="relative w-40 h-40 flex items-center justify-center mx-auto">
              
              {/* LAYER 1: Rotating Chamber (BEHIND barrel) */}
              <motion.div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{ zIndex: 2 }}
                animate={{
                  rotate: cylinderRotation
                }}
                transition={{
                  type: "tween",
                  duration: 0.3,
                  ease: "easeOut"
                }}
              >
                <div className="relative w-44 h-44">
                  {/* Cylinder body */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800 rounded-full border-4 border-gray-700 shadow-2xl" />
                  
                  {/* 8 chamber holes - bigger and closer to center */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const angle = (i * 360) / 8;
                    const radian = (angle * Math.PI) / 180;
                    const radius = 70; // Scaled down for smaller chamber
                    const x = Math.cos(radian) * radius;
                    const y = Math.sin(radian) * radius;
                    
                    return (
                      <div
                        key={i}
                        className="absolute w-9 h-9 transform -translate-x-1/2 -translate-y-1/2"
                        style={{
                          left: `calc(50% + ${x}px)`,
                          top: `calc(50% + ${y}px)`,
                        }}
                      >
                        <div className="w-full h-full rounded-full bg-gray-900 border-2 border-gray-800 shadow-inner" />
                      </div>
                    );
                  })}
                  
                  {/* Center pin */}
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-gray-800 rounded-full border-2 border-gray-700 shadow-lg" />
                </div>
              </motion.div>
              
              {/* LAYER 2: Barrel aligned with top chamber hole */}
              <div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2" 
                style={{ 
                  marginTop: '-70px', // Align with top chamber hole (radius 70)
                  zIndex: 5 
                }}
              >
                <div className="flex flex-col items-center">
                  {/* Sights container - aligned by bottom edge */}
                  <div className="relative h-[8px] w-16 mb-0">
                    {/* Rear sight - slightly lower */}
                    <div className="absolute left-1/2 transform -translate-x-1/2 w-6 h-[6px] bg-gray-700 border border-gray-600 flex items-center justify-center" style={{ bottom: '-3px' }}>
                      <div className="w-[1.5px] h-full bg-gray-900" />
                    </div>
                    
                    {/* Front sight - full height, centered horizontally */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-[2px] h-[8px] bg-gray-600 border-x border-gray-500" />
                  </div>
                  
                  {/* Barrel - immediately below sights */}
                  <div className="relative w-16 h-16">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-full border-3 border-gray-700 shadow-[0_0_30px_rgba(0,0,0,0.9)]">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-black rounded-full border-2 border-gray-900 shadow-[inset_0_0_15px_rgba(0,0,0,1)]">
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-gray-950 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* SIDE VIEW TRIGGER (below) */}
            <div className="mt-2 mb-1 flex flex-col items-center">
              <p className="text-[10px] text-gray-500 text-center mb-1">Chamber {state.chamberIndex + 1} of 8</p>
              
              {/* Trigger with custom images */}
              <motion.button
                onPointerUp={handlePullTrigger}
                onMouseEnter={() => {
                  if (!isAnimating && !triggerCooldown && !showDeathVideo && viewMode === 'front' && (state.phase === 'LOADED' || state.phase === 'PLAYING')) {
                    startBuildup();
                  }
                }}
                onMouseLeave={() => {
                  if (!isAnimating && !triggerCooldown && !showDeathVideo && viewMode === 'front' && (state.phase === 'LOADED' || state.phase === 'PLAYING')) {
                    stopBuildup();
                  }
                }}
                disabled={isAnimating || triggerCooldown || showDeathVideo}
                className="flex flex-col items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ touchAction: 'manipulation' }}
                whileHover={!isAnimating && !triggerCooldown ? { scale: 1.05 } : {}}
              >
                <motion.div
                  animate={isAnimating ? { scale: [1, 0.95, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <img 
                    src={isAnimating ? "/images/trigger_pulled.png" : "/images/trigger.png"}
                    alt="Trigger"
                    className="w-12 h-12 object-contain drop-shadow-2xl"
                  />
                </motion.div>
                
                <p className="text-[10px] text-gray-400 text-center">👆 Pull to fire</p>
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Controls */}
      <div className="w-full max-w-md mx-auto space-y-2 flex flex-col justify-end pb-2 flex-1 overflow-y-auto">
        {/* Stats and Status */}
        {viewMode === 'front' && (state.phase === 'LOADED' || state.phase === 'PLAYING') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            {/* Locked in indicator */}
            {runLockedIn && (
              <div className="bg-orange-900/40 border border-orange-700 text-orange-400 text-xs px-3 py-1 rounded-full inline-block animate-pulse">
                🔥 LOCKED IN - No cash out
              </div>
            )}
            
            {/* Current run streak */}
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <span>Safe Pulls: <span className="text-green-400 font-bold">{currentRunSafePulls}</span></span>
              <span>Max Streak: <span className="text-yellow-400 font-bold">{playerStats.maxStreak}</span></span>
              <span>Score: <span className="text-blue-400 font-bold">{calculateScore(playerStats.maxStreak, playerStats.totalPulls, playerStats.totalDeaths).toFixed(2)}</span></span>
            </div>
            
            <p className="text-xs text-gray-400">👆 Tap trigger to fire</p>
          </motion.div>
        )}

        {/* Commit Hash Display - Below trigger */}
        {state.commitHash && state.phase !== 'REVEAL' && (state.phase === 'LOADED' || state.phase === 'PLAYING') && (
          <div className="w-full bg-gray-900/50 border border-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-2">Commit Hash (Verify Later):</p>
            <p className="text-xs text-yellow-500 font-mono break-all">
              {state.commitHash.substring(0, 32)}...
            </p>
          </div>
        )}

        {/* Death Screen */}
        <AnimatePresence>
          {(state.phase === 'DEAD' || state.phase === 'REVEAL') && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8 z-10"
            >
              <motion.div
                animate={{ rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-8xl mb-4"
              >
                💀
              </motion.div>
              <h2 className="text-4xl font-bold text-red-500 mb-2">BANG!</h2>
              <p className="text-gray-400 mb-6">Chamber {state.chamberIndex + 1} had the bullet</p>
              
              <div className="space-y-3 w-full max-w-xs">
                <button
                  onClick={handleNewRound}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 px-6 rounded-xl hover:from-green-700 hover:to-green-800 transition-all"
                >
                  Try Again
                </button>
                
                {state.serverSeed && (
                  <button
                    onClick={() => setShowVerification(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
                  >
                    🔍 Verify Fairness
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fairness Verification Modal */}
      {showVerification && state.serverSeed && state.commitHash && (
        <FairnessVerification
          commitHash={state.commitHash}
          serverSeed={state.serverSeed}
          roundId={state.roundId}
          bulletIndex={state.bulletIndex!}
          onClose={() => setShowVerification(false)}
        />
      )}

      {/* Decision UI - At 7 Safe Pulls */}
      <AnimatePresence>
        {showDecisionUI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-yellow-500 rounded-2xl p-8 max-w-md mx-4 shadow-[0_0_50px_rgba(234,179,8,0.5)]"
            >
              <h2 className="text-3xl font-bold text-center mb-2 text-yellow-400">
                🎯 You survived 7
              </h2>
              
              <p className="text-gray-300 text-center mb-8 text-sm">
                Make your choice. This decision is final.
              </p>

              <div className="space-y-4">
                {/* Cash Out Option */}
                <motion.button
                  onClick={handleCashOut}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-5 px-6 rounded-xl transition-all shadow-lg border border-gray-600"
                >
                  <div className="text-xl">💰 Cash out (Lock in 7)</div>
                  <div className="text-xs mt-2 opacity-80">End run safely, record streak of 7</div>
                </motion.button>

                {/* Go for Record Option */}
                <motion.button
                  onClick={handleGoForRecord}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 text-white font-bold py-5 px-6 rounded-xl transition-all transform shadow-lg border-2 border-orange-500"
                >
                  <div className="text-xl">🔥 Go for record</div>
                  <div className="text-xs mt-2 opacity-90">No backing out - play until death</div>
                </motion.button>
              </div>

              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <p className="text-xs text-yellow-300 text-center leading-relaxed">
                  ⚠️ <strong>Warning:</strong> Once you choose "Go for record", 
                  you cannot cash out until this run ends (death).
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decision UI - At 7 Safe Pulls */}
      <AnimatePresence>
        {showDecisionUI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/95 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-gradient-to-br from-gray-900 to-black border-4 border-yellow-500 rounded-2xl p-8 max-w-md mx-4 shadow-[0_0_60px_rgba(234,179,8,0.5)]"
            >
              <div className="text-center mb-6">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-6xl mb-4"
                >
                  🎯
                </motion.div>
                <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                  You survived 7.
                </h2>
                <p className="text-gray-400 text-sm">
                  Current run: {currentRunSafePulls} safe pulls
                </p>
              </div>

              <div className="space-y-4">
                {/* Option A: Cash Out */}
                <button
                  onClick={handleCashOut}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg border-2 border-gray-600"
                >
                  <div className="text-xl">💰 Cash Out (Lock in 7)</div>
                  <div className="text-xs mt-1 opacity-80">End run safely • Update max streak</div>
                </button>

                {/* Option B: Go for Record */}
                <button
                  onClick={handleGoForRecord}
                  className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg border-2 border-red-500"
                >
                  <div className="text-xl">🔥 Go for Record</div>
                  <div className="text-xs mt-1 opacity-80">⚠️ No backing out • Risk everything</div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-400 text-center">
                  <span className="text-yellow-400 font-bold">Your Stats:</span><br/>
                  Max Streak: {playerStats.maxStreak} • Deaths: {playerStats.totalDeaths} • Pulls: {playerStats.totalPulls}<br/>
                  Score: {calculateScore(playerStats.maxStreak, playerStats.totalPulls, playerStats.totalDeaths).toFixed(2)}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Choice Modal - After First Round */}
      <AnimatePresence>
        {showPaymentChoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-red-500 rounded-2xl p-8 max-w-md mx-4 shadow-[0_0_50px_rgba(239,68,68,0.5)]"
            >
              <h2 className="text-2xl font-bold text-center mb-4 text-red-500">
                💀 YOU DIED 💀
              </h2>
              
              <p className="text-gray-300 text-center mb-6">
                Want to play for real prizes?
              </p>

              <div className="space-y-4">
                {/* USDC Mode Option */}
                <button
                  onClick={handleChooseUSDC}
                  className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-105 shadow-lg"
                >
                  <div className="text-lg">💰 Play with 1 USDC</div>
                  <div className="text-xs mt-1 opacity-80">Join weekly prize pool & leaderboard</div>
                </button>

                {/* Stay Free Option */}
                <button
                  onClick={handleStayFree}
                  className="w-full bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-bold py-4 px-6 rounded-xl transition-all"
                >
                  <div className="text-lg">🆓 Stay Free</div>
                  <div className="text-xs mt-1 opacity-80">Keep playing for fun (separate leaderboard)</div>
                </button>
              </div>

              {!isConnected && (
                <div className="mt-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
                  <p className="text-xs text-blue-300 text-center mb-2">
                    💡 Connect wallet to play with USDC
                  </p>
                  <div className="flex justify-center">
                    <Wallet>
                      <ConnectWallet className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all">
                        <Name />
                      </ConnectWallet>
                      <WalletDropdown>
                        <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                          <Avatar />
                          <Name />
                          <Address />
                        </Identity>
                        <WalletDropdownFundLink />
                        <WalletDropdownDisconnect />
                      </WalletDropdown>
                    </Wallet>
                  </div>
                </div>
              )}
              
              {isConnected && usdcBalance < 1 && (
                <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-700 rounded-lg text-center">
                  <p className="text-xs text-yellow-300">
                    ⚠️ Wallet balance too low. You have {usdcBalance.toFixed(2)} USDC. Need at least 1 USDC to play.
                  </p>
                </div>
              )}
              
              {isPaymentPending && (
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-center">
                  <p className="text-xs text-blue-300">
                    ⏳ Processing payment...
                  </p>
                </div>
              )}
              
              {isPaymentConfirming && (
                <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-center">
                  <p className="text-xs text-blue-300">
                    ⏳ Confirming transaction...
                  </p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Death Video Overlay - Plays immediately when shot */}
      <AnimatePresence mode="wait">
        {showDeathVideo && (
          <motion.div
            key="death-video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.pause();
              }
              hasPlayedVideo.current = false;
              setShowDeathVideo(false);
            }}
          >
            <video
              ref={videoRef}
              autoPlay
              muted={true}
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              onLoadStart={() => {
                console.log('📹 Video loading started');
                // Reset video when it starts loading
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                }
              }}
              onLoadedMetadata={() => {
                console.log('📹 Video metadata loaded');
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                }
              }}
              onLoadedData={() => {
                console.log('📹 Video data loaded, attempting to play');
                // Ensure video plays from start when loaded
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  // Unmute after starting to play (for sound)
                  const playPromise = videoRef.current.play();
                  if (playPromise !== undefined) {
                    playPromise
                      .then(() => {
                        console.log('✅ Video play started');
                        // Unmute after play starts (browser autoplay policy)
                        if (videoRef.current) {
                          videoRef.current.muted = false;
                        }
                      })
                      .catch(err => {
                        console.error('❌ Video play error:', err);
                        // Try with muted if unmuted fails
                        if (videoRef.current) {
                          videoRef.current.muted = true;
                          videoRef.current.play().catch(() => {
                            // If still fails, close overlay
                            setTimeout(() => {
                              hasPlayedVideo.current = false;
                              setShowDeathVideo(false);
                            }, 500);
                          });
                        }
                      });
                  }
                }
              }}
              onCanPlay={() => {
                console.log('📹 Video can play');
                if (videoRef.current && showDeathVideo) {
                  videoRef.current.currentTime = 0;
                }
              }}
              onPlaying={() => {
                // Video is playing successfully
                console.log('🎬 Explosion video playing');
              }}
              onEnded={() => {
                // Close immediately when video ends
                console.log('🎬 Video ended, closing overlay');
                hasPlayedVideo.current = false;
                setShowDeathVideo(false);
              }}
              onError={(e) => {
                // Handle video load errors - close overlay
                console.error('❌ Video error:', e, videoRef.current?.error);
                setTimeout(() => {
                  hasPlayedVideo.current = false;
                  setShowDeathVideo(false);
                }, 500);
              }}
            >
              <source src="/videos/explosion.mp4" type="video/mp4" />
              <source src="/videos/explosion.webm" type="video/webm" />
            </video>
            
            {/* Click to skip hint */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 text-sm font-bold animate-pulse pointer-events-none">
              👆 Tap to skip
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deposit Modal */}
      <AnimatePresence>
        {showDepositModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setShowDepositModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-green-500 rounded-2xl p-6 max-w-sm mx-4"
            >
              <h3 className="text-xl font-bold text-center mb-4 text-green-400">
                💵 Deposit USDC
              </h3>
              
              <p className="text-sm text-gray-300 mb-4 text-center">
                Add USDC to your game balance
              </p>

              <div className="space-y-3">
                {[1, 5, 10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleDeposit(amount)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
                  >
                    Deposit {amount} USDC
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowDepositModal(false)}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                Note: This is a demo. Real USDC transfers coming soon.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-blue-500 rounded-2xl p-6 max-w-sm mx-4"
            >
              <h3 className="text-xl font-bold text-center mb-4 text-blue-400">
                💸 Withdraw USDC
              </h3>
              
              <div className="bg-gray-800/50 rounded-lg p-3 mb-4">
                <p className="text-sm text-gray-400 text-center">
                  Available Balance
                </p>
                <p className="text-2xl font-bold text-yellow-400 text-center">
                  {userBalance.toFixed(2)} USDC
                </p>
              </div>

              <div className="space-y-3">
                {[1, 5, 10].map((amount) => (
                  amount <= userBalance && (
                    <button
                      key={amount}
                      onClick={() => handleWithdraw(amount)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all transform hover:scale-105"
                    >
                      Withdraw {amount} USDC
                    </button>
                  )
                ))}
                {userBalance > 0 && (
                  <button
                    onClick={() => handleWithdraw(userBalance)}
                    className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 px-4 rounded-lg transition-all"
                  >
                    Withdraw All ({userBalance.toFixed(2)} USDC)
                  </button>
                )}
              </div>

              <button
                onClick={() => setShowWithdrawModal(false)}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Cancel
              </button>

              <p className="text-xs text-gray-500 mt-4 text-center">
                USDC will be sent to your connected wallet.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pending Prizes Modal */}
      <AnimatePresence>
        {showPendingPrizesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
            onClick={() => setShowPendingPrizesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-gray-900 to-black border-2 border-orange-500 rounded-2xl p-6 max-w-sm mx-4 max-h-[80vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-center mb-4 text-orange-400">
                🎁 Pending Prizes
              </h3>
              
              {address && (() => {
                const pending = getPendingDistributionsForAddress(address);
                return (
                  <div className="space-y-3">
                    {pending.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        No pending prizes
                      </p>
                    ) : (
                      <>
                        {pending.map((dist: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs text-gray-400">Rank #{dist.rank}</span>
                              <span className="text-lg font-bold text-orange-400">
                                {dist.amount.toFixed(2)} USDC
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">
                              Distribution ID: {dist.distributionId.slice(0, 16)}...
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Status: <span className="text-orange-400">Pending Approval</span>
                            </p>
                            <button
                              onClick={() => handleApprovePendingPrize(dist.amount)}
                              className="w-full mt-3 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-all"
                            >
                              ✅ Approve & Add to Balance
                            </button>
                          </div>
                        ))}
                        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mt-3">
                          <p className="text-xs text-blue-300 text-center">
                            Total Pending: <span className="font-bold">{pendingPrizes.toFixed(2)} USDC</span>
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              <button
                onClick={() => setShowPendingPrizesModal(false)}
                className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-all"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 w-full mx-auto">
        <div className="grid grid-cols-3 gap-0 max-w-md mx-auto w-full">
          <button
            onClick={() => setShowPage('game')}
            className="py-3 text-white bg-gray-800 border-t-2 border-red-500"
          >
            <div className="text-xl">🎮</div>
            <div className="text-[10px] font-bold">Play</div>
          </button>
          <button
            onClick={() => setShowPage('leaderboard')}
            className="py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <div className="text-xl">🏆</div>
            <div className="text-[10px]">Leaderboard</div>
          </button>
          <button
            onClick={() => setShowPage('profile')}
            className="py-3 text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            <div className="text-xl">👤</div>
            <div className="text-[10px]">Profile</div>
          </button>
        </div>
      </div>
      
      {/* Username Modal */}
      <UsernameModal
        isOpen={showUsernameModal}
        currentUsername={username}
        onSave={handleSaveUsername}
        onClose={() => setShowUsernameModal(false)}
      />
    </div>
  );
}