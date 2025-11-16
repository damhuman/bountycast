import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'
import { CreateBountyInput, BountyCategory } from '@/types/bounty'
import { z } from 'zod'

const createBountySchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(1000),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  deadline: z.string().datetime(),
  category: z.nativeEnum(BountyCategory),
  creatorFid: z.number(),
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  metadataIpfs: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createBountySchema.parse(body)

    // Convert amount to wei (assuming input is in ETH)
    const amountWei = BigInt(Math.floor(parseFloat(validated.amount) * 1e18))

    const result = await query(
      `INSERT INTO bounties (
        creator_fid,
        creator_address,
        title,
        description,
        amount_wei,
        deadline,
        category,
        metadata_ipfs,
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'ACTIVE')
      RETURNING *`,
      [
        validated.creatorFid,
        validated.creatorAddress,
        validated.title,
        validated.description,
        amountWei.toString(),
        validated.deadline,
        validated.category,
        validated.metadataIpfs || null,
      ]
    )

    // Update user stats
    await query(
      `INSERT INTO users (fid, address, bounties_created)
       VALUES ($1, $2, 1)
       ON CONFLICT (fid) DO UPDATE
       SET bounties_created = users.bounties_created + 1,
           address = COALESCE(users.address, $2),
           updated_at = NOW()`,
      [validated.creatorFid, validated.creatorAddress]
    )

    return NextResponse.json({
      success: true,
      bounty: result.rows[0],
    })
  } catch (error) {
    console.error('Error creating bounty:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create bounty' },
      { status: 500 }
    )
  }
}
