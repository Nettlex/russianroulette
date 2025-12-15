import { GameState, PlayerStats } from '../types/game';

export const CHAMBERS_COUNT = 8;
export const SHOTS_PER_ROUND = 7;
export const ENTRY_FEE_USDC = 1;

export function initializeGame(isPaid: boolean = false): GameState {
  return {
    bulletPosition: null,
    currentChamber: 0,
    triggerPulls: 0,
    deaths: 0,
    isSpinning: false,
    isGameOver: false,
    isPaid,
    chambersCleared: 0,
  };
}

export function loadBullet(gameState: GameState): GameState {
  const bulletPosition = Math.floor(Math.random() * CHAMBERS_COUNT);
  console.log('🔫 BULLET LOADED at chamber:', bulletPosition);
  return {
    ...gameState,
    bulletPosition,
    currentChamber: 0, // Reset to starting position
  };
}

export function spinChamber(gameState: GameState): GameState {
  // Spin to a new random position
  let newChamber = Math.floor(Math.random() * CHAMBERS_COUNT);
  // Make sure it's different from current to show actual spinning
  while (newChamber === gameState.currentChamber && CHAMBERS_COUNT > 1) {
    newChamber = Math.floor(Math.random() * CHAMBERS_COUNT);
  }
  
  console.log('Spinning - Bullet at:', gameState.bulletPosition, 'Chamber will be:', newChamber);
  
  return {
    ...gameState,
    currentChamber: newChamber,
    isSpinning: true,
  };
}

export function finishSpin(gameState: GameState): GameState {
  return {
    ...gameState,
    isSpinning: false,
  };
}

export function pullTrigger(gameState: GameState): GameState {
  const isHit = gameState.currentChamber === gameState.bulletPosition;
  const newTriggerPulls = gameState.triggerPulls + 1;
  
  console.log('FIRING - Current chamber:', gameState.currentChamber, 'Bullet at:', gameState.bulletPosition, 'HIT:', isHit);
  
  if (isHit) {
    // Player died - BANG!
    console.log('💀 PLAYER DIED!');
    return {
      ...gameState,
      triggerPulls: newTriggerPulls,
      deaths: gameState.deaths + 1,
      isGameOver: true,
      currentChamber: gameState.bulletPosition ?? gameState.currentChamber, // Show the bullet chamber (fallback to current if null)
    };
  }
  
  console.log('✅ SURVIVED! Shots in this round:', newTriggerPulls % SHOTS_PER_ROUND || SHOTS_PER_ROUND);
  
  // Check if completed 7 shots (chamber needs reload)
  const shotsInRound = newTriggerPulls % SHOTS_PER_ROUND;
  if (shotsInRound === 0 && newTriggerPulls > 0) {
    console.log('🎉 CHAMBER CLEARED! Reloading...');
    return {
      ...gameState,
      triggerPulls: newTriggerPulls,
      bulletPosition: null, // Need to reload
      chambersCleared: gameState.chambersCleared + 1,
      currentChamber: 0, // Reset chamber
    };
  }
  
  return {
    ...gameState,
    triggerPulls: newTriggerPulls,
  };
}

export function resetGame(gameState: GameState): GameState {
  return {
    ...initializeGame(gameState.isPaid),
    deaths: gameState.deaths,
    triggerPulls: gameState.triggerPulls,
  };
}

export function calculatePrizeDistribution(
  prizePool: number,
  participants: PlayerStats[]
): Map<string, number> {
  const distribution = new Map<string, number>();
  
  if (participants.length === 0) return distribution;
  
  // Sort by trigger pulls (desc) and deaths (asc)
  const sorted = [...participants].sort((a, b) => {
    if (b.triggerPulls !== a.triggerPulls) {
      return b.triggerPulls - a.triggerPulls;
    }
    return a.deaths - b.deaths;
  });
  
  // Prize distribution:
  // 1st place: 40%
  // 2nd place: 25%
  // 3rd place: 15%
  // Remaining 20% split among all other participants
  
  if (sorted.length === 1) {
    distribution.set(sorted[0].address, prizePool);
  } else if (sorted.length === 2) {
    distribution.set(sorted[0].address, prizePool * 0.65);
    distribution.set(sorted[1].address, prizePool * 0.35);
  } else if (sorted.length === 3) {
    distribution.set(sorted[0].address, prizePool * 0.4);
    distribution.set(sorted[1].address, prizePool * 0.35);
    distribution.set(sorted[2].address, prizePool * 0.25);
  } else {
    distribution.set(sorted[0].address, prizePool * 0.4);
    distribution.set(sorted[1].address, prizePool * 0.25);
    distribution.set(sorted[2].address, prizePool * 0.15);
    
    const remaining = prizePool * 0.2;
    const perParticipant = remaining / (sorted.length - 3);
    
    for (let i = 3; i < sorted.length; i++) {
      distribution.set(sorted[i].address, perParticipant);
    }
  }
  
  return distribution;
}


