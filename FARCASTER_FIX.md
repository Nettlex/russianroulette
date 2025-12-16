# Farcaster Miniapp Button Fix

## Problem
Buttons (Connect Wallet, Deposit, 1 USDC mode) were not working in Farcaster view because:

1. **Wallet Connection Issue**: The wagmi `useAccount()` hook doesn't automatically detect the Farcaster user's wallet address when running in the Farcaster miniapp iframe
2. **isConnected State**: Since wagmi didn't detect the wallet, `isConnected` was always `false`, disabling all buttons that require a wallet connection
3. **Modal Blocking**: Wallet connection modals don't work in iframes (Farcaster miniapp runs in an iframe)

## Solution

### 1. Added Farcaster Connector to Wagmi Config
**File: `app/wagmi.config.ts`**
- Configured `farcasterMiniApp()` connector from `@farcaster/miniapp-wagmi-connector`
- This connector is designed to work in iframe contexts without modals

### 2. Detect Farcaster Context in Game Component
**File: `app/components/ProvablyFairGame.tsx`**
- Added Farcaster SDK context detection
- Extracts wallet address from Farcaster user context (`custodyAddress`, `walletAddress`, or `address`)
- Falls back to wagmi address if not in Farcaster
- Sets `isConnected = true` when Farcaster address is detected

```typescript
// Use Farcaster address if in miniapp and available, otherwise use wagmi
const address = (isInMiniapp && farcasterAddress) ? farcasterAddress as `0x${string}` : wagmiAddress;
const isConnected = (isInMiniapp && farcasterAddress) ? true : wagmiConnected;
```

### 3. Improved Connect Button in Welcome Screen
**File: `app/page.tsx`**
- Button now manually triggers connection with the correct connector
- Detects if in Farcaster miniapp and uses `farcasterMiniApp` connector
- Shows appropriate UI for connected/disconnected states

## How It Works Now

### In Farcaster View:
1. App detects it's running in Farcaster miniapp via `sdk.context`
2. Extracts user's wallet address from Farcaster context
3. Sets `isConnected = true` and `address = farcasterAddress`
4. All buttons that check `isConnected` now work ✅
5. Transactions use the Farcaster connector (no modal popups)

### In Regular Web View:
1. Uses standard wagmi wallet connection
2. Shows connect wallet modal
3. Works as before with Coinbase Wallet, etc.

## Testing
Deploy and test in Farcaster app:
1. Open miniapp in Farcaster
2. Buttons should now be enabled automatically
3. Deposit, mode switching, and game actions should work
4. Check browser console for: `🎯 Farcaster wallet detected in game: 0x...`

## Key Files Changed
- ✅ `app/wagmi.config.ts` - Added Farcaster connector
- ✅ `app/rootProvider.tsx` - Wrapped with WagmiProvider
- ✅ `app/page.tsx` - Improved connect button logic
- ✅ `app/components/ProvablyFairGame.tsx` - Added Farcaster context detection


