'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { BountyCategory, Bounty } from '@/types/bounty'
import { formatEther } from 'viem'

export default function BrowseBountiesPage() {
  const [bounties, setBounties] = useState<Bounty[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [sortBy, setSortBy] = useState<string>('created_at')

  useEffect(() => {
    fetchBounties()
  }, [selectedCategory, sortBy])

  const fetchBounties = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        category: selectedCategory,
        sortBy,
        limit: '20',
      })

      const response = await fetch(`/api/bounty/list?${params}`)
      const data = await response.json()

      if (data.success) {
        setBounties(data.bounties)
      }
    } catch (error) {
      console.error('Error fetching bounties:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🎯</span>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              CastBounty
            </h1>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/create"
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Create Bounty
            </Link>
            <ConnectWallet />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Browse Bounties</h1>
          <p className="text-lg text-gray-600">
            Find bounties that match your skills and start earning
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Category Filter */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">All Categories</option>
                {Object.values(BountyCategory).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="created_at">Newest First</option>
                <option value="deadline">Ending Soon</option>
                <option value="amount_wei">Highest Bounty</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bounties Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading bounties...</p>
          </div>
        ) : bounties.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-lg">
            <p className="text-2xl text-gray-400 mb-4">No bounties found</p>
            <p className="text-gray-600 mb-6">Be the first to create one!</p>
            <Link
              href="/create"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700"
            >
              Create Bounty
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function BountyCard({ bounty }: { bounty: Bounty }) {
  const amountEth = formatEther(bounty.amountWei)
  const deadline = new Date(bounty.deadline)
  const now = new Date()
  const hoursLeft = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)))
  const isExpiringSoon = hoursLeft < 24
  const isExpired = hoursLeft === 0

  return (
    <Link href={`/bounty/${bounty.id}`}>
      <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all cursor-pointer h-full flex flex-col">
        {/* Header */}
        <div className="p-6 flex-1">
          <div className="flex items-start justify-between mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(bounty.category)}`}>
              {bounty.category}
            </span>
            {isExpiringSoon && !isExpired && (
              <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                {hoursLeft}h left
              </span>
            )}
            {isExpired && (
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
                Expired
              </span>
            )}
          </div>

          <h3 className="text-xl font-bold mb-2 line-clamp-2">{bounty.title}</h3>
          <p className="text-gray-600 mb-4 line-clamp-3">{bounty.description}</p>

          {/* Creator */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <span>by</span>
            <span className="font-medium text-gray-700">
              @{bounty.creatorUsername || 'anonymous'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50 rounded-b-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bounty Amount</p>
              <p className="text-2xl font-bold text-blue-600">{parseFloat(amountEth).toFixed(4)} ETH</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600 mb-1">Submissions</p>
              <p className="text-xl font-semibold">{bounty.submissionCount || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}

function getCategoryColor(category: BountyCategory): string {
  const colors: Record<BountyCategory, string> = {
    [BountyCategory.DESIGN]: 'bg-purple-100 text-purple-700',
    [BountyCategory.CODE]: 'bg-blue-100 text-blue-700',
    [BountyCategory.CONTENT]: 'bg-green-100 text-green-700',
    [BountyCategory.RESEARCH]: 'bg-yellow-100 text-yellow-700',
    [BountyCategory.TRANSLATION]: 'bg-pink-100 text-pink-700',
    [BountyCategory.OTHER]: 'bg-gray-100 text-gray-700',
  }
  return colors[category] || colors[BountyCategory.OTHER]
}
