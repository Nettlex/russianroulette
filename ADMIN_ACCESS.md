# How to Access Admin Dashboard on Base Dev

## Quick Answer

When your app is deployed on Base Dev, you can access the admin dashboard in **3 ways**:

### Method 1: Direct URL (Easiest)
Simply navigate to:
```
https://your-app-name.basedev.xyz/admin/withdrawals
```

Replace `your-app-name` with your actual Base Dev app identifier.

**Example:**
- If your app URL is: `https://russian-roulette.basedev.xyz`
- Admin dashboard: `https://russian-roulette.basedev.xyz/admin/withdrawals`

### Method 2: From Profile Page
1. Open your app in Farcaster
2. Navigate to the **Profile** page (👤 icon in bottom nav)
3. Scroll down to see the **"🔐 Admin Dashboard (Withdrawals)"** button
4. Click it to open the admin panel in a new tab

### Method 3: Browser Address Bar
If you're viewing the app in a browser (not in Farcaster client):
1. Look at the current URL (e.g., `https://your-app.basedev.xyz`)
2. Add `/admin/withdrawals` to the end
3. Press Enter

## Important Notes

⚠️ **Security Warning**: 
- The admin dashboard is currently **not password protected**
- Anyone with the URL can access it
- **You should add authentication** before going to production!

## Recommended: Add Authentication

To protect the admin route, you can:

1. **Add a simple password check** in `app/admin/withdrawals/page.tsx`
2. **Use wallet signature verification** to verify admin wallet
3. **Use environment variable** to restrict access to specific addresses

Example protection (add to the admin page):
```typescript
const ADMIN_ADDRESS = process.env.NEXT_PUBLIC_ADMIN_ADDRESS || process.env.NEXT_PUBLIC_PRIZE_POOL_WALLET;

// Check if current user is admin
if (!address || address.toLowerCase() !== ADMIN_ADDRESS?.toLowerCase()) {
  return <div>Access Denied</div>;
}
```

## Finding Your Base Dev URL

1. Go to [Base Dev Dashboard](https://www.base.dev/)
2. Find your app
3. Check the deployment URL
4. Use that URL + `/admin/withdrawals`

## Testing Locally

When running locally (`npm run dev`):
- Admin dashboard: `http://localhost:3000/admin/withdrawals`


