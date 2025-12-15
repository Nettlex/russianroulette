"use client";
import { useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi';
import { parseUnits } from 'viem';
import { base, baseSepolia } from 'wagmi/chains';

// USDC contract addresses
// Base Mainnet USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
// Base Sepolia USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
const USDC_ADDRESS = process.env.NEXT_PUBLIC_CHAIN === 'mainnet'
  ? '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
  : '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Your prize pool wallet address (CHANGE THIS!)
const PRIZE_POOL_WALLET = process.env.NEXT_PUBLIC_PRIZE_POOL_WALLET || '0x0000000000000000000000000000000000000000';

// USDC ABI
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
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export function useUSDCPayment(userAddress?: string) {
  const { writeContract, data: hash, error, isPending } = useWriteContract();
  
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  // Check user's USDC balance
  const { data: balance } = useReadContract({
    address: USDC_ADDRESS as `0x${string}`,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress as `0x${string}`] : undefined,
  });

  const payEntryFee = async (amount: number = 1) => {
    if (!userAddress) {
      throw new Error('Wallet not connected');
    }

    if (PRIZE_POOL_WALLET === '0x0000000000000000000000000000000000000000') {
      throw new Error('Prize pool wallet not configured');
    }

    try {
      // Convert amount to USDC units (6 decimals)
      const amountInUnits = parseUnits(amount.toString(), 6);
      
      // Check balance
      if (balance && balance < amountInUnits) {
        throw new Error(`Insufficient USDC balance. You have ${Number(balance) / 1_000_000} USDC`);
      }
      
      console.log('Sending', amount, 'USDC to', PRIZE_POOL_WALLET);
      
      // Send USDC to prize pool wallet
      writeContract({
        address: USDC_ADDRESS as `0x${string}`,
        abi: USDC_ABI,
        functionName: 'transfer',
        args: [PRIZE_POOL_WALLET as `0x${string}`, amountInUnits],
      });
    } catch (err) {
      console.error('Payment error:', err);
      throw err;
    }
  };

  return {
    payEntryFee,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
    balance: balance ? Number(balance) / 1_000_000 : 0,
    usdcAddress: USDC_ADDRESS,
    prizePoolWallet: PRIZE_POOL_WALLET,
  };
}


