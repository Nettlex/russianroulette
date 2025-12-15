import fs from 'fs';
import path from 'path';

export interface WithdrawalRequest {
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

const WITHDRAWAL_LOG_FILE = path.join(process.cwd(), 'logs', 'withdrawals.json');

// Ensure logs directory exists
function ensureLogsDir() {
  const logsDir = path.dirname(WITHDRAWAL_LOG_FILE);
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

// Load withdrawal requests from file
export function getWithdrawalRequests(): WithdrawalRequest[] {
  ensureLogsDir();
  
  if (!fs.existsSync(WITHDRAWAL_LOG_FILE)) {
    return [];
  }

  try {
    const data = fs.readFileSync(WITHDRAWAL_LOG_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading withdrawal requests:', error);
    return [];
  }
}

// Save withdrawal request
export function saveWithdrawalRequest(request: WithdrawalRequest): void {
  ensureLogsDir();
  
  const requests = getWithdrawalRequests();
  requests.push(request);
  
  fs.writeFileSync(WITHDRAWAL_LOG_FILE, JSON.stringify(requests, null, 2), 'utf-8');
}

// Get pending withdrawal requests
export function getPendingWithdrawals(): WithdrawalRequest[] {
  return getWithdrawalRequests().filter(req => req.status === 'pending');
}

// Get withdrawals for a specific address
export function getWithdrawalsForAddress(address: string): WithdrawalRequest[] {
  return getWithdrawalRequests().filter(
    req => req.address.toLowerCase() === address.toLowerCase()
  );
}

// Update withdrawal request status
export function updateWithdrawalStatus(
  requestId: string,
  status: WithdrawalRequest['status'],
  transactionHash?: string,
  rejectedReason?: string,
  processedBy?: string
): boolean {
  const requests = getWithdrawalRequests();
  const request = requests.find(req => req.requestId === requestId);
  
  if (!request) {
    return false;
  }

  request.status = status;
  request.processedAt = Date.now();
  
  if (transactionHash) {
    request.transactionHash = transactionHash;
  }
  
  if (rejectedReason) {
    request.rejectedReason = rejectedReason;
  }
  
  if (processedBy) {
    request.processedBy = processedBy;
  }

  fs.writeFileSync(WITHDRAWAL_LOG_FILE, JSON.stringify(requests, null, 2), 'utf-8');
  return true;
}


