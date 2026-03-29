export const PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  },
  family: {
    monthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY!,
    annual: process.env.STRIPE_PRICE_FAMILY_ANNUAL!,
  },
  lifetime: process.env.STRIPE_PRICE_LIFETIME!,
  credits: {
    starter: process.env.STRIPE_PRICE_CREDITS_STARTER!,
    standard: process.env.STRIPE_PRICE_CREDITS_STANDARD!,
    value: process.env.STRIPE_PRICE_CREDITS_VALUE!,
    power: process.env.STRIPE_PRICE_CREDITS_POWER!,
  },
} as const

export type SubscriptionTier = 'free' | 'pro' | 'family' | 'lifetime'
export type CreditPack = 'starter' | 'standard' | 'value' | 'power'
