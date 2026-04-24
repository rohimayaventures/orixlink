import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function getTierFromPriceKey(priceKey: string): { tier: string; cap: number } {
  if (priceKey.startsWith('pro')) return { tier: 'pro', cap: 150 }
  if (priceKey.startsWith('family')) return { tier: 'family', cap: 600 }
  if (priceKey === 'lifetime') return { tier: 'lifetime', cap: 100 }
  return { tier: 'free', cap: 5 }
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | undefined {
  const fromParent = invoice.parent?.subscription_details?.subscription
  if (typeof fromParent === 'string') return fromParent
  if (fromParent && typeof fromParent === 'object' && 'id' in fromParent) {
    return fromParent.id
  }
  const legacy = (
    invoice as Stripe.Invoice & {
      subscription?: string | Stripe.Subscription | null
    }
  ).subscription
  if (typeof legacy === 'string') return legacy
  if (legacy && typeof legacy === 'object' && 'id' in legacy) return legacy.id
  return undefined
}

async function upsertSubscription(userId: string, data: Record<string, unknown>) {
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .upsert({ user_id: userId, ...data }, { onConflict: 'user_id' })
  if (error) {
    throw error
  }
}

async function upsertUsageTracking(userId: string, cap: number) {
  const period = new Date().toISOString().slice(0, 7)
  const { error: upsertErr } = await supabaseAdmin
    .from('usage_tracking')
    .upsert(
      { user_id: userId, period_month: period, assessments_cap: cap },
      { onConflict: 'user_id,period_month', ignoreDuplicates: true }
    )
  if (upsertErr) {
    throw upsertErr
  }
  const { error: updateErr } = await supabaseAdmin
    .from('usage_tracking')
    .update({ assessments_cap: cap })
    .eq('user_id', userId)
    .eq('period_month', period)
  if (updateErr) {
    throw updateErr
  }
}

async function addCredits(
  userId: string,
  amount: number,
  stripePaymentIntentId?: string,
  packName?: string
) {
  const purchasedAt = new Date().toISOString()
  const expiresAt = new Date(
    Date.now() + 365 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { error } = await supabaseAdmin
    .from('credits')
    .insert({
      user_id: userId,
      credits_purchased: amount,
      credits_remaining: amount,
      stripe_payment_intent_id: stripePaymentIntentId || null,
      pack_name: packName || null,
      purchased_at: purchasedAt,
      expires_at: expiresAt,
      frozen_at: null,
    })

  if (error) {
    if (error.code === '23505') {
      console.log(
        'Credits already added for payment intent:',
        stripePaymentIntentId,
        '-- skipping duplicate'
      )
      return
    }
    console.error('Failed to insert credits:', error)
    throw error
  }
}

async function resolveWebhookUserId(args: {
  metadataUserId?: string
  customerId?: string | null
  eventId: string
  eventType: string
}): Promise<string | null> {
  let userId = args.metadataUserId ?? null

  if (!userId && args.customerId) {
    const { data: subRow } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', args.customerId)
      .maybeSingle()

    if (subRow?.user_id) {
      userId = subRow.user_id
    }
  }

  if (!userId) {
    console.error('Webhook: no user_id resolved', {
      eventId: args.eventId,
      eventType: args.eventType,
      customerId: args.customerId ?? null,
    })
  }

  return userId
}

function failRetriable(message: string, details: Record<string, unknown>): never {
  console.error(message, details)
  throw new Error(message)
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    const { data: existing } = await supabaseAdmin
      .from('webhook_events')
      .select('id')
      .eq('id', event.id)
      .maybeSingle()

    if (existing) {
      console.log(`Webhook event ${event.id} already processed`)
      return NextResponse.json({ received: true })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId =
          typeof session.customer === 'string' ? session.customer : null
        const userId = await resolveWebhookUserId({
          metadataUserId: session.metadata?.user_id,
          customerId,
          eventId: event.id,
          eventType: event.type,
        })
        const creditsAmount = session.metadata?.credits_amount
        const isLifetime = session.metadata?.is_lifetime === 'true'

        if (!userId) {
          failRetriable('Webhook checkout.session.completed missing user_id', {
            eventId: event.id,
            customerId,
          })
        }

        if (creditsAmount) {
          const packName =
            session.metadata?.price_key?.replace('credits-', '') || null
          const pi = session.payment_intent
          const paymentIntentId =
            typeof pi === 'string'
              ? pi
              : pi && typeof pi === 'object' && 'id' in pi
                ? (pi as Stripe.PaymentIntent).id
                : undefined
          const parsedCredits = creditsAmount
            ? parseInt(creditsAmount, 10)
            : NaN

          if (isNaN(parsedCredits) || parsedCredits <= 0) {
            failRetriable('Invalid credits_amount in webhook metadata', {
              eventId: event.id,
              creditsAmount,
            })
          }

          await addCredits(
            userId,
            parsedCredits,
            paymentIntentId,
            packName ?? undefined
          )
          break
        }

        if (isLifetime) {
          await upsertSubscription(userId, {
            tier: 'lifetime',
            is_lifetime: true,
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: null,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: null,
            cancel_at_period_end: false,
          })
          await upsertUsageTracking(userId, 100)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : null
        const userId = await resolveWebhookUserId({
          metadataUserId: sub.metadata?.user_id,
          customerId,
          eventId: event.id,
          eventType: event.type,
        })
        const priceKey = sub.metadata?.price_key

        if (!userId) {
          failRetriable('Webhook subscription event missing user_id', {
            eventId: event.id,
            eventType: event.type,
            customerId,
          })
        }
        if (!priceKey) {
          failRetriable('Missing price_key in webhook metadata', {
            eventType: event.type,
            eventId: event.id,
            userId,
          })
        }

        const { tier, cap } = getTierFromPriceKey(priceKey)

        const firstItem = sub.items?.data?.[0]
        const periodStartSec =
          firstItem?.current_period_start ?? sub.billing_cycle_anchor
        const periodEndSec =
          firstItem?.current_period_end ?? periodStartSec

        await upsertSubscription(userId, {
          tier,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          status: sub.status,
          current_period_start: new Date(periodStartSec * 1000).toISOString(),
          current_period_end: new Date(periodEndSec * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
        })
        await upsertUsageTracking(userId, cap)

        if (sub.status === 'active') {
          const { error: unfreezeErr } = await supabaseAdmin
            .from('credits')
            .update({ frozen_at: null })
            .eq('user_id', userId)
            .not('frozen_at', 'is', null)
            .gt('credits_remaining', 0)
          if (unfreezeErr) {
            failRetriable('credits unfreeze on subscription active', {
              eventId: event.id,
              userId,
              error: unfreezeErr,
            })
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId =
          typeof sub.customer === 'string' ? sub.customer : null
        const userId = await resolveWebhookUserId({
          metadataUserId: sub.metadata?.user_id,
          customerId,
          eventId: event.id,
          eventType: event.type,
        })
        if (!userId) {
          failRetriable('Webhook customer.subscription.deleted missing user_id', {
            eventId: event.id,
            customerId,
          })
        }

        await upsertSubscription(userId, {
          tier: 'free',
          status: 'canceled',
          cancel_at_period_end: false,
        })
        await upsertUsageTracking(userId, 5)

        const { data: familyMembers, error: familyMembersErr } = await supabaseAdmin
          .from('family_members')
          .select('member_user_id')
          .eq('owner_user_id', userId)
          .eq('status', 'active')
          .not('member_user_id', 'is', null)
        if (familyMembersErr) {
          failRetriable('family member lookup on subscription deleted failed', {
            eventId: event.id,
            userId,
            error: familyMembersErr,
          })
        }

        if (familyMembers && familyMembers.length > 0) {
          const memberIds = familyMembers
            .map((m) => m.member_user_id)
            .filter((id): id is string => typeof id === 'string' && id.length > 0)

          if (memberIds.length > 0) {
            const nowIso = new Date().toISOString()
            const { error: memberSubErr } = await supabaseAdmin
              .from('subscriptions')
              .update({
                tier: 'free',
                status: 'active',
                updated_at: nowIso,
              })
              .in('user_id', memberIds)
            if (memberSubErr) {
              failRetriable('family member subscription downgrade failed', {
                eventId: event.id,
                userId,
                memberIds,
                error: memberSubErr,
              })
            }

            const period = new Date().toISOString().slice(0, 7)
            const { error: memberUsageErr } = await supabaseAdmin
              .from('usage_tracking')
              .update({ assessments_cap: 5 })
              .in('user_id', memberIds)
              .eq('period_month', period)
            if (memberUsageErr) {
              failRetriable('family member usage cap downgrade failed', {
                eventId: event.id,
                userId,
                memberIds,
                error: memberUsageErr,
              })
            }
          }

          const { error: familyRemoveErr } = await supabaseAdmin
            .from('family_members')
            .update({ status: 'removed' })
            .eq('owner_user_id', userId)
            .eq('status', 'active')
          if (familyRemoveErr) {
            failRetriable('family member status removal on subscription deleted failed', {
              eventId: event.id,
              userId,
              error: familyRemoveErr,
            })
          }
        }

        const { error: freezeErr } = await supabaseAdmin
          .from('credits')
          .update({ frozen_at: new Date().toISOString() })
          .eq('user_id', userId)
          .is('frozen_at', null)
          .gt('credits_remaining', 0)
        if (freezeErr) {
          failRetriable('credits freeze on subscription deleted failed', {
            eventId: event.id,
            userId,
            error: freezeErr,
          })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = subscriptionIdFromInvoice(invoice)
        if (!subId) break

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = subscriptionIdFromInvoice(invoice)
        if (!subId) break

        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'active' })
          .eq('stripe_subscription_id', subId)
        break
      }

      case 'customer.subscription.trial_will_end':
      case 'invoice.upcoming':
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_method.attached':
        break

      default:
        break
    }

    const { error: insertEventErr } = await supabaseAdmin
      .from('webhook_events')
      .insert({ id: event.id, event_type: event.type })

    if (insertEventErr) {
      if (insertEventErr.code === '23505') {
        console.log(`Webhook event ${event.id} already processed (race)`)
        return NextResponse.json({ received: true })
      }
      throw insertEventErr
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}

export const runtime = 'nodejs'
