import { NextRequest, NextResponse } from 'next/server';
import { saveWithdrawalRequest, getWithdrawalsForAddress, getPendingWithdrawals, updateWithdrawalStatus } from '../../utils/withdrawalManager';

/**
 * GET /api/withdraw
 * - Get withdrawal requests for an address
 * - Get all pending withdrawals (admin)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');
  const action = searchParams.get('action');

  // Admin endpoint to get all pending withdrawals
  if (action === 'pending') {
    const pending = getPendingWithdrawals();
    return NextResponse.json({ 
      withdrawals: pending,
      count: pending.length 
    });
  }

  // Get withdrawals for specific address
  if (address) {
    const withdrawals = getWithdrawalsForAddress(address);
    return NextResponse.json({ withdrawals });
  }

  return NextResponse.json({ error: 'Missing address or action' }, { status: 400 });
}

/**
 * POST /api/withdraw
 * - Submit a withdrawal request
 * - Update withdrawal status (admin)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, address, amount, requestId, status, transactionHash, rejectedReason, processedBy } = body;

    // Submit new withdrawal request
    if (action === 'request' && address && amount) {
      if (amount <= 0) {
        return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
      }

      const requestId = `withdraw_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const withdrawalRequest = {
        requestId,
        address: address.toLowerCase(),
        amount: Number(amount),
        timestamp: Date.now(),
        status: 'pending' as const,
      };

      saveWithdrawalRequest(withdrawalRequest);

      console.log(`📝 New withdrawal request: ${requestId} - ${address} - ${amount} USDC`);

      return NextResponse.json({ 
        success: true, 
        requestId,
        message: 'Withdrawal request submitted successfully. It will be processed manually.' 
      });
    }

    // Admin: Update withdrawal status
    if (action === 'update' && requestId && status) {
      const validStatuses = ['approved', 'rejected', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const updated = updateWithdrawalStatus(
        requestId,
        status,
        transactionHash,
        rejectedReason,
        processedBy
      );

      if (!updated) {
        return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
      }

      console.log(`✅ Withdrawal ${requestId} updated to ${status}`);

      return NextResponse.json({ 
        success: true, 
        message: `Withdrawal ${requestId} updated to ${status}` 
      });
    }

    return NextResponse.json({ error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (error) {
    console.error('Withdrawal API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


