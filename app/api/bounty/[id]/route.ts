import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bountyId = parseInt(id)

    if (isNaN(bountyId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid bounty ID' },
        { status: 400 }
      )
    }

    const result = await query(
      `SELECT
        b.*,
        u.username as creator_username,
        COUNT(s.id) as submission_count
       FROM bounties b
       LEFT JOIN users u ON b.creator_fid = u.fid
       LEFT JOIN submissions s ON b.id = s.bounty_id
       WHERE b.id = $1
       GROUP BY b.id, u.username`,
      [bountyId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Bounty not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      bounty: result.rows[0],
    })
  } catch (error) {
    console.error('Error fetching bounty:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bounty' },
      { status: 500 }
    )
  }
}
