// @ts-nocheck
import { Button, Frog } from 'frog'
import { handle } from 'frog/next'
import { query } from '@/lib/db/client'

const app = new Frog({
  assetsPath: '/',
  basePath: '/api/frame',
  title: 'CastBounty',
})

// Home frame - shows bounty creation or active bounties
app.frame('/', async (c) => {
  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: 60,
          fontWeight: 'bold',
          padding: '40px',
        }}
      >
        <div style={{ marginBottom: '20px' }}>🎯 CastBounty</div>
        <div style={{ fontSize: 32, fontWeight: 'normal', textAlign: 'center' }}>
          Create micro-bounties. Get instant payments.
        </div>
      </div>
    ) as any,
    intents: [
      <Button action="/create">Create Bounty</Button>,
      <Button action="/browse">Browse Bounties</Button>,
    ] as any,
  })
})

// Create bounty - multi-step form
app.frame('/create', async (c) => {
  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: 48,
          fontWeight: 'bold',
          padding: '60px',
        }}
      >
        <div>Create Your Bounty</div>
        <div style={{ fontSize: 28, marginTop: '30px', fontWeight: 'normal' }}>
          Visit the web app to create a bounty with full details and escrow your payment.
        </div>
      </div>
    ),
    intents: [
      <Button.Link href={`${process.env.NEXT_PUBLIC_APP_URL}/create`}>
        Open Creator
      </Button.Link>,
      <Button action="/">Back</Button>,
    ],
  })
})

// Browse bounties
app.frame('/browse', async (c) => {
  const { inputText } = c
  const page = parseInt(inputText || '0')

  // Fetch active bounties
  const result = await query(
    `SELECT b.*, u.username as creator_username,
            COUNT(s.id) as submission_count
     FROM bounties b
     LEFT JOIN users u ON b.creator_fid = u.fid
     LEFT JOIN submissions s ON b.id = s.bounty_id
     WHERE b.status = 'ACTIVE'
     GROUP BY b.id, u.username
     ORDER BY b.created_at DESC
     LIMIT 1 OFFSET $1`,
    [page]
  )

  if (result.rows.length === 0) {
    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#1a1a2e',
            color: 'white',
            fontSize: 40,
          }}
        >
          No active bounties found
        </div>
      ),
      intents: [<Button action="/">Home</Button>],
    })
  }

  const bounty = result.rows[0]
  const amountEth = (parseFloat(bounty.amount_wei) / 1e18).toFixed(4)
  const deadline = new Date(bounty.deadline)
  const hoursLeft = Math.max(
    0,
    Math.floor((deadline.getTime() - Date.now()) / (1000 * 60 * 60))
  )

  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
          color: 'white',
          padding: '50px',
        }}
      >
        <div style={{ fontSize: 24, color: '#ffd700', marginBottom: '20px' }}>
          {bounty.category} • {hoursLeft}h left
        </div>
        <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: '20px' }}>
          {bounty.title}
        </div>
        <div style={{ fontSize: 32, marginBottom: '30px' }}>
          {bounty.description.substring(0, 100)}...
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28 }}>
          <div>💰 {amountEth} ETH</div>
          <div>📝 {bounty.submission_count || 0} submissions</div>
        </div>
      </div>
    ),
    intents: [
      <Button.Link href={`${process.env.NEXT_PUBLIC_APP_URL}/bounty/${bounty.id}`}>
        View Details
      </Button.Link>,
      <Button action="/browse" value={(page + 1).toString()}>
        Next →
      </Button>,
      <Button action="/">Home</Button>,
    ],
  })
})

// View specific bounty
app.frame('/bounty/:id', async (c) => {
  const bountyId = c.req.param('id')

  const result = await query(
    `SELECT b.*, u.username as creator_username,
            COUNT(s.id) as submission_count
     FROM bounties b
     LEFT JOIN users u ON b.creator_fid = u.fid
     LEFT JOIN submissions s ON b.id = s.bounty_id
     WHERE b.id = $1
     GROUP BY b.id, u.username`,
    [bountyId]
  )

  if (result.rows.length === 0) {
    return c.res({
      image: (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            background: '#1a1a2e',
            color: 'white',
            fontSize: 40,
          }}
        >
          Bounty not found
        </div>
      ),
      intents: [<Button action="/browse">Browse Bounties</Button>],
    })
  }

  const bounty = result.rows[0]
  const amountEth = (parseFloat(bounty.amount_wei) / 1e18).toFixed(4)

  const statusColor =
    bounty.status === 'COMPLETED'
      ? '#4caf50'
      : bounty.status === 'ACTIVE'
      ? '#2196f3'
      : '#9e9e9e'

  return c.res({
    image: (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: `linear-gradient(135deg, ${statusColor} 0%, #1a1a2e 100%)`,
          color: 'white',
          padding: '50px',
        }}
      >
        <div style={{ fontSize: 28, marginBottom: '20px' }}>
          {bounty.category} • by @{bounty.creator_username || 'anonymous'}
        </div>
        <div style={{ fontSize: 52, fontWeight: 'bold', marginBottom: '25px' }}>
          {bounty.title}
        </div>
        <div style={{ fontSize: 36, marginBottom: '30px', opacity: 0.9 }}>
          💰 {amountEth} ETH
        </div>
        <div style={{ fontSize: 24 }}>
          Status: {bounty.status} • {bounty.submission_count || 0} submissions
        </div>
      </div>
    ),
    intents: [
      <Button.Link href={`${process.env.NEXT_PUBLIC_APP_URL}/bounty/${bountyId}`}>
        Submit Work
      </Button.Link>,
      <Button action="/browse">More Bounties</Button>,
    ],
  })
})

export const GET = handle(app)
export const POST = handle(app)
