// Game State Machine - Exact Model Implementation

export const CHAMBERS_COUNT = 8;

export type GamePhase = 'READY' | 'LOADED' | 'PLAYING' | 'DEAD' | 'REVEAL';

export interface GameState {
  phase: GamePhase;
  bulletIndex: number | null;
  chamberIndex: number;
  pullCount: number;
  deathCount: number;
  roundId: string;
  commitHash: string | null;
  serverSeed: string | null;
  lastResult: 'CLICK' | 'BANG' | null;
  currentRunSafePulls: number; // Safe pulls in current run
  runLockedIn: boolean; // True after choosing "Go for record"
}

export type GameAction =
  | { type: 'NEW_ROUND'; payload: { bulletIndex: number; commitHash: string; roundId: string } }
  | { type: 'SPIN_CHAMBER' }
  | { type: 'PULL_TRIGGER' }
  | { type: 'REVEAL'; payload: { serverSeed: string } }
  | { type: 'LOCK_IN_RECORD' }
  | { type: 'RESET' };

export const initialState: GameState = {
  phase: 'READY',
  bulletIndex: null,
  chamberIndex: 0,
  pullCount: 0,
  deathCount: 0,
  roundId: '',
  commitHash: null,
  serverSeed: null,
  lastResult: null,
  currentRunSafePulls: 0,
  runLockedIn: false,
};

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'NEW_ROUND': {
      // Start new round with bullet loaded at random index
      return {
        ...state,
        phase: 'LOADED',
        bulletIndex: action.payload.bulletIndex,
        chamberIndex: 0, // Start at 0 or random
        roundId: action.payload.roundId,
        commitHash: action.payload.commitHash,
        serverSeed: null, // Hidden until reveal
        lastResult: null,
        currentRunSafePulls: 0, // Reset for new run
        runLockedIn: false, // Reset lock
      };
    }

    case 'SPIN_CHAMBER': {
      // Randomize chamber index (NOT bullet index)
      if (state.phase !== 'LOADED' && state.phase !== 'PLAYING') {
        return state;
      }

      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      const newChamberIndex = array[0] % CHAMBERS_COUNT;

      return {
        ...state,
        chamberIndex: newChamberIndex,
      };
    }

    case 'PULL_TRIGGER': {
      if (state.phase !== 'LOADED' && state.phase !== 'PLAYING') {
        return state;
      }

      const currentChamber = state.chamberIndex;
      const isHit = currentChamber === state.bulletIndex;

      if (isHit) {
        // BANG! Round ends
        return {
          ...state,
          phase: 'DEAD',
          lastResult: 'BANG',
          pullCount: state.pullCount + 1,
          deathCount: state.deathCount + 1,
        };
      } else {
        // CLICK! Advance chamber
        const nextChamber = (state.chamberIndex + 1) % CHAMBERS_COUNT;
        const newSafePulls = state.currentRunSafePulls + 1;
        
        return {
          ...state,
          phase: 'PLAYING',
          chamberIndex: nextChamber,
          pullCount: state.pullCount + 1,
          lastResult: 'CLICK',
          currentRunSafePulls: newSafePulls,
        };
      }
    }

    case 'REVEAL': {
      // Reveal server seed for verification
      if (state.phase !== 'DEAD') {
        return state;
      }

      return {
        ...state,
        phase: 'REVEAL',
        serverSeed: action.payload.serverSeed,
      };
    }

    case 'LOCK_IN_RECORD': {
      // Player chose "Go for record"
      return {
        ...state,
        runLockedIn: true,
      };
    }

    case 'RESET': {
      // Reset to ready for new round
      return {
        ...initialState,
        deathCount: state.deathCount,
        pullCount: state.pullCount,
      };
    }

    default:
      return state;
  }
}

