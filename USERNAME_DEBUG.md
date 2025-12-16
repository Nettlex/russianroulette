# Username Not Showing - Debug Guide

## What I Fixed

1. ✅ Added `username` field to `LeaderboardEntry` interface
2. ✅ Made sure username is included when updating leaderboard
3. ✅ Added debug logging to track username flow
4. ✅ Made sure username syncs immediately when set

## How to Test & Debug

### Step 1: Set a Username
1. Go to Profile tab
2. Click the ✏️ edit button
3. Enter a username (e.g., "TestPlayer")
4. Click Save
5. **Check browser console** for:
   ```
   ✅ Username saved: TestPlayer for address: 0x...
   ```

### Step 2: Trigger Stats Sync
After setting username, play the game (fire at least one shot) to sync stats.

**Check console for:**
```
📤 Syncing stats to API: {
  address: "0x...",
  username: "TestPlayer",
  stats: {...}
}
✅ Stats synced: {...}
```

### Step 3: Check Leaderboard
1. Go to Leaderboard tab
2. **Check console for:**
   ```
   📊 Leaderboard entry: {
     address: "0x...",
     username: "TestPlayer",
     name: undefined,
     finalName: "TestPlayer"
   }
   ```

### Step 4: Verify Display
Look at leaderboard - should show:
```
🥇 TestPlayer          ← Your username in bold white
   0x1234...5678       ← Address in gray below
```

## Common Issues

### Issue 1: Username Not in Console Logs
**Problem**: Console shows `username: undefined`

**Solution**: 
- Make sure you clicked Save in the username modal
- Check Profile - does it show your username?
- Try setting username again

### Issue 2: Stats Not Syncing
**Problem**: No "📤 Syncing stats" log appears

**Solution**:
- Make sure wallet is connected (check top of profile)
- Play the game (fire trigger) to trigger a sync
- Username only syncs when stats update

### Issue 3: Leaderboard Shows Address Instead of Username
**Problem**: Console shows username but leaderboard displays address

**Solution**:
- Refresh the page
- Check if `finalName` in console is correct
- Clear browser cache and reload

### Issue 4: Only Shows for Some Players
**Problem**: Your username shows but others don't

**Expected**: This is normal! Other players need to set their usernames too. Players without usernames will show their address.

## Manual Test Steps

### Complete Flow Test:
1. **Connect Wallet**
2. **Set Username** → Check console: `✅ Username saved`
3. **Play Game** (1 shot) → Check console: `📤 Syncing stats`
4. **Go to Leaderboard** → Check console: `📊 Leaderboard entry`
5. **Verify Display** → Should show username above address

## What the Logs Mean

- `✅ Username saved` = Username stored in localStorage ✅
- `📤 Syncing stats to API` = Sending username to server ✅
- `✅ Stats synced` = Server received and saved username ✅
- `📊 Leaderboard entry` = Leaderboard displaying your data ✅

If all 4 logs appear with your username, but it still doesn't show, let me know!

## Quick Fix

If username isn't showing after all the above:

1. Open browser console (F12)
2. Run this command:
   ```javascript
   localStorage.clear()
   location.reload()
   ```
3. Connect wallet again
4. Set username again
5. Play one game
6. Check leaderboard

## Expected Behavior

- ✅ Username shows in Profile immediately after setting
- ✅ Username syncs to API when you play (any action)
- ✅ Username appears on leaderboard for your entry
- ✅ Other players without usernames show addresses
- ✅ Username persists across page refreshes

