'use client';

import BottomNav from '../components/BottomNav';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

const links = [
  { title: "Base Main Docs", url: "https://docs.base.org/get-started/base" },
  { title: "Base OnchainKit", url: "https://docs.base.org/onchainkit/latest/getting-started/overview" },
  { title: "Russian Roulette", url: "https://docs.base.org/mini-apps/quickstart/migrate-existing-apps" },
  { title: "Base Account", url: "https://docs.base.org/base-account/overview/what-is-base-account" },
  { title: "Coinbase Developer Platform", url: "https://portal.cdp.coinbase.com" },
  { title: "Vercel", url: "https://vercel.com" },
  { title: "Base Build", url: "https://www.base.dev/" },
];

export default function LinksPage() {
  return (
    <div className="flex flex-col items-center p-4 space-y-8 pb-24 min-h-screen bg-[#eef0f3]">
      <h1 className="text-2xl font-bold text-[#32353d]">Useful Links</h1>
      
      <div className="w-full max-w-md space-y-4">
        {links.map((link) => (
          <a 
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
          >
            <span className="font-medium text-[#32353d]">{link.title}</span>
            <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400" />
          </a>
        ))}
      </div>

      <BottomNav />
    </div>
  );
}
