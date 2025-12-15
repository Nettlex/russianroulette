# 🚀 Quick Setup Guide - Russian Roulette Mini App

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Next.js
- OnchainKit
- Farcaster MiniKit SDK
- Wagmi & Viem
- Framer Motion
- Tailwind CSS

## Step 2: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and add your OnchainKit API key:
```env
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_actual_api_key
NEXT_PUBLIC_URL=http://localhost:3000
```

**How to get OnchainKit API Key:**
- Visit https://portal.cdp.coinbase.com/
- Sign up or log in
- Create a new project
- Copy the API key

## Step 3: Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 4: Test the Game

### Without Wallet (Free Play)
1. Open http://localhost:3000
2. Click "continue without wallet" or wait 3 seconds
3. Play the game for free
4. Your stats won't be saved

### With Wallet (Full Experience)
1. Connect your wallet (supports all Base-compatible wallets)
2. Make sure you're on Base Sepolia testnet
3. Get testnet USDC from https://faucet.circle.com/
4. Join the prize pool for 1 USDC
5. Compete on the leaderboard!

## Step 5: Testing in Farcaster

### Option A: Use ngrok for local testing
```bash
npm install -g ngrok
ngrok http 3000
```

Update `.env.local` with the ngrok URL:
```env
NEXT_PUBLIC_URL=https://your-ngrok-url.ngrok.io
```

### Option B: Deploy to Vercel
```bash
npm install -g vercel
vercel
```

Follow the prompts to deploy.

## Step 6: Add to Farcaster

1. Go to https://miniapps.farcaster.xyz/
2. Click "Submit Mini App"
3. Fill in the form:
   - Name: Russian Roulette
   - URL: Your ngrok or Vercel URL
   - Category: Games
4. Submit for review
5. Once approved, users can add it to their Farcaster

## 🎮 Game Controls

1. **Load Bullet**: Click to load a bullet into a random chamber
2. **Spin Chamber**: Randomize the chamber position
3. **FIRE!**: Pull the trigger and test your luck
4. **Join Prize Pool**: Pay 1 USDC to compete for prizes

## 🔧 Troubleshooting

### "Cannot connect wallet"
- Make sure you're using a compatible wallet (Coinbase Wallet, MetaMask, etc.)
- Switch to Base Sepolia network
- Clear browser cache and try again

### "Sounds not playing"
- Check browser console for errors
- Make sure browser allows audio playback
- Some browsers require user interaction before playing audio

### "Transaction failed"
- Ensure you have enough USDC in your wallet
- Check you have enough ETH for gas fees
- Verify you're on the correct network (Base Sepolia)

### "Leaderboard not loading"
- Check backend API is running
- Look for errors in browser console
- Try refreshing the page

## 📱 Mobile Testing

### Test in Warpcast (Farcaster's mobile app)
1. Deploy your app to a public URL
2. Share the URL in a cast
3. Users can open it as a Mini App
4. Test all features on mobile

## 🌐 Production Deployment

### Before Going Live:

1. **Security Audit**
   - Audit smart contracts
   - Implement proper RNG (Chainlink VRF)
   - Add rate limiting

2. **Database Setup**
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Set up Redis for caching
   - Implement proper data persistence

3. **Smart Contracts**
   - Deploy USDC handling contract
   - Implement prize distribution logic
   - Set up automated payouts

4. **Environment Variables**
   ```env
   NEXT_PUBLIC_ONCHAINKIT_API_KEY=prod_key
   NEXT_PUBLIC_URL=https://yourdomain.com
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   ```

5. **Domain Setup**
   - Point custom domain to Vercel
   - Update minikit.config.ts with production URL
   - Configure SSL certificates

6. **Legal Compliance**
   - Check gambling laws in your jurisdiction
   - Add terms of service
   - Implement age verification if required
   - Add responsible gaming features

## 🎯 Development Tips

### Hot Reload
All changes will hot reload except:
- Environment variable changes (restart server)
- minikit.config.ts changes (restart server)

### Debugging
- Use browser DevTools console
- Check Network tab for API calls
- Use React DevTools for component inspection

### Testing Payments
- Use Base Sepolia testnet
- Get test USDC from faucets
- Never test with real money during development

## 📚 Additional Resources

- [OnchainKit Documentation](https://onchainkit.xyz/)
- [Farcaster MiniKit Docs](https://miniapps.farcaster.xyz/)
- [Base Documentation](https://docs.base.org/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Next.js Documentation](https://nextjs.org/docs)

## 💡 Next Steps

Once you have the basic game running:
1. Customize the design and colors
2. Add more sound effects
3. Implement actual smart contract integration
4. Add social features (share scores, challenge friends)
5. Create tournaments and special events
6. Add NFT rewards for achievements

## 🆘 Need Help?

- Check GAME_README.md for detailed documentation
- Review the code comments
- Open an issue on GitHub
- Ask in the Farcaster developer community

---

**Ready to go? Run `npm run dev` and start playing! 🎲🔫**


