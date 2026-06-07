import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/utils/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminClient = await createAdminClient();
    
    // 1. Try to fetch profile using adminClient to bypass any client-side RLS issues
    let { data: profile, error: fetchError } = await adminClient
      .from("profiles")
      .select("id, email, display_name, current_level, active_word, current_story, updated_at")
      .eq("id", user.id)
      .single();

    // If fetch failed because the row doesn't exist, create it
    if (fetchError || !profile) {
      const initialProfile = {
        id: user.id,
        email: user.email ?? "",
        display_name:
          user.user_metadata?.full_name ??
          user.user_metadata?.name ??
          user.email?.split("@")[0] ??
          "Player",
        current_level: 1,
        updated_at: new Date().toISOString(),
      };

      const { data: insertedProfile, error: insertError } = await adminClient
        .from("profiles")
        .insert(initialProfile)
        .select("id, email, display_name, current_level, active_word, current_story, updated_at")
        .single();

      if (insertError) {
        console.error("[contextle] Failed to auto-create profile:", insertError);
        return NextResponse.json(
          { success: false, error: "Failed to create user profile in database." },
          { status: 500 }
        );
      }
      profile = insertedProfile;
    }

    return NextResponse.json({ success: true, profile });
  } catch (error) {
    console.error("[contextle] GET /api/profile error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
