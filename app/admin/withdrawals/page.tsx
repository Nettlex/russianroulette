"use client";
import { useState, useEffect } from 'react';

interface WithdrawalRequest {
  requestId: string;
  address: string;
  amount: number;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  transactionHash?: string;
  rejectedReason?: string;
  processedAt?: number;
  processedBy?: string;
}

export default function WithdrawalsAdminPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [txHash, setTxHash] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadWithdrawals();
    // Refresh every 30 seconds
    const interval = setInterval(loadWithdrawals, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadWithdrawals = async () => {
    try {
      const response = await fetch('/api/withdraw?action=pending');
      const data = await response.json();
      setWithdrawals(data.withdrawals || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (requestId: string, status: 'approved' | 'rejected' | 'completed') => {
    if (status === 'approved' && !txHash.trim()) {
      alert('Please enter transaction hash for approval');
      return;
    }

    if (status === 'rejected' && !rejectReason.trim()) {
      alert('Please enter rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          requestId,
          status,
          transactionHash: txHash || undefined,
          rejectedReason: rejectReason || undefined,
          processedBy: 'admin', // In production, use actual admin identifier
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ Withdrawal ${requestId} updated to ${status}`);
        setSelectedRequest(null);
        setTxHash('');
        setRejectReason('');
        loadWithdrawals();
      } else {
        alert(`Error: ${data.error || 'Failed to update withdrawal'}`);
      }
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      alert('Failed to update withdrawal. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <h1 className="text-2xl font-bold mb-4">Loading withdrawals...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">💰 Withdrawal Requests</h1>
      
      <div className="mb-4 p-4 bg-gray-900 rounded-lg">
        <p className="text-sm text-gray-400">
          Total Pending: <span className="text-yellow-400 font-bold">{withdrawals.length}</span>
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Logs are saved to: <code className="bg-gray-800 px-2 py-1 rounded">logs/withdrawals.json</code>
        </p>
      </div>

      {withdrawals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">No pending withdrawal requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((request) => (
            <div
              key={request.requestId}
              className="bg-gray-900 border border-gray-800 rounded-lg p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-400">Request ID</p>
                  <p className="font-mono text-xs text-gray-300">{request.requestId}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-400">{request.amount.toFixed(2)} USDC</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDate(request.timestamp)}</p>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-400 mb-1">Wallet Address</p>
                <p className="font-mono text-sm text-white break-all">{request.address}</p>
                <a
                  href={`https://basescan.org/address/${request.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                >
                  View on BaseScan →
                </a>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setSelectedRequest(request)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-all"
                >
                  Process
                </button>
              </div>

              {selectedRequest?.requestId === request.requestId && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="font-bold mb-3">Process Withdrawal</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Transaction Hash (for approval/completion)
                      </label>
                      <input
                        type="text"
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-400 mb-1">
                        Rejection Reason (if rejecting)
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Reason for rejection..."
                        className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(request.requestId, 'approved')}
                        disabled={processing}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-all"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(request.requestId, 'rejected')}
                        disabled={processing}
                        className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(request.requestId, 'completed')}
                        disabled={processing || !txHash.trim()}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded transition-all"
                      >
                        Mark Complete
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRequest(null);
                          setTxHash('');
                          setRejectReason('');
                        }}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-yellow-900/20 border border-yellow-700 rounded-lg">
        <h3 className="font-bold text-yellow-400 mb-2">📋 Instructions</h3>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li>Review each withdrawal request</li>
          <li>Send USDC to the wallet address shown</li>
          <li>Enter the transaction hash from BaseScan</li>
          <li>Click "Approve" or "Mark Complete" after sending</li>
          <li>If rejecting, enter a reason and click "Reject"</li>
        </ol>
        <p className="text-xs text-gray-400 mt-3">
          💡 All withdrawals are logged to <code className="bg-gray-800 px-1 rounded">logs/withdrawals.json</code>
        </p>
      </div>
    </div>
  );
}

