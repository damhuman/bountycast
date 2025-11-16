import { NextRequest, NextResponse } from 'next/server'

/**
 * Farcaster webhook endpoint for miniapp events
 * Handles notifications, actions, and other Farcaster events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Farcaster webhook received:', body)

    // Handle different webhook event types
    const { type } = body

    switch (type) {
      case 'frame_added':
        // User added the frame/miniapp
        console.log('Frame added by user:', body.fid)
        break

      case 'frame_removed':
        // User removed the frame/miniapp
        console.log('Frame removed by user:', body.fid)
        break

      case 'notification_click':
        // User clicked on a notification
        console.log('Notification clicked:', body)
        break

      default:
        console.log('Unknown webhook type:', type)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'CastBounty Webhook',
    timestamp: new Date().toISOString()
  })
}
