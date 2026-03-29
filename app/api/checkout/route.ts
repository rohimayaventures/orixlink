import { NextRequest, NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { PRICE_IDS } from '@/lib/stripe-price-ids'
import { createClient } from '@/lib/supabase/server'

const PRICE_KEY_MAP: Record<string, string> = {
  'pro-monthly': PRICE_IDS.pro.monthly,
  'pro-annual': PRICE_IDS.pro.annual,
  'family-monthly': PRICE_IDS.family.monthly,
  'family-annual': PRICE_IDS.family.annual,
  'lifetime': PRICE_IDS.lifetime,
  'credits-starter': PRICE_IDS.credits.starter,
  'credits-standard': PRICE_IDS.credits.standard,
  'credits-value': PRICE_IDS.credits.value,
  'credits-power': PRICE_IDS.credits.power,
}

const CREDIT_AMOUNTS: Record<string, number> = {
  'credits-starter': 25,
  'credits-standard': 75,
  'credits-value': 150,
  'credits-power': 300,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, priceKey } = body

    const priceId = PRICE_KEY_MAP[priceKey]
    if (!priceId) {
      return NextResponse.json({ error: 'Invalid price key' }, { status: 400 })
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://triage.rohimaya.ai')

    // Look up or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle()

    let customerId = subscription?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id
    }

    const isSubscription = type === 'subscription'
    const isCreditPack = priceKey.startsWith('credits-')
    const isLifetime = priceKey === 'lifetime'

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isSubscription ? 'subscription' : 'payment',
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        user_id: user.id,
        price_key: priceKey,
        ...(isCreditPack && { credits_amount: String(CREDIT_AMOUNTS[priceKey]) }),
        ...(isLifetime && { is_lifetime: 'true' }),
      },
    }

    if (isSubscription) {
      sessionConfig.subscription_data = {
        metadata: {
          user_id: user.id,
          price_key: priceKey,
        },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
