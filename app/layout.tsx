import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CastBounty - Micro-Bounties on Farcaster",
  description: "Create and complete bounties directly in Farcaster with instant crypto payments on Base",
  openGraph: {
    title: "CastBounty",
    description: "Micro-bounties platform for Farcaster",
    images: ["/og-image.png"],
  },
  other: {
    "fc:frame": "vNext",
    "fc:frame:image": "https://spectacular-crumble-8293e5.netlify.app/og-image.png",
    "fc:frame:button:1": "Create Bounty",
    "fc:frame:button:1:action": "link",
    "fc:frame:button:1:target": "https://spectacular-crumble-8293e5.netlify.app/create",
    "fc:frame:button:2": "Browse Bounties",
    "fc:frame:button:2:action": "link",
    "fc:frame:button:2:target": "https://spectacular-crumble-8293e5.netlify.app/browse",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
