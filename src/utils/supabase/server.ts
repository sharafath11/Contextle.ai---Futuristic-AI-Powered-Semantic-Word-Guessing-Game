// ─────────────────────────────────────────────────────────────────────────────
//  utils/supabase/server.ts
//  Server-side Supabase client for Server Components, Route Handlers, and
//  Server Actions. Uses cookie-based auth via @supabase/ssr.
// ─────────────────────────────────────────────────────────────────────────────

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

  return createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    }
  );
}

/**
 * Admin client using the service role key — bypasses RLS.
 * ⚠️  ONLY use in Route Handlers and Server Actions. NEVER on the client.
 */
export async function createAdminClient() {
  const cookieStore = await cookies();
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    "placeholder-service-key";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";

  return createServerClient(
    url,
    serviceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in server component context
          }
        },
      },
    }
  );
}
