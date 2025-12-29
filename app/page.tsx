"use client";
import { useEffect, useState, useRef } from "react";
import OnboardingModal from "./components/OnboardingModal";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { sdk } from '@farcaster/miniapp-sdk';
import {
  Wallet,
  ConnectWallet,
  WalletDropdown,
  WalletDropdownDisconnect,
  WalletDropdownLink,
  WalletDropdownBasename,
  WalletDropdownFundLink
} from '@coinbase/onchainkit/wallet';
import {
  Identity,
  Avatar,
  Name,
  Address,
  EthBalance
} from '@coinbase/onchainkit/identity';
import ProvablyFairGame from "./components/ProvablyFairGame";

export default function Home() {
  const { isFrameReady, setFrameReady } = useMiniKit();
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showWelcome, setShowWelcome] = useState(true);
  const [isInMiniapp, setIsInMiniapp] = useState(false);
  const [farcasterAddress, setFarcasterAddress] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Check if user has seen onboarding
  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      // Show onboarding after a short delay
      setTimeout(() => setShowOnboarding(true), 1000);
    }
  }, []);

  // Track if we've already initialized to prevent infinite loops
  const hasInitialized = useRef(false);
  
  useEffect(() => {
    // Only run once on mount
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    if (!isFrameReady) {
      setFrameReady();
    }
    // Call Farcaster SDK ready to hide loading splash screen
    sdk.actions.ready().catch(console.error);
    
    // Check if we're in a Farcaster miniapp context and try to get wallet
    sdk.context
      .then((context) => {
        if (context) {
          setIsInMiniapp(true);
          
          if (context.user) {
            // Check for wallet address in various possible properties
            const walletAddress = (context.user as any).custodyAddress || 
                                 (context.user as any).walletAddress || 
                                 (context.user as any).address;
            
            if (walletAddress) {
              const addr = walletAddress as `0x${string}`;
              setFarcasterAddress(addr);
            }
          }
          
          // With Farcaster connector configured in wagmi, connection should work automatically
          // But we can still try to auto-connect if needed
          if (!isConnected && connectors.length > 0) {
            setTimeout(() => {
              if (!isConnected) {
                try {
                  // Look for Farcaster connector first (it's configured in wagmi.config.ts)
                  const farcasterConnector = connectors.find(c => 
                    c.id === 'farcasterMiniApp' || 
                    c.name?.toLowerCase().includes('farcaster')
                  );
                  
                  if (farcasterConnector) {
                    connect({ connector: farcasterConnector });
                  } else if (connectors[0]) {
                    // Use first available connector
                    connect({ connector: connectors[0] });
                  }
                } catch (err) {
                  console.error('Auto-connect failed:', err);
                }
              }
            }, 1000);
          }
        }
      })
      .catch(() => {
        // Not in miniapp context, that's fine
        setIsInMiniapp(false);
      });
  }, []); // Empty deps - run once only

  // Auto-hide welcome screen after 3 seconds or when wallet connects
  useEffect(() => {
    if (isConnected) {
      setShowWelcome(false);
    } else {
      const timer = setTimeout(() => {
        setShowWelcome(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isConnected]);

  if (showWelcome) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-8 bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white">
        <div className="text-center space-y-6 max-w-2xl">
          <div className="text-8xl animate-pulse">🔫</div>
          <h1 className="text-5xl font-bold text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]">
            RUSSIAN ROULETTE
          </h1>
          <p className="text-xl text-gray-400">
            Provably Fair • High Stakes
          </p>
          
          {/* Connection Options */}
          <div className="space-y-4 pt-4">
            {/* Base Wallet Connect */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-3 text-center">
                Connect Wallet
              </p>
              <div className="flex flex-col items-center w-full">
                {!isConnected ? (
                  // Show connect button with available connectors
                  <div className="w-full">
                    {connectors.length > 0 ? (
                      <button
                        onClick={() => {
                          // In Farcaster, use the Farcaster connector, otherwise first available
                          const farcasterConn = connectors.find(c => 
                            c.id === 'farcasterMiniApp' || c.name?.toLowerCase().includes('farcaster')
                          );
                          const connector = isInMiniapp && farcasterConn ? farcasterConn : connectors[0];
                          console.log('Connecting with:', connector.id, connector.name);
                          connect({ connector });
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="h-5 w-5" viewBox="0 0 111 111" fill="none">
                          <path d="M54.921 110.034C85.359 110.034 110.034 85.402 110.034 55.017C110.034 24.6319 85.359 0 54.921 0C26.0432 0 2.35281 22.1714 0 50.3923H72.8467V59.6416H3.9565e-07C2.35281 87.8625 26.0432 110.034 54.921 110.034Z" fill="white"/>
                        </svg>
                        <span>Connect Wallet</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="w-full bg-gray-600 text-white font-bold py-3 px-6 rounded-lg opacity-50 cursor-not-allowed"
                      >
                        No Wallet Connectors Available
                      </button>
                    )}
                    {isInMiniapp && farcasterAddress && (
                      <p className="text-xs text-blue-400 mt-2 text-center">
                        Wallet detected: {farcasterAddress.slice(0, 6)}...{farcasterAddress.slice(-4)}
                      </p>
                    )}
                    {isInMiniapp && (
                      <p className="text-xs text-yellow-400 mt-2 text-center">
                        Click button above to connect your wallet
                      </p>
                    )}
                    {!isInMiniapp && (
                      <p className="text-xs text-gray-500 mt-2 text-center">
                        Click to connect your wallet
                      </p>
                    )}
                  </div>
                ) : (
                  // Show wallet info when connected
                  <Wallet>
                    <ConnectWallet className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all flex items-center justify-center gap-2">
                      <Avatar className="h-5 w-5" />
                      <Name />
                    </ConnectWallet>
                    <WalletDropdown>
                      <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                        <Avatar />
                        <Name />
                        <Address />
                        <EthBalance />
                      </Identity>
                      <WalletDropdownBasename />
                      <WalletDropdownLink icon="wallet" href="https://wallet.coinbase.com">
                        Wallet
                      </WalletDropdownLink>
                      <WalletDropdownFundLink />
                      <WalletDropdownDisconnect />
                    </WalletDropdown>
                  </Wallet>
                )}
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6">
              <p className="text-sm text-gray-400 mb-3 text-center">How to Play</p>
              <div className="space-y-2 text-xs text-gray-300">
                <p>1️⃣ Connect your wallet</p>
                <p>2️⃣ Deposit USDC or ETH to play</p>
                <p>3️⃣ Pull the trigger & build your streak</p>
                <p>4️⃣ Cash out or compete on the leaderboard</p>
              </div>
              <p className="text-xs text-blue-300 mt-3 text-center">
                Survive 7 pulls to complete the round
              </p>
            </div>
          </div>

          {/* Skip Option */}
          <button
            onClick={() => setShowWelcome(false)}
            className="text-sm text-gray-500 hover:text-gray-300 underline transition-all"
          >
            Skip and play for free →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Main Game - Provably Fair */}
      <ProvablyFairGame />
      
      {/* Onboarding Modal */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </div>
  );
}
