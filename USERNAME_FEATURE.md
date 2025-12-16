# Username Feature Implementation

## Overview
Added a username system so players can display custom names on the leaderboard instead of just wallet addresses.

## Features Added

### 1. Username Modal Component
**File: `app/components/UsernameModal.tsx`**
- Beautiful modal with validation
- Character limit: 3-20 characters
- Allowed characters: letters, numbers, spaces, underscores, hyphens
- Real-time preview showing how username will appear
- Character counter
- Error messages for invalid input

### 2. Username Storage
- Stored in localStorage: `username_{address}`
- Synced to API with player stats
- Persists across sessions
- Separate per wallet address

### 3. Profile Integration
**File: `app/components/Profile.tsx`**
- Shows username prominently in profile
- Edit button (✏️) to change username
- Falls back to wallet name if no username set
- Shows wallet address below username

### 4. Leaderboard Display
**File: `app/components/Leaderboard.tsx`**
- Shows username in bold white text
- Wallet address displayed below in gray
- Falls back to shortened address if no username

**Example Display:**
```
🥇 CryptoKing
   0x1234...5678
   Streak: 15 • Deaths: 3 • Pulls: 42
```

### 5. API Integration
**File: `app/api/game/route.ts`**
- Accepts `username` field in updateStats action
- Stores username with player stats
- Returns username in leaderboard queries

### 6. Game Component Updates
**File: `app/components/ProvablyFairGame.tsx`**
- Username state management
- Load/save username from localStorage
- Pass username to API when syncing stats
- Pass username to Profile component
- Username modal integration

## How It Works

### Setting a Username
1. Player clicks edit button (✏️) in Profile
2. Username modal appears
3. Player enters desired username
4. Validation checks:
   - Not empty
   - 3-20 characters
   - Only alphanumeric, spaces, _, -
5. Username saved to localStorage
6. Synced to API with next stats update

### Displaying on Leaderboard
1. When stats are synced, username is included
2. API stores username with player data
3. Leaderboard fetches player data with usernames
4. Displays username prominently with address below

## User Experience

### Before Username:
```
🥇 0x1234...5678
   Streak: 15 • Deaths: 3 • Pulls: 42
```

### After Username:
```
🥇 CryptoKing
   0x1234...5678
   Streak: 15 • Deaths: 3 • Pulls: 42
```

## Technical Details

### Validation Rules
- **Minimum length**: 3 characters
- **Maximum length**: 20 characters
- **Allowed characters**: `a-zA-Z0-9 _-`
- **Trimmed**: Leading/trailing spaces removed
- **Case-sensitive**: Preserves exact capitalization

### Storage
- **Local**: `localStorage.setItem('username_{address}', username)`
- **API**: Included in `updateStats` POST request
- **Server**: Stored in `playerStats` Map with address as key

### Fallback Behavior
- No username set → Shows wallet address
- Username deleted → Reverts to wallet address
- API error → Local username still shows in UI

## Files Modified
1. ✅ `app/components/UsernameModal.tsx` (NEW)
2. ✅ `app/components/ProvablyFairGame.tsx`
3. ✅ `app/components/Profile.tsx`
4. ✅ `app/components/Leaderboard.tsx`
5. ✅ `app/api/game/route.ts`

## Testing Checklist
- [ ] Set username in Profile
- [ ] Username appears on leaderboard
- [ ] Address shown below username
- [ ] Edit username works
- [ ] Username persists after refresh
- [ ] Username syncs across devices (same wallet)
- [ ] Validation works (too short, too long, invalid chars)
- [ ] Multiple players with different usernames
- [ ] Player without username shows address

