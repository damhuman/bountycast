'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccount } from 'wagmi'
import { BountyCategory } from '@/types/bounty'
import { config } from '@/lib/config'
import { useBountyContract } from '@/lib/hooks/useBountyContract'

const bountyFormSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  amount: z.string().regex(/^\d+(\.\d+)?$/, 'Invalid amount').refine(
    (val) => {
      const num = parseFloat(val)
      return num >= parseFloat(config.minBountyAmount) && num <= parseFloat(config.maxBountyAmount)
    },
    { message: `Amount must be between ${config.minBountyAmount} and ${config.maxBountyAmount} ETH` }
  ),
  deadline: z.string(),
  category: z.nativeEnum(BountyCategory),
})

type BountyFormData = z.infer<typeof bountyFormSchema>

export function BountyCreationForm() {
  const { address } = useAccount()
  const [createdBountyId, setCreatedBountyId] = useState<number | null>(null)
  const [formData, setFormData] = useState<BountyFormData | null>(null)

  const {
    createBounty,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error
  } = useBountyContract()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BountyFormData>({
    resolver: zodResolver(bountyFormSchema),
  })

  const amount = watch('amount')
  const platformFee = amount ? (parseFloat(amount) * config.platformFeePercent / 100).toFixed(4) : '0'
  const totalAmount = amount ? (parseFloat(amount) + parseFloat(platformFee)).toFixed(4) : '0'

  // Save to database after successful transaction
  useEffect(() => {
    if (isSuccess && formData && hash) {
      saveBountyToDatabase(formData, hash)
    }
  }, [isSuccess, formData, hash])

  const saveBountyToDatabase = async (data: BountyFormData, txHash: string) => {
    try {
      const response = await fetch('/api/bounty/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          creatorAddress: address,
          creatorFid: 0, // TODO: Get from Farcaster auth
          txHash,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setCreatedBountyId(result.bounty.id)
      }
    } catch (error) {
      console.error('Error saving to database:', error)
    }
  }

  const onSubmit = async (data: BountyFormData) => {
    if (!address) {
      alert('Please connect your wallet first')
      return
    }

    try {
      setFormData(data)
      const deadline = new Date(data.deadline)

      await createBounty(data.amount, deadline, {
        title: data.title,
        description: data.description,
        category: data.category,
      })
    } catch (error) {
      console.error('Error creating bounty:', error)
      alert('Failed to create bounty: ' + (error as Error).message)
    }
  }

  if (createdBountyId) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-green-50 rounded-lg">
        <h2 className="text-2xl font-bold text-green-800 mb-4">Bounty Created!</h2>
        <p className="text-gray-700 mb-4">
          Your bounty has been created and funds are in escrow.
        </p>
        <a
          href={`/bounty/${createdBountyId}`}
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Bounty
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold mb-6">Create Bounty</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Title *
          </label>
          <input
            {...register('title')}
            type="text"
            placeholder="e.g., Design logo for DeFi protocol"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Describe what you need done, including any requirements..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            {...register('category')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select a category</option>
            {Object.values(BountyCategory).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bounty Amount (ETH) *
          </label>
          <input
            {...register('amount')}
            type="text"
            placeholder="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.amount && (
            <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
          )}
          {amount && (
            <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
              <div className="flex justify-between mb-1">
                <span>Bounty:</span>
                <span>{amount} ETH</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>Platform fee ({config.platformFeePercent}%):</span>
                <span>{platformFee} ETH</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span>Total:</span>
                <span>{totalAmount} ETH</span>
              </div>
            </div>
          )}
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Deadline *
          </label>
          <input
            {...register('deadline')}
            type="datetime-local"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.deadline && (
            <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          {!address ? (
            <div className="text-center text-gray-600">
              Please connect your wallet to create a bounty
            </div>
          ) : (
            <>
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isPending && 'Waiting for signature...'}
                {isConfirming && 'Confirming transaction...'}
                {!isPending && !isConfirming && 'Create Bounty & Lock Funds'}
              </button>

              {/* Transaction Status */}
              {hash && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700 mb-2">
                    Transaction submitted!
                  </p>
                  <a
                    href={`https://sepolia.basescan.org/tx/${hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    View on Basescan
                  </a>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-600">
                    Error: {error.message}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </form>
    </div>
  )
}
