import Stripe from 'stripe'

// Validated at startup in lib/env.ts

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
})
