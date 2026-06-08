import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/utils/supabase/server";

import { EASY_PAIRS, MEDIUM_PAIRS, HARD_PAIRS } from "@/lib/fallbackData";

// Only used to clean the secret word for the database (stories are untouched)
function sanitizeWord(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function isValidWord(word: string): boolean {
  return /^[a-z]{3,20}$/.test(word);
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

  // 2. Fetch user's current level from Supabase
  const adminClient = await createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("current_level")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ success: false, error: "Profile not found." }, { status: 404 });
  }

  const currentLevel = reqLevel !== null ? reqLevel : profile.current_level;

  // Compact prompt to reduce token count, cost, and latency
  const prompt = `
Generate one secret guessable noun and exactly 3 related clue stories/descriptions for Level ${currentLevel} in an AI word game.

STRICT QUALITY CONSTRAINTS:
1. ANTI-REPETITION: Do NOT generate any of the following solved words: [${excludeWords.map(w => `"${w}"`).join(", ")}].
2. PERFECT SPELLING & GRAMMAR: Use flawless spelling and spacing. NEVER merge words/articles (e.g. write "A musician", "In a world", NOT "Amusician", "Inaworld").
3. VARIETY: Select one genre (e.g. Noir Detective, Cyberpunk Mystery, Space Exploration, Ancient Fantasy, Steampunk, Gothic Horror) and write all 3 clues in that style.
4. LEVEL DIFFICULTY SCALING & CONSISTENCY:
- Level 1-5 (Easy): Secret Word must be a simple everyday noun. Clue Stories must be straightforward, direct descriptions of utility or appearance (no cryptic metaphors).
- Level 6-15 (Medium): Moderately challenging noun (e.g., glacier, fossil, silhouette). Clue Stories must be cryptic and atmospheric, requiring logical deduction.
- Level 16+ (Hard): Intriguing, semantically rich noun (e.g., paradox, nostalgia, equilibrium, symmetry). Clue Stories must be highly enigmatic, abstract, and puzzle-like, but still contain sufficient semantic clues so that the player can logically deduce the word. No obvious giveaways.

Requirements:
1. Return ONLY raw JSON matching this schema:
{
  "word": "<secret_word_lowercase>",
  "stories": [
    "<clue_story_1>",
    "<clue_story_2>",
    "<clue_story_3>"
  ]
}
2. The "word" must be a single, common noun, all lowercase, between 3 to 20 letters.
3. The "stories" must be an array of EXACTLY 3 distinct clue stories. None of them must contain the secret word or its direct synonyms.
`.trim();

  const apiKey = process.env.GEMINI_API_KEY;

  // ── TIER 1: GOOGLE GEMINI (Primary API) ──────────────────────────────────
  if (apiKey) {
    try {
      console.log("[contextle] Tier 1: Trying Direct Gemini SDK...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: {
          temperature: 0.7, // Lower temperature helps prevent spelling mistakes
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
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
      const stories = (parsed.stories || []).map((s: string) => s.trim()).filter(Boolean);

      // Verify AI didn't leak/cheat the secret word inside the stories
      const hasCheat = stories.some(s => s.toLowerCase().includes(cleanWord));

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
      console.warn("[contextle] Gemini generation failed. Trying Tier 2 Groq API. Details:", error);
    }
  }

  // ── TIER 2: GROQ API (Secondary API) ──────────────────────────────────────
  const groqApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
  if (groqApiKey) {
    try {
      console.log("[contextle] Tier 2: Fetching from Groq API...");
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
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" },
        }),
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
      const stories = (parsed.stories || []).map((s: string) => s.trim()).filter(Boolean);

      // Verify AI didn't leak/cheat the secret word inside the stories
      const hasCheat = stories.some(s => s.toLowerCase().includes(cleanWord));

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
      console.warn("[contextle] Groq backup generation failed. Details:", groqError);
    }
  }

  // ── TIER 3: EMERGENCY LOCAL FALLBACK (Fallback of last resort if all APIs fail) ──
  console.warn("[contextle] All AI routes failed or keys missing. Using local emergency fallback.");
  return getFallbackWord(adminClient, user.id, currentLevel, excludeWords);
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
