import { http, createConfig } from 'wagmi';
import { base, baseSepolia } from 'wagmi/chains';
import { coinbaseWallet } from 'wagmi/connectors';
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector';

// Use testnet for now
export const wagmiConfig = createConfig({
  chains: [baseSepolia, base],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
  },
  connectors: [
    farcasterMiniApp(), // Farcaster Mini App connector (works in iframe)
    coinbaseWallet({
      appName: 'Russian Roulette',
      preference: 'all',
    }),
  ],
  ssr: true,
});

