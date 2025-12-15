# Withdrawal Request System

## Overview

The withdrawal system allows users to request withdrawals of their game balance. All requests are logged and must be processed manually by the admin.

## How It Works

### For Users

1. User clicks "Withdraw" in the game
2. User enters withdrawal amount
3. System submits a withdrawal request to `/api/withdraw`
4. Request is logged to `logs/withdrawals.json`
5. User's local balance is deducted immediately
6. User receives a confirmation with Request ID
7. Admin processes the request manually (sends USDC to user's wallet)

### For Admin

1. Access the admin page at `/admin/withdrawals`
2. View all pending withdrawal requests
3. For each request:
   - Send USDC to the user's wallet address
   - Copy the transaction hash from BaseScan
   - Enter the transaction hash in the admin panel
   - Click "Approve" or "Mark Complete"
4. If rejecting, enter a reason and click "Reject"

## File Structure

- `app/api/withdraw/route.ts` - API endpoint for withdrawal requests
- `app/utils/withdrawalManager.ts` - Server-side utilities for managing withdrawals
- `app/admin/withdrawals/page.tsx` - Admin dashboard for processing withdrawals
- `logs/withdrawals.json` - Log file containing all withdrawal requests

## API Endpoints

### GET `/api/withdraw?action=pending`
Get all pending withdrawal requests (admin only)

### GET `/api/withdraw?address=0x...`
Get withdrawal history for a specific address

### POST `/api/withdraw`
Submit a withdrawal request or update status

**Request Body:**
```json
{
  "action": "request",
  "address": "0x...",
  "amount": 10.5
}
```

**Response:**
```json
{
  "success": true,
  "requestId": "withdraw_1234567890_abc123",
  "message": "Withdrawal request submitted successfully..."
}
```

## Withdrawal Request Format

```typescript
{
  requestId: string;           // Unique ID: "withdraw_timestamp_random"
  address: string;             // User's wallet address (lowercase)
  amount: number;              // Amount in USDC
  timestamp: number;           // Unix timestamp
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  transactionHash?: string;    // TX hash when processed
  rejectedReason?: string;      // Reason if rejected
  processedAt?: number;        // When processed
  processedBy?: string;       // Admin identifier
}
```

## Log File Location

On Base Dev hosting, the log file will be at:
```
/logs/withdrawals.json
```

The file is automatically created when the first withdrawal request is submitted.

## Security Notes

⚠️ **Important for Production:**

1. **Protect Admin Route**: Add authentication to `/admin/withdrawals`
2. **Verify Balances**: Before processing, verify user actually has the balance
3. **Rate Limiting**: Consider rate limiting withdrawal requests
4. **Minimum Withdrawal**: Consider adding a minimum withdrawal amount
5. **Manual Verification**: Always verify the wallet address before sending funds

## Example Workflow

1. User requests withdrawal of 5 USDC
2. Request logged: `withdraw_1234567890_abc123`
3. Admin sees request in dashboard
4. Admin sends 5 USDC to user's wallet: `0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`
5. Transaction hash: `0x1234...5678`
6. Admin enters hash and clicks "Approve"
7. Request status updated to "approved"
8. User can see their withdrawal was processed

## Accessing Admin Dashboard

### Method 1: Direct URL (Recommended)
When deployed on Base Dev, access the admin dashboard via URL:
```
https://your-app.basedev.xyz/admin/withdrawals
```

Replace `your-app` with your actual Base Dev app name/ID.

### Method 2: From Profile Page
If your wallet address matches the admin address (set in `.env.local` as `NEXT_PUBLIC_ADMIN_ADDRESS` or uses `NEXT_PUBLIC_PRIZE_POOL_WALLET`), you'll see an "🔐 Admin Dashboard" button in the Profile page that opens the admin panel in a new tab.

### Method 3: Add to Environment Variables
Add your admin wallet address to `.env.local`:
```env
NEXT_PUBLIC_ADMIN_ADDRESS=0xYourAdminWalletAddress
```

If not set, it will default to using `NEXT_PUBLIC_PRIZE_POOL_WALLET` as the admin address.

**Note**: You should add authentication to protect this route in production! Currently, anyone with the URL can access it.

