const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "ANTHROPIC_API_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "CRON_SECRET",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "STRIPE_PRICE_PRO_MONTHLY",
  "STRIPE_PRICE_PRO_ANNUAL",
  "STRIPE_PRICE_FAMILY_MONTHLY",
  "STRIPE_PRICE_FAMILY_ANNUAL",
  "STRIPE_PRICE_LIFETIME",
  "STRIPE_PRICE_CREDITS_STARTER",
  "STRIPE_PRICE_CREDITS_STANDARD",
  "STRIPE_PRICE_CREDITS_VALUE",
  "STRIPE_PRICE_CREDITS_POWER",
  "SENTRY_DSN",
];

const optional = [
  "LOOPS_API_KEY",
  "NEXT_PUBLIC_APP_URL",
  "STRIPE_PRICE_CLINICAL_MONTHLY",
  "STRIPE_PRICE_CLINICAL_ANNUAL",
  "STRIPE_PRICE_CREDITS_CLINIC_BOOST",
];

export function validateEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n` +
        missing.map((k) => `  - ${k}`).join("\n") +
        `\n\nAdd these to your .env.local file and Vercel environment variables.`
    );
  }

  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missingOptional.length > 0) {
    console.warn(
      `Optional environment variables not set:\n` +
        missingOptional.map((k) => `  - ${k}`).join("\n")
    );
  }
}

export const env = {
  sentryDsn: process.env.SENTRY_DSN!,
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY!,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  cronSecret: process.env.CRON_SECRET!,
  resendApiKey: process.env.RESEND_API_KEY!,
  resendFromEmail: process.env.RESEND_FROM_EMAIL!,
  loopsApiKey: process.env.LOOPS_API_KEY,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "https://triage.rohimaya.ai",
  stripePriceProMonthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
  stripePriceProAnnual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  stripePriceFamilyMonthly: process.env.STRIPE_PRICE_FAMILY_MONTHLY!,
  stripePriceFamilyAnnual: process.env.STRIPE_PRICE_FAMILY_ANNUAL!,
  stripePriceLifetime: process.env.STRIPE_PRICE_LIFETIME!,
  stripePriceCreditsStarter: process.env.STRIPE_PRICE_CREDITS_STARTER!,
  stripePriceCreditsStandard: process.env.STRIPE_PRICE_CREDITS_STANDARD!,
  stripePriceCreditsValue: process.env.STRIPE_PRICE_CREDITS_VALUE!,
  stripePriceCreditsPower: process.env.STRIPE_PRICE_CREDITS_POWER!,
};
