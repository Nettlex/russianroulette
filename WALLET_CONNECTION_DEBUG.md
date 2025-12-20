# 🔍 Wallet Connection Debugging Guide

## Issue: "Connect Wallet" button does nothing when clicked

---

## ✅ Current Setup (Looks Correct):

1. **Root Provider (rootProvider.tsx):**
   - ✅ `WagmiProvider` with wagmiConfig
   - ✅ `OnchainKitProvider` with miniKit enabled
   - ✅ autoConnect: true

2. **Wagmi Config (wagmi.config.ts):**
   - ✅ Base Sepolia & Base chains
   - ✅ `farcasterMiniApp()` connector
   - ✅ `coinbaseWallet()` connector

3. **Connect Button (ProvablyFairGame.tsx):**
   - ✅ Wrapped in `<Wallet>` component
   - ✅ Using `<ConnectWallet>` from OnchainKit

---

## 🐛 Possible Issues:

### 1. Missing API Key ⚠️

**Check:** Is `NEXT_PUBLIC_ONCHAINKIT_API_KEY` set?

```bash
# Check your .env.local file
cat .env.local | grep ONCHAINKIT
```

**Expected:**
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your-api-key-here
```

**Get API Key:**
1. Go to: https://portal.cdp.coinbase.com/products/onchainkit
2. Create project
3. Copy API key
4. Add to `.env.local`

---

### 2. Browser Console Errors 🔍

**Steps:**
1. Open your game in browser
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Click "Connect Wallet" button
5. Look for errors

**Common errors:**

#### Error: "SDK not initialized"
```
Solution: API key missing (see #1 above)
```

#### Error: "Network mismatch"
```
Solution: Wrong chain in provider vs wagmi config
```

#### Error: "No injected provider"
```
Solution: Need Coinbase Wallet or compatible wallet installed
```

---

### 3. Environment Mismatch 🌐

Are you testing on:
- [ ] Localhost? (use `.env.local`)
- [ ] Preview deployment? (use Vercel env vars)
- [ ] Production? (use Vercel env vars)

**Check Vercel env vars:**
1. Go to: https://vercel.com/oldmos-projects/russian-roulette/settings/environment-variables
2. Verify `NEXT_PUBLIC_ONCHAINKIT_API_KEY` is set for all environments

---

### 4. Farcaster Context Issue 🎭

If testing inside Farcaster frame:
- The wallet should auto-connect via Farcaster
- Manual "Connect Wallet" might not work
- Check if `farcasterAddress` is detected

---

## 🔧 Quick Fixes:

### Fix 1: Add Console Logs

Add this to **ProvablyFairGame.tsx** around line 37:

```typescript
useEffect(() => {
  console.log('🔍 Wallet Status:', {
    isInMiniapp,
    farcasterAddress,
    wagmiAddress,
    wagmiConnected,
    finalAddress: address,
    finalIsConnected: isConnected
  });
}, [isInMiniapp, farcasterAddress, wagmiAddress, wagmiConnected, address, isConnected]);
```

### Fix 2: Test Direct Connection

Add a manual connect button for testing:

```typescript
import { useConnect } from 'wagmi';

// In component:
const { connect, connectors } = useConnect();

// Add button:
<button onClick={() => {
  console.log('Available connectors:', connectors);
  if (connectors[0]) {
    connect({ connector: connectors[0] });
  }
}}>
  Test Direct Connect
</button>
```

---

## 🎯 Step-by-Step Debug Process:

### Step 1: Check API Key

```bash
# In russian_roulette folder
cat .env.local
```

Look for:
```
NEXT_PUBLIC_ONCHAINKIT_API_KEY=...
```

If missing:
1. Get key from https://portal.cdp.coinbase.com/products/onchainkit
2. Add to `.env.local`
3. Restart dev server: `npm run dev`

---

### Step 2: Check Browser Console

1. Open: http://localhost:3000
2. Open DevTools (F12)
3. Console tab
4. Click "Connect Wallet"
5. **Copy ALL errors/warnings** and send to me

---

### Step 3: Check if it's Farcaster-specific

1. Open game **outside** Farcaster (just in browser)
2. Try "Connect Wallet"
3. Does it work outside Farcaster but not inside?

**If YES:**
- This is a Farcaster iframe limitation
- Users in Farcaster are auto-connected
- No manual connection needed

---

### Step 4: Check Wallet Installation

1. Do you have Coinbase Wallet installed?
   - Browser extension: https://www.coinbase.com/wallet
   - Mobile app: Check App Store

2. Try clicking "Connect Wallet" with wallet installed

---

## 💡 Expected Behavior:

### In Browser (outside Farcaster):
1. Click "Connect Wallet"
2. Modal appears with wallet options:
   - Coinbase Wallet
   - Farcaster MiniApp (if in iframe)
3. Select wallet
4. Approve connection
5. Wallet connected!

### In Farcaster Frame:
1. Wallet **auto-connects** on page load
2. No need to click "Connect Wallet"
3. Address from Farcaster user context

---

## 🚨 Most Likely Issue:

**Missing `NEXT_PUBLIC_ONCHAINKIT_API_KEY`**

Check this FIRST! Without it, OnchainKit wallet components don't work.

---

## 📝 Debug Checklist:

- [ ] Check `.env.local` has `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- [ ] Restart dev server after adding API key
- [ ] Check browser console for errors
- [ ] Try outside Farcaster frame (in regular browser)
- [ ] Check Vercel environment variables (if deployed)
- [ ] Verify Coinbase Wallet is installed
- [ ] Test with different wallet (MetaMask, etc.)

---

## 🆘 Send Me This Info:

1. **Environment file check:**
   ```bash
   cat .env.local | grep ONCHAINKIT
   ```

2. **Browser console output when clicking "Connect Wallet"**

3. **Where are you testing?**
   - [ ] Localhost
   - [ ] Farcaster frame
   - [ ] Vercel deployment
   - [ ] Regular browser

4. **Do you see ANY popup/modal when clicking the button?**
   - [ ] Yes, but it's empty
   - [ ] No, nothing happens
   - [ ] Error message appears

---

Once you provide this info, I can give you the exact fix! 🔧

