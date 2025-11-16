import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'
import { z } from 'zod'

const createSubmissionSchema = z.object({
  bountyId: z.number(),
  submitterFid: z.number(),
  submitterAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  externalUrl: z.string().url().optional(),
  description: z.string().max(500).optional(),
  contentIpfs: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validated = createSubmissionSchema.parse(body)

    // Check if bounty exists and is active
    const bountyResult = await query(
      'SELECT * FROM bounties WHERE id = $1',
      [validated.bountyId]
    )

    if (bountyResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bounty not found' },
        { status: 404 }
      )
    }

    const bounty = bountyResult.rows[0]

    if (bounty.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Bounty is not active' },
        { status: 400 }
      )
    }

    // Check if deadline has passed
    if (new Date(bounty.deadline) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Bounty deadline has passed' },
        { status: 400 }
      )
    }

    // Create submission
    const result = await query(
      `INSERT INTO submissions (
        bounty_id,
        submitter_fid,
        submitter_address,
        external_url,
        description,
        content_ipfs
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        validated.bountyId,
        validated.submitterFid,
        validated.submitterAddress,
        validated.externalUrl || null,
        validated.description || null,
        validated.contentIpfs || null,
      ]
    )

    // Update user record
    await query(
      `INSERT INTO users (fid, address)
       VALUES ($1, $2)
       ON CONFLICT (fid) DO UPDATE
       SET address = COALESCE(users.address, $2),
           updated_at = NOW()`,
      [validated.submitterFid, validated.submitterAddress]
    )

    return NextResponse.json({
      success: true,
      submission: result.rows[0],
    })
  } catch (error) {
    console.error('Error creating submission:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create submission' },
      { status: 500 }
    )
  }
}
