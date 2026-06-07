// ─────────────────────────────────────────────────────────────────────────────
//  app/auth/callback/route.ts
//  OAuth callback handler — exchanges the auth code for a session.
//  Supabase redirects here after Google login completes.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // After successful login, ensure the user has a profile row
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        // Upsert into profiles table (creates if not exists)
        const adminClient = await createAdminClient();
        await adminClient.from("profiles").upsert(
          {
            id: user.id,
            email: user.email ?? "",
            display_name:
              user.user_metadata?.full_name ??
              user.user_metadata?.name ??
              user.email?.split("@")[0] ??
              "Player",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        );
      }

      // Redirect to the game (or wherever `next` points)
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (siteUrl) {
        return NextResponse.redirect(`${siteUrl.replace(/\/$/, '')}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // If something went wrong, redirect to error page or home
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
