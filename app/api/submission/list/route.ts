import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const bountyId = searchParams.get('bountyId')

    if (!bountyId) {
      return NextResponse.json(
        { success: false, error: 'Bounty ID is required' },
        { status: 400 }
      )
    }

    const result = await query(
      `SELECT
        s.*,
        u.username as submitter_username,
        u.reputation_score as submitter_reputation
       FROM submissions s
       LEFT JOIN users u ON s.submitter_fid = u.fid
       WHERE s.bounty_id = $1
       ORDER BY s.created_at DESC`,
      [bountyId]
    )

    return NextResponse.json({
      success: true,
      submissions: result.rows,
    })
  } catch (error) {
    console.error('Error fetching submissions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    )
  }
}
