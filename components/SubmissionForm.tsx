'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAccount } from 'wagmi'

const submissionSchema = z.object({
  externalUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  description: z.string().max(500, 'Description must be under 500 characters').optional(),
})

type SubmissionFormData = z.infer<typeof submissionSchema>

interface SubmissionFormProps {
  bountyId: number
  onSuccess?: () => void
}

export function SubmissionForm({ bountyId, onSuccess }: SubmissionFormProps) {
  const { address } = useAccount()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
  })

  const onSubmit = async (data: SubmissionFormData) => {
    if (!address) {
      alert('Please connect your wallet first')
      return
    }

    if (!data.externalUrl && !data.description) {
      alert('Please provide either a URL or description')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/submission/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bountyId,
          submitterAddress: address,
          submitterFid: 0, // TODO: Get from Farcaster auth
          externalUrl: data.externalUrl || undefined,
          description: data.description || undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitted(true)
        reset()
        if (onSuccess) onSuccess()
      } else {
        alert('Failed to submit: ' + result.error)
      }
    } catch (error) {
      console.error('Error submitting:', error)
      alert('Failed to submit work')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">Submission Received!</h3>
        <p className="text-green-700 mb-4">
          Your work has been submitted. The bounty creator will review it.
        </p>
        <button
          onClick={() => setSubmitted(false)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Submit Another
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-xl font-bold mb-4">Submit Your Work</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* External URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link to Your Work
          </label>
          <input
            {...register('externalUrl')}
            type="url"
            placeholder="https://example.com/your-work"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-gray-500">
            Link to Figma, GitHub, Google Drive, or other platform
          </p>
          {errors.externalUrl && (
            <p className="mt-1 text-sm text-red-600">{errors.externalUrl.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Explain your submission, approach, or any notes for the creator..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Submit Button */}
        {!address ? (
          <div className="text-center text-gray-600 py-4">
            Please connect your wallet to submit
          </div>
        ) : (
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Work'}
          </button>
        )}
      </form>
    </div>
  )
}
