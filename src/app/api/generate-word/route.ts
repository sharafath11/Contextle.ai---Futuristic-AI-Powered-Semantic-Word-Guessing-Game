import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient, createAdminClient } from "@/utils/supabase/server";

// ── Sanitize: strip non-alpha characters, trim, lowercase ────────────────────
function sanitizeWord(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z]/g, "");
}

// ── Validate: only single words containing only a-z ─────────────────────────
function isValidWord(word: string): boolean {
  return /^[a-z]{3,20}$/.test(word);
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/generate-word
// ─────────────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Authenticate — verify active Supabase session ───────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "You must be logged in to play." },
      { status: 401 }
    );
  }

  // Parse excludeWords and level from request body if available
  let excludeWords: string[] = [];
  let reqLevel: number | null = null;
  try {
    const body = await request.json();
    if (body) {
      if (Array.isArray(body.excludeWords)) {
        excludeWords = body.excludeWords
          .map((w: unknown) => String(w).trim().toLowerCase())
          .filter(Boolean);
      }
      if (typeof body.level === "number") {
        reqLevel = Math.round(body.level);
      }
    }
  } catch {
    // Body is empty or malformed
  }

  // ── 2. Fetch user's current level ──────────────────────────────────────────
  const adminClient = await createAdminClient();
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("current_level")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[contextle] Failed to fetch profile:", profileError);
    return NextResponse.json(
      { success: false, error: "Profile not found. Please re-login." },
      { status: 404 }
    );
  }

  const currentLevel = reqLevel !== null ? reqLevel : profile.current_level;

  const prompt = `
You are generating content for an AI word-guessing game.
Task: Generate one secret guessable noun and 3 related clue stories/descriptions for Level ${currentLevel}.

STRICT QUALITY CONSTRAINTS:

1. ANTI-REPETITION:
You MUST generate a highly unique, unpredictable secret word and story every single time. Avoid generic words like "apple", "key", "car" and instead use deeply engaging, rich context words.
${excludeWords.length > 0 ? `Additionally, you MUST NOT generate any of the following previously used/solved words:\n[${excludeWords.map(w => `"${w}"`).join(", ")}]` : ""}

2. PERFECT SPELLING & GRAMMAR:
You are an elite English novelist. Before returning the JSON, you MUST double-check the 'story' and 'clues' fields for typos, broken English, or spelling mistakes. All words must be spelled perfectly according to standard English dictionaries.
(Note: In the JSON response schema below, these correspond to the items within the "stories" array.)

3. VARIETY (CYBERPUNK THEME):
Rotate between different cyberpunk-themed storytelling sub-genres or settings (e.g., Neon Street Hustle, Rogue AI Core, Megacorporation Boardroom, Biotech Laboratory, Hacker Grid Space, Wasteland Outpost) so the game feels fresh every time. Select one specific cyberpunk setting and write all 3 clue stories in that style.

4. LEVEL-WISE DIFFICULTY SCALING:
The generation MUST strictly scale in difficulty based on the current level (Level ${currentLevel}):
- If Level is 1-5 (Easy):
  * Secret Word: Common, everyday secret words (but avoid overused ones like "apple", "key", "car").
  * Clue Stories: Very obvious, clear, helpful stories/clues describing physical appearance or straightforward utility.
- If Level is 6-15 (Medium):
  * Secret Word: Moderately challenging words (e.g., slightly more abstract, natural, or technical nouns like "glacier", "gravity", "fossil", "silhouette", "lighthouse").
  * Clue Stories: Slightly cryptic, atmospheric mystery stories that require some deductive reasoning.
- If Level is 16+ (Hard):
  * Secret Word: Complex, rare, or deeply semantic words (e.g., advanced abstract concepts or philosophical terms like "paradox", "nostalgia", "serendipity", "equilibrium", "harmony", "mirage").
  * Clue Stories: Highly enigmatic, challenging clues that require intense lateral thinking.

Requirements:
1. The response must be a valid raw JSON object matching the schema below.
2. The "word" must be a single, common noun, all lowercase, between 3 to 20 letters.
3. The "stories" must be an array of exactly 3 distinct clue stories or descriptions (each 1-2 sentences) that describe or strongly relate to the secret word, written in the style of the chosen genre/setting and arranged in descending difficulty (from hard/broad to easy/specific):
   - Clue 1 (index 0): The hardest clue. Very broad, abstract, or indirect description.
   - Clue 2 (index 1): Medium difficulty. Includes some specific features, utility, or context.
   - Clue 3 (index 2): The easiest clue. An obvious, common association, or direct physical description that makes it very easy to understand/guess.
4. STRICT RULE: None of the stories must EVER contain the secret word itself or any of its direct synonyms.

Return ONLY a valid JSON object matching this schema. Do not include markdown code fences, explanation, or extra text.

{
  "word": "<the_secret_word>",
  "stories": [
    "<hard_clue_story>",
    "<medium_clue_story>",
    "<easy_clue_story>"
  ]
}
  `.trim();

  let cleanWord = "";
  let stories: string[] = [];
  let methodUsed = "";

  // ── TIER 1: OpenRouter API ─────────────────────────────────────────────────
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (openRouterApiKey) {
    try {
      console.log("[contextle] Tier 1: Trying OpenRouter...");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterApiKey}`,
          "HTTP-Referer": "https://contextle.ai",
          "X-Title": "Contextle AI"
        },
        body: JSON.stringify({
          models: [
            "google/gemini-flash-1.5-free",
            "meta-llama/llama-3-8b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "microsoft/phi-3-medium-128k-instruct:free",
            "qwen/qwen-2-7b-instruct:free"
          ],
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter status: ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content?.trim();
      if (!rawText) {
        throw new Error("OpenRouter returned empty content");
      }

      const jsonText = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

      const parsed = JSON.parse(jsonText);
      const parsedWord = sanitizeWord(parsed.word);
      const parsedStories = (parsed.stories || []).map((s: string) => s.trim()).filter(Boolean);

      if (isValidWord(parsedWord) && parsedStories.length >= 2) {
        cleanWord = parsedWord;
        stories = parsedStories;
        methodUsed = "OpenRouter";
      } else {
        throw new Error("Sanity checks failed for OpenRouter output");
      }
    } catch (err) {
      console.warn("[contextle] Tier 1: OpenRouter failed. Details:", err);
    }
  } else {
    console.log("[contextle] Tier 1: OpenRouter API key not set, skipping.");
  }

  // ── TIER 2: Direct Gemini API (Fallback) ───────────────────────────────────
  if (!cleanWord && process.env.GEMINI_API_KEY) {
    try {
      console.log("[contextle] Tier 2: Trying Direct Gemini SDK...");
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 1.0,
          responseMimeType: "application/json",
        },
      });

      const result = await model.generateContent(prompt);
      const rawText = result.response.text().trim();
      if (!rawText) {
        throw new Error("Direct Gemini returned empty content");
      }

      const jsonText = rawText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "");

      const parsed = JSON.parse(jsonText);
      const parsedWord = sanitizeWord(parsed.word);
      const parsedStories = (parsed.stories || []).map((s: string) => s.trim()).filter(Boolean);

      if (isValidWord(parsedWord) && parsedStories.length >= 2) {
        cleanWord = parsedWord;
        stories = parsedStories;
        methodUsed = "Direct Gemini SDK";
      } else {
        throw new Error("Sanity checks failed for Direct Gemini output");
      }
    } catch (err) {
      console.error("[contextle] Tier 2: Direct Gemini SDK failed. Details:", err);
    }
  }

  // ── TIER 3: Local Emergency Fallback ───────────────────────────────────────
  if (!cleanWord) {
    console.warn("[contextle] Tier 3: Both Tier 1 and Tier 2 failed. Falling back to local emergency word.");
    return useFallbackWord(adminClient, user.id, currentLevel);
  }

  console.log(`[contextle] Successfully generated word using ${methodUsed}`);

  // Serialize stories array as a JSON string to fit in TEXT column
  const serializedStories = JSON.stringify(stories);

  // ── Save both the active word and serialized clue stories in database ─
  const { error: updateError } = await adminClient
    .from("profiles")
    .update({
      active_word: cleanWord,
      current_story: serializedStories,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("[contextle] Failed to save generated word to profile:", updateError);
    return NextResponse.json(
      { success: false, error: "Failed to start game in database." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    stories
  });
}

// ── Helper to save and return a static emergency fallback word/stories pair ──
async function useFallbackWord(
  adminClient: any,
  userId: string,
  level: number
): Promise<NextResponse> {
  let stories: string[] = [];
  
  if (level <= 5) {
    // Easy clues
    stories = [
      "A futuristic prefix related to virtual reality, computers, and online networks.",
      "A term used in sci-fi for cool technology, robots, and cyberspace.",
      "It is the first half of the word 'cyberpunk' and relates to internet safety."
    ];
  } else if (level <= 15) {
    // Medium clues
    stories = [
      "An underground hacking network operating in the digital shadows of a high-tech city.",
      "A prefix meaning computer-controlled or virtual, often paired with spaces, crimes, or security.",
      "Short term for the digital landscape where data highways connect rogue interfaces."
    ];
  } else {
    // Hard clues
    stories = [
      "A futuristic design concept representing the fusion of organic life with synthetic network protocols.",
      "An evocative root word originating from cybernetics, denoting control systems and information grids.",
      "A semantic marker of dystopian hacker subcultures battling corporatized data streams."
    ];
  }

  const fallback = {
    word: "cyber",
    stories
  };

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
