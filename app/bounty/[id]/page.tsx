'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { useAccount } from 'wagmi'
import { formatEther } from 'viem'
import { Bounty, Submission } from '@/types/bounty'
import { SubmissionForm } from '@/components/SubmissionForm'
import { useBountyContract } from '@/lib/hooks/useBountyContract'

export default function BountyDetailPage() {
  const params = useParams()
  const { address } = useAccount()
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'submissions' | 'submit'>('details')

  useEffect(() => {
    if (params.id) {
      fetchBountyData()
    }
  }, [params.id])

  const fetchBountyData = async () => {
    setLoading(true)
    try {
      // Fetch bounty
      const bountyRes = await fetch(`/api/bounty/${params.id}`)
      const bountyData = await bountyRes.json()

      if (bountyData.success) {
        setBounty(bountyData.bounty)
      }

      // Fetch submissions
      const submissionsRes = await fetch(`/api/submission/list?bountyId=${params.id}`)
      const submissionsData = await submissionsRes.json()

      if (submissionsData.success) {
        setSubmissions(submissionsData.submissions)
      }
    } catch (error) {
      console.error('Error fetching bounty data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading bounty...</p>
        </div>
      </div>
    )
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-600 mb-4">Bounty not found</p>
          <Link
            href="/browse"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Browse Bounties
          </Link>
        </div>
      </div>
    )
  }

  const amountEth = formatEther(bounty.amountWei)
  const deadline = new Date(bounty.deadline)
  const now = new Date()
  const hoursLeft = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)))
  const isExpired = hoursLeft === 0
  const isCreator = address?.toLowerCase() === bounty.creatorAddress.toLowerCase()

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
          <ConnectWallet />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <span>←</span> Back to Bounties
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bounty Header */}
            <div className="bg-white rounded-xl shadow-sm p-8">
              <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getCategoryColor(bounty.category)}`}>
                  {bounty.category}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(bounty.status)}`}>
                  {bounty.status}
                </span>
              </div>

              <h1 className="text-3xl font-bold mb-4">{bounty.title}</h1>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <span>Posted by</span>
                  <span className="font-medium text-gray-900">
                    @{bounty.creatorUsername || 'anonymous'}
                  </span>
                </div>
                <span>•</span>
                <div>{new Date(bounty.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{bounty.description}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="border-b">
                <div className="flex">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-6 py-4 font-semibold transition-colors ${
                      activeTab === 'details'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('submissions')}
                    className={`px-6 py-4 font-semibold transition-colors ${
                      activeTab === 'submissions'
                        ? 'border-b-2 border-blue-600 text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Submissions ({submissions.length})
                  </button>
                  {!isCreator && !isExpired && (
                    <button
                      onClick={() => setActiveTab('submit')}
                      className={`px-6 py-4 font-semibold transition-colors ${
                        activeTab === 'submit'
                          ? 'border-b-2 border-blue-600 text-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Submit Work
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-4">
                    <DetailRow label="Bounty Amount" value={`${parseFloat(amountEth).toFixed(4)} ETH`} />
                    <DetailRow label="Deadline" value={deadline.toLocaleString()} />
                    <DetailRow label="Time Remaining" value={isExpired ? 'Expired' : `${hoursLeft} hours`} />
                    <DetailRow label="Category" value={bounty.category} />
                    <DetailRow label="Status" value={bounty.status} />
                    <DetailRow label="Creator Address" value={bounty.creatorAddress} mono />
                  </div>
                )}

                {activeTab === 'submissions' && (
                  <div className="space-y-4">
                    {submissions.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        No submissions yet. Be the first!
                      </div>
                    ) : (
                      submissions.map((submission) => (
                        <SubmissionCard
                          key={submission.id}
                          submission={submission}
                          isCreator={isCreator}
                          bountyId={bounty.id}
                        />
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'submit' && (
                  <SubmissionForm
                    bountyId={bounty.id}
                    onSuccess={() => {
                      fetchBountyData()
                      setActiveTab('submissions')
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bounty Stats */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-bold mb-4">Bounty Stats</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reward</p>
                  <p className="text-3xl font-bold text-blue-600">{parseFloat(amountEth).toFixed(4)} ETH</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Submissions</p>
                  <p className="text-2xl font-semibold">{submissions.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Time Left</p>
                  <p className="text-xl font-semibold">
                    {isExpired ? (
                      <span className="text-red-600">Expired</span>
                    ) : (
                      <span>{hoursLeft} hours</span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Card */}
            {!isCreator && !isExpired && bounty.status === 'ACTIVE' && (
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-sm p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Ready to submit?</h3>
                <p className="text-sm mb-4 opacity-90">
                  Submit your work and compete for the bounty
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="w-full px-4 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-all"
                >
                  Submit Your Work
                </button>
              </div>
            )}

            {isCreator && submissions.length > 0 && (
              <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-xl shadow-sm p-6 text-white">
                <h3 className="text-lg font-bold mb-2">Review Submissions</h3>
                <p className="text-sm mb-4 opacity-90">
                  You have {submissions.length} submission{submissions.length !== 1 ? 's' : ''} to review
                </p>
                <button
                  onClick={() => setActiveTab('submissions')}
                  className="w-full px-4 py-3 bg-white text-green-600 font-semibold rounded-lg hover:bg-gray-100 transition-all"
                >
                  View Submissions
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between py-2 border-b last:border-b-0">
      <span className="text-gray-600">{label}</span>
      <span className={`font-semibold ${mono ? 'font-mono text-sm' : ''}`}>{value}</span>
    </div>
  )
}

function SubmissionCard({
  submission,
  isCreator,
  bountyId,
}: {
  submission: Submission
  isCreator: boolean
  bountyId: number
}) {
  const { selectWinner, hash, isPending, isConfirming, isSuccess, error } = useBountyContract()
  const [isSelecting, setIsSelecting] = useState(false)

  const handleSelectWinner = async () => {
    if (!bountyId || !submission.blockchainId) {
      alert('Missing blockchain IDs')
      return
    }

    try {
      setIsSelecting(true)
      await selectWinner(bountyId, submission.blockchainId)
    } catch (err) {
      console.error('Error selecting winner:', err)
    }
  }

  // Update database after successful transaction
  useEffect(() => {
    if (isSuccess && hash) {
      updateWinnerInDatabase()
    }
  }, [isSuccess, hash])

  const updateWinnerInDatabase = async () => {
    try {
      await fetch(`/api/bounty/${bountyId}/select-winner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submission.id,
          txHash: hash,
        }),
      })
      // Reload page to show updated status
      window.location.reload()
    } catch (error) {
      console.error('Error updating database:', error)
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${submission.isWinner ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
      {submission.isWinner && (
        <div className="mb-2">
          <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
            🏆 Winner
          </span>
        </div>
      )}

      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold">@{submission.submitterUsername || 'anonymous'}</p>
          <p className="text-sm text-gray-600">{new Date(submission.createdAt).toLocaleString()}</p>
        </div>
        {submission.submitterReputation !== undefined && (
          <span className="text-sm text-gray-600">
            Rep: {submission.submitterReputation}
          </span>
        )}
      </div>

      {submission.description && (
        <p className="text-gray-700 mb-3">{submission.description}</p>
      )}

      {submission.externalUrl && (
        <a
          href={submission.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm mb-3"
        >
          View Submission <span>→</span>
        </a>
      )}

      {isCreator && !submission.isWinner && (
        <div>
          <button
            onClick={handleSelectWinner}
            disabled={isPending || isConfirming}
            className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending && 'Waiting for signature...'}
            {isConfirming && 'Confirming...'}
            {!isPending && !isConfirming && 'Select as Winner'}
          </button>

          {hash && (
            <div className="mt-2 text-xs">
              <a
                href={`https://sepolia.basescan.org/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline"
              >
                View Transaction
              </a>
            </div>
          )}

          {error && (
            <div className="mt-2 text-xs text-red-600">
              Error: {error.message}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    DESIGN: 'bg-purple-100 text-purple-700',
    CODE: 'bg-blue-100 text-blue-700',
    CONTENT: 'bg-green-100 text-green-700',
    RESEARCH: 'bg-yellow-100 text-yellow-700',
    TRANSLATION: 'bg-pink-100 text-pink-700',
    OTHER: 'bg-gray-100 text-gray-700',
  }
  return colors[category] || colors.OTHER
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: 'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-gray-100 text-gray-700',
    EXPIRED: 'bg-red-100 text-red-700',
  }
  return colors[status] || colors.ACTIVE
}
