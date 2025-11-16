'use client'

import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { Avatar, Name, Identity } from '@coinbase/onchainkit/identity'
import Link from 'next/link'
import { useAccount } from 'wagmi'

export default function Home() {
  const { address } = useAccount()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CastBounty
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {address && (
              <Identity address={address}>
                <Avatar />
                <Name />
              </Identity>
            )}
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Micro-Bounties on Farcaster
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Create tasks, lock funds in escrow, get submissions, and pay winners instantly.
          All powered by Base L2.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/create"
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
          >
            Create Bounty
          </Link>
          <Link
            href="/browse"
            className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-600 hover:text-blue-600 transition-all"
          >
            Browse Bounties
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon="🔒"
            title="Smart Escrow"
            description="Funds locked in smart contract until winner selected. Trustless and transparent."
          />
          <FeatureCard
            icon="⚡"
            title="Instant Payments"
            description="Winner gets paid immediately on selection. No waiting, no intermediaries."
          />
          <FeatureCard
            icon="💎"
            title="Low Fees on Base"
            description="Build on Base L2 for minimal gas fees. 2.5% platform fee only."
          />
          <FeatureCard
            icon="🎨"
            title="Any Type of Work"
            description="Design, code, content, research, translations - any micro-task works."
          />
          <FeatureCard
            icon="📱"
            title="Native to Farcaster"
            description="Create and submit bounties directly in your social feed with Frames."
          />
          <FeatureCard
            icon="🏆"
            title="Build Reputation"
            description="Earn on-chain reputation score. Top contributors get discovered."
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          <Step number="1" title="Create" description="Post your task and lock funds in escrow" />
          <Step number="2" title="Submit" description="Contributors submit their work" />
          <Step number="3" title="Select" description="Choose the best submission" />
          <Step number="4" title="Pay" description="Winner gets paid automatically" />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the future of decentralized work on Farcaster
          </p>
          <Link
            href="/create"
            className="inline-block px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all"
          >
            Create Your First Bounty
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>Built with OnchainKit on Base • Powered by Farcaster Frames</p>
        </div>
      </footer>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}
