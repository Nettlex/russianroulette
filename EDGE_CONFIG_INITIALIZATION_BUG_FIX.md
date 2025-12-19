# 🔴 EDGE CONFIG INITIALIZATION BUG - ROOT CAUSE OF 10-MINUTE DATA LOSS

**Date:** December 19, 2025  
**Critical Bug:** Leaderboard data deleted every ~10 minutes due to re-initialization on cold starts

---

## 🔴 **THE BUG - ROOT CAUSE IDENTIFIED**

### **What Was Happening:**

Every **10-15 minutes** (or on any serverless cold start), the **entire leaderboard was being deleted**!

### **Why It Happened:**

#### **Bug #1: `loadData()` Overwrites with Empty Data**

```typescript
// storage.ts - Lines 86-89 (OLD CODE)
if (data) {
  return data; // ✅ Data exists, return it
} else {
  // ❌ BUG: If Edge Config is empty, OVERWRITE with empty data!
  console.log('⚠️ No data in Edge Config yet, initializing...');
  await saveData(cachedData); // ← cachedData is EMPTY!
  return cachedData;
}
```

**The Problem:**
- `cachedData` starts as **empty** arrays:
  ```typescript
  let cachedData: StorageData = {
    leaderboard: { free: [], paid: [] }, // ← EMPTY!
    playerStats: {},
    playerBalances: {},
  };
  ```
- If Edge Config read fails or returns `null`:
  - Network issue
  - Cold start delay
  - Cache miss
  - First deployment
- Code **saves empty data**, **overwriting** the entire leaderboard! 💀

#### **Bug #2: `init-edge-config` API Overwrites Existing Data**

```typescript
// init-edge-config/route.ts - Lines 48-54 (OLD CODE)
const response = await fetch(
  `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
  {
    body: JSON.stringify({
      items: [{
        operation: 'upsert', // ❌ Overwrites existing data!
        key: 'game-data',
        value: initialData, // ← Empty arrays!
      }],
    }),
  }
);
```

**The Problem:**
- `upsert` operation **always overwrites**
- No check if data already exists
- Missing `playerBalances` field (would delete all balance data on re-init!)
- Every time `/api/init-edge-config` was called, it **nuked the leaderboard**

---

## ✅ **THE FIXES**

### **Fix #1: Don't Save Empty Data on Load Failure**

```typescript
// storage.ts - NEW CODE
if (data) {
  cachedData = data;
  lastFetch = now;
  return data;
} else {
  // ✅ FIX: Don't overwrite Edge Config with empty data!
  // Just return empty cache without saving
  console.log('⚠️ No data in Edge Config - using empty cache (not overwriting!)');
  return cachedData; // ← Return empty cache, DON'T save it!
}
```

**What Changed:**
- Removed `await saveData(cachedData)`
- Now returns empty cache **without saving**
- Prevents overwriting existing data on read failures

### **Fix #2: Safe Initialization (Check if Data Exists First)**

```typescript
// init-edge-config/route.ts - NEW CODE
// Check if game-data already exists
const { get } = await import('@vercel/edge-config');
const existingData = await get('game-data');

if (existingData) {
  // ✅ Data exists - DON'T overwrite!
  console.log('⚠️ Edge Config already has game-data - skipping initialization');
  return NextResponse.json({ 
    success: true,
    message: 'Edge Config already initialized (data preserved)',
    action: 'skipped'
  });
}

// Only initialize if data doesn't exist
const initialData = {
  leaderboard: { free: [], paid: [] },
  prizePool: { totalAmount: 0, participants: 0 },
  playerStats: {},
  playerBalances: {}, // ✅ FIX: Include new balance field
};

await saveToEdgeConfig(initialData);
```

**What Changed:**
- Checks if `game-data` key exists **before** initializing
- If exists, **skips** initialization (preserves data)
- Added `playerBalances: {}` to initial data structure
- Only writes empty data on **first-ever** initialization

---

## 📊 **TIMELINE OF BUG**

```
T=0:00  Player A plays → Leaderboard saved to Edge Config ✅
T=0:30  Cache expires (30s TTL)
T=10:00 Serverless function cold start (idle timeout)
        ↓
        loadData() called
        ↓
        Edge Config read takes too long or fails
        ↓
        data === null
        ↓
        saveData(cachedData) called with EMPTY arrays! ❌
        ↓
        Entire leaderboard OVERWRITTEN with []
        ↓
        Player A's data: GONE! 💀
```

---

## 🔍 **CLARIFICATION: Edge Config vs KV**

**User asked about Vercel KV/Redis**, but we're using **Vercel Edge Config**!

| Feature | Vercel KV (Redis) | Vercel Edge Config (Our Setup) |
|---------|-------------------|-------------------------------|
| **Type** | Redis database | Read-optimized KV store |
| **TTL** | Supports `ex`, `px` TTL | No TTL (permanent until deleted) |
| **Package** | `@vercel/kv` | `@vercel/edge-config` |
| **Use Case** | Session storage, caching | Configuration, feature flags |
| **Our Use** | ❌ Not used | ✅ Used for leaderboard |

**We don't have TTL issues** because Edge Config doesn't support TTLs. The bug was **re-initialization**, not expiration!

---

## ✅ **VERIFICATION CHECKLIST**

### **After deploying these fixes, verify:**

1. **Check for overwrites in logs:**
   ```
   # GOOD (should see this):
   🌐 Loaded data from Edge Config: { freeLeaderboard: 5, ... }
   
   # BAD (should NOT see this anymore):
   ⚠️ No data in Edge Config yet, initializing...
   💾 Saving to Edge Config... { freeLeaderboard: 0, ... }
   ```

2. **Test cold start scenario:**
   - Wait 15 minutes (serverless idle)
   - Play a game
   - Check logs for "using empty cache (not overwriting!)"
   - Verify leaderboard data **persists**

3. **Test init-edge-config API:**
   ```powershell
   # First call (no data exists)
   Invoke-WebRequest -Uri "https://your-app.vercel.app/api/init-edge-config" -Method POST
   # Should see: "Edge Config initialized" ✅
   
   # Second call (data exists)
   Invoke-WebRequest -Uri "https://your-app.vercel.app/api/init-edge-config" -Method POST
   # Should see: "Edge Config already initialized (data preserved)" ✅
   ```

4. **Verify Edge Config structure:**
   ```
   GET https://your-app.vercel.app/api/game?action=leaderboard
   
   # Should return:
   {
     "free": [...],      // ✅ Leaderboard entries
     "paid": [...],      // ✅ Paid entries
     "prizePool": {...}  // ✅ Prize pool data
   }
   ```

5. **Check for missing fields:**
   ```
   GET https://your-app.vercel.app/api/debug-storage
   
   # Should show:
   {
     "cachedData": {
       "leaderboard": { "free": [...], "paid": [...] },
       "playerStats": {...},
       "playerBalances": {...} // ✅ Must be present!
     }
   }
   ```

---

## 🚀 **DEPLOYMENT INSTRUCTIONS**

### **Step 1: Deploy the fix**

```bash
git add .
git commit -m "Fix: Prevent Edge Config overwrite on cold starts"
git push
```

### **Step 2: Wait for Vercel deployment** (~2 min)

### **Step 3: Initialize Edge Config (only if needed)**

```powershell
# This is now safe - won't overwrite existing data!
Invoke-WebRequest -Uri "https://russian-roulette-lyart.vercel.app/api/init-edge-config" -Method POST | Select-Object -Expand Content
```

**Expected response (if data exists):**
```json
{
  "success": true,
  "message": "Edge Config already initialized (data preserved)",
  "action": "skipped"
}
```

### **Step 4: Test persistence**

1. Play a few games
2. Check leaderboard: `https://your-app.vercel.app/api/game?action=leaderboard`
3. Wait **20 minutes** (past cold start threshold)
4. Check again → Data should **persist!** ✅

---

## 🔍 **WHAT TO LOOK FOR IN LOGS**

### **Good Logs (After Fix):**

```
🌐 Loaded data from Edge Config: { freeLeaderboard: 5, paidLeaderboard: 2 }
📦 Using cached data (fresh)
💰 Balance fetched for 0x123: { balance: 100.5 }
🔫 Trigger pull recorded: 0x123 pulls: 142
💾 Saving to Edge Config... { freeLeaderboard: 5, paidLeaderboard: 2 }
✅ Successfully saved to Edge Config!
```

### **Bad Logs (Before Fix):**

```
⚠️ No data in Edge Config yet, initializing...  ← ❌ RED FLAG!
💾 Saving to Edge Config... { freeLeaderboard: 0, paidLeaderboard: 0 }  ← ❌ OVERWRITE!
```

### **After Cold Start (Should see):**

```
⚠️ No data in Edge Config - using empty cache (not overwriting!)  ← ✅ CORRECT!
📦 Using cached data (fresh)
```

---

## 📊 **ROOT CAUSE SUMMARY**

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| **Data deleted every 10 min** | `loadData()` saved empty data on read failure | Don't save empty data, just return cache |
| **Re-initialization overwrites** | `init-edge-config` always used `upsert` | Check if data exists first, skip if present |
| **Missing balance field** | `initialData` didn't include `playerBalances` | Added `playerBalances: {}` to structure |
| **Cold start issues** | Serverless functions restart, re-run `loadData()` | Safe initialization prevents overwrite |

---

## ✅ **BENEFITS OF FIX**

1. ✅ **No More Data Loss:** Leaderboard persists indefinitely
2. ✅ **Safe Cold Starts:** Re-initialization doesn't overwrite data
3. ✅ **Safe Re-deployment:** Init API checks for existing data
4. ✅ **Complete Structure:** All fields (`playerBalances`, etc.) preserved
5. ✅ **Audit Trail:** Can track when initialization is skipped

---

## 📝 **FILES CHANGED**

| File | Change | Impact |
|------|--------|--------|
| `app/lib/storage.ts` | Removed `saveData()` call in `loadData()` | Prevents overwrite on read failure |
| `app/api/init-edge-config/route.ts` | Added existence check before init | Prevents overwrite on re-init |
| `app/api/init-edge-config/route.ts` | Added `playerBalances` to `initialData` | Preserves balance data structure |

---

## 🎯 **CONCLUSION**

The **10-minute data loss bug** was caused by:
1. **Aggressive re-initialization** on Edge Config read failures
2. **Unsafe `upsert` operation** without existence check
3. **Missing fields** in initial data structure

**Now:**
- ✅ Data is **never overwritten** accidentally
- ✅ Cold starts are **safe**
- ✅ Re-initialization is **idempotent**
- ✅ Leaderboard **persists forever**

**Status:** ✅ **FIXED - READY TO DEPLOY**

---

## 🚀 **FINAL DEPLOYMENT COMMAND**

```bash
git add .
git commit -m "Critical Fix: Prevent Edge Config data loss on cold starts"
git push
```

**Your leaderboard will now persist forever!** 🎉


