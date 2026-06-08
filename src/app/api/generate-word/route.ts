import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { EASY_PAIRS, MEDIUM_PAIRS, HARD_PAIRS } from "@/lib/fallbackData";
import { callAIProvider } from "@/lib/aiProvider";

// ── DB-Backed Rate Limiting (per user, serverless-safe) ──
async function checkDbRateLimit(
  adminClient: SupabaseClient,
  userId: string,
  maxRequests = 5,
  windowMs = 60000
): Promise<boolean> {
  try {
    const now = new Date();
    const { data: limitData, error } = await adminClient
      .from("user_rate_limits")
      .select("request_count, window_start")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") { // PGRST116 is PostgreSQL code for zero rows returned
      console.warn("[contextle] Error reading user_rate_limits table:", error.message);
      return false; // Bypass rate limit if query fails (graceful degradation)
    }

    if (!limitData) {
      const { error: insertError } = await adminClient
        .from("user_rate_limits")
        .insert({
          user_id: userId,
          request_count: 1,
          window_start: now.toISOString()
        });
      if (insertError) console.warn("[contextle] Error inserting into user_rate_limits:", insertError.message);
      return false;
    }

    const windowStart = new Date(limitData.window_start);
    const diffMs = now.getTime() - windowStart.getTime();

    if (diffMs > windowMs) {
      const { error: updateError } = await adminClient
        .from("user_rate_limits")
        .update({
          request_count: 1,
          window_start: now.toISOString()
        })
        .eq("user_id", userId);
      if (updateError) console.warn("[contextle] Error resetting user_rate_limits:", updateError.message);
      return false;
    }

    if (limitData.request_count >= maxRequests) {
      return true; // Rate limited!
    }

    const { error: incError } = await adminClient
      .from("user_rate_limits")
      .update({
        request_count: limitData.request_count + 1
      })
      .eq("user_id", userId);
    if (incError) console.warn("[contextle] Error incrementing user_rate_limits:", incError.message);

    return false;
  } catch (err) {
    console.warn("[contextle] DB rate limit check bypassed:", err);
    return false; // Graceful degradation
  }
}

// ── Redact Secret Word (Turn Leaks into Fill-in-the-Blank Clues) ──
function redactSecretWord(story: string, secretWord: string): string {
  // Redact the exact word
  let redacted = story.replace(new RegExp(`\\b${secretWord}\\b`, "gi"), "___");
  // Redact common plural/suffix forms
  redacted = redacted.replace(new RegExp(`\\b${secretWord}s\\b`, "gi"), "___s");
  redacted = redacted.replace(new RegExp(`\\b${secretWord}es\\b`, "gi"), "___es");
  redacted = redacted.replace(new RegExp(`\\b${secretWord}ing\\b`, "gi"), "___ing");
  redacted = redacted.replace(new RegExp(`\\b${secretWord}ed\\b`, "gi"), "___ed");
  return redacted;
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/generate-word - API route to generate a new word
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Verify Supabase session authentication
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ success: false, error: "You must be logged in to play." }, { status: 401 });
  }

  // 2. Fetch user's current level & atomically acquire lock
  const adminClient = await createAdminClient();

  // DB-Backed Rate Limiting Check (Serverless/Edge safe)
  const rateLimited = await checkDbRateLimit(adminClient, user.id);
  if (rateLimited) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a minute before generating another word." },
      { status: 429 }
    );
  }

  // Atomically acquire generation lock
  // Update profiles table, setting active_word to "generating" only if it is currently null
  const { data: lockProfile } = await adminClient
    .from("profiles")
    .update({
      active_word: "generating",
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id)
    .is("active_word", null)
    .select("current_level, active_word, current_story, updated_at");

  let profile = lockProfile && lockProfile.length > 0 ? lockProfile[0] : null;

  if (!profile) {
    // Fetch the profile to see if it is already generating or has a word
    const { data: existingProfile, error: fetchError } = await adminClient
      .from("profiles")
      .select("current_level, active_word, current_story, updated_at")
      .eq("id", user.id)
      .single();

    if (fetchError || !existingProfile) {
      return NextResponse.json({ success: false, error: "Profile not found." }, { status: 404 });
    }

    if (existingProfile.active_word === "generating") {
      const updatedAt = existingProfile.updated_at ? new Date(existingProfile.updated_at).getTime() : 0;
      const lockAgeMs = Date.now() - updatedAt;

      // Break stuck serverless timeout locks older than 2 minutes (120,000ms)
      if (lockAgeMs > 120000) {
        console.warn("[contextle] Auto-breaking stuck serverless lock older than 2 minutes.");
        const { data: breakLockProfile } = await adminClient
          .from("profiles")
          .update({
            active_word: "generating",
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id)
          .select("current_level, active_word, current_story, updated_at");

        if (breakLockProfile && breakLockProfile.length > 0) {
          profile = breakLockProfile[0];
        } else {
          profile = existingProfile;
        }
      } else {
        return NextResponse.json(
          { success: false, error: "A word is already being generated for you. Please wait." },
          { status: 409 }
        );
      }
    }

    // If a word is already generated, return it immediately to resolve the race condition
    if (profile === null && existingProfile.active_word && existingProfile.current_story) {
      try {
        const stories = JSON.parse(existingProfile.current_story);
        return NextResponse.json({ success: true, stories });
      } catch {
        // parsing failed, proceed to generate
      }
    }

    if (!profile) {
      profile = existingProfile;
    }
  }

  let excludeWords: string[] = [];
  let reqLevel: number | null = null;
  try {
    const body = await request.json();
    if (body) {
      if (Array.isArray(body.excludeWords)) {
        excludeWords = body.excludeWords.map((w: unknown) => String(w).trim().toLowerCase()).filter(Boolean);
      }
      if (typeof body.level === "number") {
        reqLevel = Math.round(body.level);
      }
    }
  } catch {
    // Prevent throwing an error if body is empty
  }

  const currentLevel = reqLevel !== null ? reqLevel : profile.current_level;

  // 3. Fetch played words server-side from played_words table (Optimized: limit to last 25)
  let dbPlayedWords: string[] = [];
  try {
    const { data: playedData } = await adminClient
      .from("played_words")
      .select("word")
      .eq("user_id", user.id)
      .order("played_at", { ascending: false })
      .limit(25);
    if (playedData) {
      dbPlayedWords = playedData.map(row => row.word.trim().toLowerCase());
    }
  } catch (err) {
    console.warn("[contextle] played_words table not available (can be created using SQL):", err);
  }

  const allExcluded = Array.from(new Set([...excludeWords, ...dbPlayedWords]));

  // Compact prompt to reduce token count, cost, and latency
  const prompt = `
Generate EXACTLY ONE secret word and exactly 3 clue stories for a Level ${currentLevel} word guessing game.
Your word choice and clue difficulty MUST strictly match the level guidelines below.

Requirements:
* Return ONLY valid raw JSON.
* Do NOT return markdown.
* Do NOT return explanations.
* Do NOT return code fences.
* The response must match this schema exactly:
{
  "word": "<secret_word>",
  "stories": [
    "<clue_1>",
    "<clue_2>",
    "<clue_3>"
  ]
}

Rules:
* The word must be a single lowercase noun.
* The word must contain only letters a-z.
* The word must be between 3 and 20 characters.
* The secret word MUST NOT be any of these previously solved words: [${allExcluded.map(w => `"${w}"`).join(", ")}].
* The stories array must contain exactly 3 strings.
* Each story must be unique.
* Do not include the secret word in any story.
* Write natural, fluent English.
* Use correct spelling and grammar.
* Every story must start with a capital letter.
* Every story must end with punctuation.

Vocabulary Selection Bands:
* LEVELS 1-5: Very common everyday nouns (e.g. apple, chair, clock, garden).
* LEVELS 6-10: Common but less obvious nouns (e.g. harbor, glacier, artifact, compass).
* LEVELS 11-20: Educational, scientific, historical, geographical nouns (e.g. labyrinth, telescope, velocity, catalyst).
* LEVELS 21-35: Advanced concrete nouns (e.g. aqueduct, monastery, observatory, citadel).
* LEVELS 36-50: Difficult concrete nouns (e.g. parchment, reliquary, catacomb, obelisk).
* LEVELS 51-70: Advanced concrete nouns. Rare, university-level vocabulary. Avoid household objects, common animals, or common foods.
* LEVELS 71-90: Scientific and historical nouns. Not commonly used in daily speech.
* LEVELS 91+: Abstract concepts (e.g. serendipity, equilibrium, anomaly, paradox, symmetry).

Clue Difficulty and Strength Scaling:
* LEVELS 1-10: Clue 1 = direct, Clue 2 = moderate, Clue 3 = direct. Use direct descriptions, utility based, physical appearance.
* LEVELS 11-35: Clue 1 = indirect, Clue 2 = indirect, Clue 3 = moderate. Use atmospheric, indirect, contextual clues. Avoid naming associated objects. (Good clue: "Generations have relied upon it as a point of arrival after long and uncertain journeys.")
* LEVELS 36+: All 3 clues MUST be highly indirect. Use narrative, symbolic, historical, abstract, puzzle-like clues. Never reveal purpose, function, location, or obvious associations.

GLOBAL RULES:
* DO NOT reveal the answer.
* DO NOT reveal direct synonyms.
* DO NOT reveal obvious related objects.
* DO NOT reveal famous examples.
* DO NOT reveal defining characteristics.
* DO NOT create clues that instantly identify the answer.
* Generate clues appropriate to the requested level. Higher levels must produce significantly harder words and significantly more indirect clues.

Example of a Good indirect clue: "The passage of time has transformed it from a practical necessity into a symbol of another age." or "It stands as a silent witness to countless arrivals and departures."
Example of a Bad direct clue: "Ships arrive here." or "Fishermen unload their catch here."

Return JSON only.
`.trim();

  try {
    const parsed = await callAIProvider<{ word: string; stories: string[] }>(prompt, "WordGen");
    const cleanWord = parsed.word.trim().toLowerCase();
    
    // Redact AI word leaks instead of rejecting them (saves API quota)
    let stories = (parsed.stories || []).map((s: string) => redactSecretWord(s.trim(), cleanWord)).filter(Boolean);

    const serializedStories = JSON.stringify(stories);

    console.log("[contextle][DB] Saving AI data to profile:", {
      id: user.id,
      active_word: cleanWord,
      stories_count: stories.length
    });

    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        active_word: cleanWord,
        current_story: serializedStories,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[contextle] Failed to save AI generated word to profile:", updateError);
      await adminClient.from("profiles").update({ active_word: null }).eq("id", user.id).eq("active_word", "generating");
      return NextResponse.json(
        { success: false, error: "Failed to start game in database." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      stories,
    });

  } catch (error) {
    // ── TIER 5: EMERGENCY LOCAL FALLBACK (Fallback of last resort if all APIs fail) ──
    console.warn("[contextle] All AI routes failed or keys missing. Using local emergency fallback.", error);
    try {
      return await getFallbackWord(adminClient, user.id, currentLevel, allExcluded);
    } catch {
      // Release lock on final failure
      await adminClient.from("profiles").update({ active_word: null }).eq("id", user.id).eq("active_word", "generating");
      return NextResponse.json(
        { success: false, error: "All generation sources failed." },
        { status: 500 }
      );
    }
  }
}

// ── Emergency Local Word Selection Function ──────────────────────────────────
async function getFallbackWord(
  adminClient: SupabaseClient,
  userId: string,
  level: number,
  excludeWords: string[] = []
): Promise<NextResponse> {
  let list = EASY_PAIRS;
  if (level >= 6 && level <= 15) {
    list = MEDIUM_PAIRS;
  } else if (level > 15) {
    list = HARD_PAIRS;
  }

  let filteredList = list.filter(pair => !excludeWords.includes(pair.word));
  if (filteredList.length === 0) {
    filteredList = list;
  }

  const fallback = filteredList[Math.floor(Math.random() * filteredList.length)];
  const serializedStories = JSON.stringify(fallback.stories);

  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      active_word: fallback.word,
      current_story: serializedStories,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

  if (updateError) {
    console.error("[contextle] Failed to save fallback word/stories to profile:", updateError);
    return NextResponse.json(
      { success: false, error: "Failed to start game in database." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    stories: fallback.stories
  });
}

// Reject all other HTTP methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
