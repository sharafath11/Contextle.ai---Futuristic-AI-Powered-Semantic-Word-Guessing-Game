import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import { EASY_PAIRS, MEDIUM_PAIRS, HARD_PAIRS } from "@/lib/fallbackData";

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

// Trim and lowercase the raw AI word (no aggressive regex replacement to prevent corruptions)
function sanitizeWord(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidWord(word: string): boolean {
  return /^[a-z]{3,20}$/.test(word);
}

// ── Precise Secret Word Leak Detection ──
function doesStoryLeakSecretWord(story: string, secretWord: string): boolean {
  const cleanStory = story.toLowerCase().replace(/[^a-z\s]/g, " ");
  const storyWords = cleanStory.split(/\s+/).filter(Boolean);

  const suffixes = [
    "s", "es", "d", "ed", "ing", "ings", "er", "ers", "est",
    "y", "ly", "ist", "ists", "ism", "ness", "able", "ible"
  ];

  for (const word of storyWords) {
    if (word === secretWord) return true;

    // Check secretWord + suffix (e.g. guitar -> guitarist)
    for (const suffix of suffixes) {
      if (word === secretWord + suffix) return true;
    }

    // Check word + suffix (e.g. paintings -> paint)
    for (const suffix of suffixes) {
      if (secretWord === word + suffix) return true;
    }
  }
  return false;
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
Generate one secret guessable noun and exactly 3 clue stories for a Level ${currentLevel} word guessing game.

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

Level Difficulty Scaling:
* Level 1-5 (Easy): Simple everyday noun. Direct descriptions of utility or appearance.
* Level 6-15 (Medium): Moderately challenging noun. Cryptic and atmospheric clues.
* Level 16+ (Hard): Challenging but concrete noun. Atmospheric, cryptic, and puzzle-like clues.

Return JSON only.
`.trim();

  const apiKey = process.env.GEMINI_API_KEY;

  // ── TIER 1: GOOGLE GEMINI (Primary API with Retry Logic) ──────────────────
  if (apiKey) {
    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      try {
        console.log(`[contextle] Tier 1: Trying Direct Gemini SDK (Attempt ${attempts + 1})...`);
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
          systemInstruction: `You are a JSON API.
Return only valid JSON.
Never return markdown.
Never return explanations.
Never return code fences.`,
        });

        // Set request options: timeout after 8000ms
        const result = await model.generateContent(prompt, { timeout: 8000 });
        const rawText = result.response.text().trim();

        const jsonText = rawText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "");

        let parsed: { word: string; stories: string[] };
        try {
          parsed = JSON.parse(jsonText);
        } catch {
          throw new Error("Gemini returned invalid JSON: " + rawText);
        }

        const cleanWord = sanitizeWord(parsed.word);
        let stories = (parsed.stories || []).map((s: string) => s.trim()).filter(Boolean);

        // Verify AI didn't leak/cheat the secret word inside the stories
        const hasCheat = stories.some(s => doesStoryLeakSecretWord(s, cleanWord));

        if (!isValidWord(cleanWord) || stories.length !== 3 || hasCheat) {
          throw new Error("Sanity checks failed for generated pair");
        }

        const serializedStories = JSON.stringify(stories);

        const { error: updateError } = await adminClient
          .from("profiles")
          .update({
            active_word: cleanWord,
            current_story: serializedStories,
            updated_at: new Date().toISOString()
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("[contextle] Failed to save word/stories to profile:", updateError);
          // Release lock before returning
          await adminClient.from("profiles").update({ active_word: null }).eq("id", user.id).eq("active_word", "generating");
          return NextResponse.json(
            { success: false, error: "Failed to start game in database." },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          stories
        });

      } catch (error) {
        attempts++;
        console.warn(`[contextle] Gemini attempt ${attempts} failed.`, error);
      }
    }
  }

  // ── TIER 2: GROQ API (Secondary API with Retry Logic) ─────────────────────
  const groqApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (groqApiKey) {
    let attempts = 0;
    const maxAttempts = 2;
    while (attempts < maxAttempts) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second request timeout

      try {
        console.log(`[contextle] Tier 2: Fetching from Groq API (Attempt ${attempts + 1})...`);
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "system",
                content: "You are generating content for an AI word-guessing game. Return ONLY a valid raw JSON object matching the requested schema. Never return markdown blocks, explanations, or code fences."
              },
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Groq API returned status ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.choices?.[0]?.message?.content?.trim();

        if (!rawText) {
          throw new Error("Groq API returned empty content.");
        }

        const jsonText = rawText
          .replace(/^```(?:json)?\s*/i, "")
          .replace(/\s*```$/, "");

        const parsed: { word: string; stories: string[] } = JSON.parse(jsonText);

        const cleanWord = sanitizeWord(parsed.word);
        let stories = (parsed.stories || []).map((s: string) => s.trim()).filter(Boolean);

        // Verify AI didn't leak/cheat the secret word inside the stories
        const hasCheat = stories.some(s => doesStoryLeakSecretWord(s, cleanWord));

        if (!isValidWord(cleanWord) || stories.length !== 3 || hasCheat) {
          throw new Error("Sanity checks failed for Groq generated pair.");
        }

        const serializedStories = JSON.stringify(stories);

        const { error: updateError } = await adminClient
          .from("profiles")
          .update({
            active_word: cleanWord,
            current_story: serializedStories,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("[contextle] Failed to save Groq generated word to profile:", updateError);
          // Release lock before returning
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

      } catch (groqError) {
        attempts++;
        console.warn(`[contextle] Groq attempt ${attempts} failed.`, groqError);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // ── TIER 3: EMERGENCY LOCAL FALLBACK (Fallback of last resort if all APIs fail) ──
  console.warn("[contextle] All AI routes failed or keys missing. Using local emergency fallback.");
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
