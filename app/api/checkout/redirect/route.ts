import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { PRICE_IDS } from "@/lib/stripe-price-ids";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  try {
    const plan = requestUrl.searchParams.get("plan");

    if (plan !== "pro" && plan !== "family") {
      return NextResponse.redirect(new URL("/pricing", requestUrl.origin));
    }

    const priceKey = plan === "pro" ? "pro-annual" : "family-annual";
    const priceId = plan === "pro" ? PRICE_IDS.pro.annual : PRICE_IDS.family.annual;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", requestUrl.origin));
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://triage.rohimaya.ai");

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      metadata: {
        user_id: user.id,
        price_key: priceKey,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          price_key: priceKey,
        },
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    if (!session.url) {
      return NextResponse.redirect(new URL("/pricing", requestUrl.origin));
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error("Checkout redirect error:", error);
    return NextResponse.redirect(new URL("/pricing", requestUrl.origin));
  }
}

