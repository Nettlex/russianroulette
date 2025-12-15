# 🔫 Russian Roulette - Farcaster Mini App

A thrilling Russian Roulette game built as a Farcaster Mini App using [OnchainKit](https://onchainkit.xyz) and the [Farcaster SDK](https://docs.farcaster.xyz/). Test your luck, compete on the leaderboard, and win USDC prizes!

> [!IMPORTANT]
> This is a complete game with wallet integration, prize pools, and leaderboards. See SETUP.md for detailed instructions.

## 🎮 Features

- **8-Chamber Revolver** with realistic animations
- **Dual Game Modes**: Free play and prize pool (1 USDC entry)
- **Leaderboards**: Compete globally or with paid players
- **Prize Distribution**: 40/25/15/20 split among winners
- **Sound Effects**: Realistic gun sounds
- **Wallet Integration**: Full OnchainKit integration
- **Mobile Responsive**: Works great on all devices

## Prerequisites

Before getting started, make sure you have:

*   A [Farcaster](https://farcaster.xyz/) account (for testing)
*   A [Vercel](https://vercel.com/) account for hosting
*   A [Coinbase Developer Platform](https://portal.cdp.coinbase.com/) Client API Key
*   Basic knowledge of [Base Build](https://www.base.dev) platform

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

**Note**: Make sure you have Node.js 18+ installed.

### 2. Configure Environment

Create a `.env.local` file:

```bash
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_coinbase_api_key
NEXT_PUBLIC_URL=http://localhost:3000
```

Get your API key from [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play!

## 📖 Documentation

- **[SETUP.md](SETUP.md)** - Detailed setup instructions and troubleshooting
- **[GAME_README.md](GAME_README.md)** - Complete game documentation and features
- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Technical overview and architecture

## 🎯 How to Play

1. **Connect Wallet** (optional for free play)
2. **Load Bullet** - Places bullet in random chamber
3. **Spin Chamber** - Randomizes chamber position
4. **FIRE!** - Pull the trigger (1/8 chance of death)
5. **Survive 7 Shots** - Chamber automatically reloads
6. **Join Prize Pool** - Pay 1 USDC to compete for prizes
7. **Check Leaderboard** - See your ranking

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Blockchain**: Base (Sepolia testnet)
- **Wallet**: OnchainKit + Wagmi
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS
- **Mini App SDK**: @farcaster/miniapp-sdk

## 🎨 Customization

### Game Settings
Edit `app/utils/gameLogic.ts`:
```typescript
export const CHAMBERS_COUNT = 8;        // Number of chambers
export const SHOTS_PER_ROUND = 7;       // Shots before reload
export const ENTRY_FEE_USDC = 1;        // Entry fee
```

### Minikit Configuration
The `minikit.config.ts` file configures your Farcaster Mini App manifest. Update for your deployment URL after deploying to production.

## 🚀 Deployment

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Environment Variables for Production

Set these in your Vercel dashboard:
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `NEXT_PUBLIC_URL` (your production URL)

### Publishing to Farcaster

1. Deploy your app to a public URL
2. Visit [Farcaster Mini Apps](https://miniapps.farcaster.xyz/)
3. Submit your app for review
4. Once approved, users can add it to their Farcaster

For detailed deployment instructions, see [SETUP.md](SETUP.md).

## 📊 Project Structure

```
app/
├── components/       # React components (Game, Leaderboard, etc.)
├── hooks/           # Custom hooks (USDC payments)
├── types/           # TypeScript interfaces
├── utils/           # Game logic, audio, API client
├── api/game/        # Backend API endpoints
└── page.tsx         # Main entry point
```

## 🔐 Security Notes

⚠️ **Important for Production:**
- Current randomness is NOT cryptographically secure
- Use Chainlink VRF for provably fair randomness
- Implement proper smart contracts for prize distribution
- Add rate limiting and abuse prevention
- Complete security audit before handling real money

See [GAME_README.md](GAME_README.md) for full security considerations.

## 🐛 Known Issues & Roadmap

### Current Limitations
- In-memory storage (needs database)
- Client-side RNG (not secure for real money)
- Mock USDC payments (needs smart contract)

### Planned Features
- [ ] Tournament mode
- [ ] Player profiles
- [ ] NFT achievements
- [ ] Social sharing
- [ ] Automated prize distribution

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## ⚠️ Disclaimer

This is a game of chance. Play responsibly.
- **Use testnet funds only during development**
- **Check local gambling laws before mainnet deployment**
- **This is educational software - not financial advice**

## 📞 Support

- 📖 [Read the Docs](GAME_README.md)
- 💬 Open an issue on GitHub
- 🐦 Contact via Farcaster

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Built With

- [OnchainKit](https://onchainkit.xyz/) by Coinbase
- [Farcaster MiniKit](https://miniapps.farcaster.xyz/)
- [Base](https://base.org/)
- Template by [TriO Blockchain Labs](https://trio.dev)

---

**Ready to play? Run `npm install && npm run dev` and may the odds be ever in your favor! 🎲**
