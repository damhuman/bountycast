import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const bountyId = parseInt(id)
    const { submissionId, txHash } = await request.json()

    if (!submissionId || !txHash) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      // Update submission as winner
      await client.query(
        `UPDATE submissions
         SET is_winner = true, updated_at = NOW()
         WHERE id = $1`,
        [submissionId]
      )

      // Update bounty status to COMPLETED
      await client.query(
        `UPDATE bounties
         SET status = 'COMPLETED', updated_at = NOW()
         WHERE id = $1`,
        [bountyId]
      )

      // Record transaction
      await client.query(
        `INSERT INTO transactions (
          bounty_id, submission_id, transaction_type,
          transaction_hash, amount_wei, created_at
        )
        VALUES ($1, $2, 'WINNER_SELECTED', $3,
          (SELECT amount_wei FROM bounties WHERE id = $1),
          NOW())`,
        [bountyId, submissionId, txHash]
      )

      await client.query('COMMIT')

      return NextResponse.json({
        success: true,
        message: 'Winner selected successfully'
      })
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  } catch (error) {
    console.error('Error selecting winner:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to select winner' },
      { status: 500 }
    )
  }
}
