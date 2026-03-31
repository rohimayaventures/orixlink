import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const plan = requestUrl.searchParams.get("plan");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (plan === "pro" || plan === "family") {
        return NextResponse.redirect(
          new URL(`/api/checkout/redirect?plan=${plan}`, requestUrl.origin)
        );
      }
      return NextResponse.redirect(new URL("/dashboard", requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL("/?auth=error", requestUrl.origin));
}
