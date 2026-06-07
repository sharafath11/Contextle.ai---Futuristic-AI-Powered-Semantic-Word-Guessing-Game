// ─────────────────────────────────────────────────────────────────────────────
//  utils/supabase/client.ts
//  Browser-side Supabase client for Client Components ("use client")
//  Uses @supabase/ssr's createBrowserClient for cookie-based auth.
// ─────────────────────────────────────────────────────────────────────────────

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
