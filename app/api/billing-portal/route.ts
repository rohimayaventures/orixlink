import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!subscription?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No billing account found' },
        { status: 404 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://triage.rohimaya.ai'

    const { data: activeCredits } = await supabase
      .from('credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .is('frozen_at', null)
      .gt('credits_remaining', 0)

    const totalCredits =
      activeCredits?.reduce((sum, row) => sum + row.credits_remaining, 0) ?? 0

    const returnUrl =
      totalCredits > 0
        ? `${baseUrl}/account?credits_frozen=${totalCredits}`
        : `${baseUrl}/account`

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
