import type { Metadata } from "next";
import { Inter, Source_Code_Pro } from "next/font/google";
import { SafeArea } from "@coinbase/onchainkit/minikit";
import { RootProvider } from "./rootProvider";
import "./globals.css";

export const metadata: Metadata = {
  other: {
    'base:app_id': '69400e96d77c069a945bdf0f',
    'fc:miniapp': JSON.stringify({
      version: 'next',
      imageUrl: 'https://russian-roulette-lyart.vercel.app/hero.png',
      button: {
        title: 'Launch Russian Roulette',
        action: {
          type: 'launch_miniapp',
          name: 'Russian Roulette',
          url: 'https://russian-roulette-lyart.vercel.app/',
          splashImageUrl: 'https://russian-roulette-lyart.vercel.app/splash.png',
          splashBackgroundColor: '#1a1a1a',
        },
      },
    }),
  },
};

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <RootProvider>
      <html lang="en">
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <SafeArea>{children}</SafeArea>
        </body>
      </html>
    </RootProvider>
  );
}
