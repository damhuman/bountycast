import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db/client'
import { BountyCategory, BountyStatus } from '@/types/bounty'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category')
    const status = searchParams.get('status') || 'ACTIVE'
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'DESC'

    // Build WHERE clause
    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      conditions.push(`b.status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    if (category && category !== 'ALL') {
      conditions.push(`b.category = $${paramIndex}`)
      params.push(category)
      paramIndex++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    // Validate sortBy to prevent SQL injection
    const allowedSortFields = ['created_at', 'amount_wei', 'deadline', 'title']
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at'
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC'

    const result = await query(
      `SELECT
        b.*,
        u.username as creator_username,
        COUNT(s.id) as submission_count
       FROM bounties b
       LEFT JOIN users u ON b.creator_fid = u.fid
       LEFT JOIN submissions s ON b.id = s.bounty_id
       ${whereClause}
       GROUP BY b.id, u.username
       ORDER BY b.${safeSortBy} ${safeSortOrder}
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      [...params, limit, offset]
    )

    // Get total count for pagination
    const countResult = await query(
      `SELECT COUNT(*) as total
       FROM bounties b
       ${whereClause}`,
      params
    )

    const total = parseInt(countResult.rows[0]?.total || '0')

    return NextResponse.json({
      success: true,
      bounties: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching bounties:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch bounties' },
      { status: 500 }
    )
  }
}
