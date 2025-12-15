export interface GameState {
  bulletPosition: number | null;
  currentChamber: number;
  triggerPulls: number;
  deaths: number;
  isSpinning: boolean;
  isGameOver: boolean;
  isPaid: boolean;
  chambersCleared: number;
}

export interface PlayerStats {
  address: string;
  username?: string;
  triggerPulls: number;
  deaths: number;
  lastPlayed: number;
  isPaid: boolean;
}

export interface LeaderboardEntry extends PlayerStats {
  rank: number;
}

export interface PrizePool {
  totalAmount: number;
  participants: number;
  lastUpdated: number;
}


