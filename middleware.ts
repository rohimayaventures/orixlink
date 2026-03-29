import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/assess" || path.startsWith("/assess/")) {
    const url = request.nextUrl.clone();
    url.pathname =
      path === "/assess"
        ? "/assessment"
        : `/assessment${path.slice("/assess".length)}`;
    return NextResponse.redirect(url);
  }
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
