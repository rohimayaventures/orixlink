import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const sessionId = request.nextUrl.searchParams.get('session_id')
  if (!sessionId) {
    return NextResponse.json(
      { error: 'Missing session_id' },
      { status: 400 }
    )
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const sessionUserId = session.metadata?.user_id
    if (sessionUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({
      status: session.payment_status,
      priceKey: session.metadata?.price_key,
      creditsAmount: session.metadata?.credits_amount,
      isLifetime: session.metadata?.is_lifetime === 'true',
    })
  } catch {
    return NextResponse.json(
      { error: 'Session not found' },
      { status: 404 }
    )
  }
}
