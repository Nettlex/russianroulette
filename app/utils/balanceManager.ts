/**
 * Balance Management with Pending Prizes
 */

export interface BalanceData {
  balance: number;
  pendingPrizes: number;
  lastUpdated: number;
}

const BALANCE_PREFIX = 'balance_';
const PENDING_PRIZES_PREFIX = 'pending_prizes_';

/**
 * Get user balance (including pending prizes)
 */
export function getUserBalance(address: string): BalanceData {
  if (typeof window === 'undefined') {
    return { balance: 0, pendingPrizes: 0, lastUpdated: Date.now() };
  }

  const balanceKey = `${BALANCE_PREFIX}${address}`;
  const pendingKey = `${PENDING_PRIZES_PREFIX}${address}`;

  const balance = parseFloat(localStorage.getItem(balanceKey) || '0');
  const pendingPrizes = parseFloat(localStorage.getItem(pendingKey) || '0');

  return {
    balance,
    pendingPrizes,
    lastUpdated: Date.now(),
  };
}

/**
 * Add pending prize to user balance
 */
export function addPendingPrize(address: string, amount: number): void {
  if (typeof window === 'undefined') return;

  const pendingKey = `${PENDING_PRIZES_PREFIX}${address}`;
  const currentPending = parseFloat(localStorage.getItem(pendingKey) || '0');
  const newPending = currentPending + amount;

  localStorage.setItem(pendingKey, newPending.toFixed(2));
}

/**
 * Approve pending prize (move from pending to balance)
 */
export function approvePendingPrize(address: string, amount: number): void {
  if (typeof window === 'undefined') return;

  const balanceKey = `${BALANCE_PREFIX}${address}`;
  const pendingKey = `${PENDING_PRIZES_PREFIX}${address}`;

  const currentBalance = parseFloat(localStorage.getItem(balanceKey) || '0');
  const currentPending = parseFloat(localStorage.getItem(pendingKey) || '0');

  const newBalance = currentBalance + amount;
  const newPending = Math.max(0, currentPending - amount);

  localStorage.setItem(balanceKey, newBalance.toFixed(2));
  localStorage.setItem(pendingKey, newPending.toFixed(2));
}

/**
 * Update user balance directly
 */
export function updateBalance(address: string, amount: number): void {
  if (typeof window === 'undefined') return;

  const balanceKey = `${BALANCE_PREFIX}${address}`;
  const currentBalance = parseFloat(localStorage.getItem(balanceKey) || '0');
  const newBalance = currentBalance + amount;

  localStorage.setItem(balanceKey, newBalance.toFixed(2));
}

/**
 * Set user balance directly
 */
export function setBalance(address: string, balance: number): void {
  if (typeof window === 'undefined') return;

  const balanceKey = `${BALANCE_PREFIX}${address}`;
  localStorage.setItem(balanceKey, balance.toFixed(2));
}

/**
 * Get total available balance (balance + pending)
 */
export function getTotalAvailableBalance(address: string): number {
  const data = getUserBalance(address);
  return data.balance + data.pendingPrizes;
}

