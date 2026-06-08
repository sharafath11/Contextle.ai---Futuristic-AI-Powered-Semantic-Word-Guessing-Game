import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/utils/supabase/server";

// ── Emergency Local Back-up Words (Only used if all AI generation fails) ──
const EASY_PAIRS = [
  { 
    word: 'apple', 
    stories: [
      'According to popular legend, one of these falling from a tree inspired Isaac Newton\'s theory of gravity.',
      'A crisp, sweet fruit often used to bake delicious warm pies or pressed into fresh autumn cider.',
      'It grows on trees, comes in red, green, or yellow, and is said to keep the doctor away when eaten daily.'
    ] 
  },
  { 
    word: 'guitar', 
    stories: [
      'It has a long wooden neck with frets where you press your fingers to alter the pitch of the strings.',
      'Often played around campfires, it can be strummed to accompany singing and acoustic melodies.',
      'This acoustic instrument has six strings and a hollow wooden body that makes music when plucked.'
    ] 
  },
  { 
    word: 'ocean', 
    stories: [
      'Its waves crash against sandy shores, attracting surfers and beachgoers worldwide.',
      'It is home to coral reefs, sharks, whales, and billions of other marine organisms.',
      'A vast body of salty water that covers most of our planet and is governed by the lunar tides.'
    ] 
  }
];

const MEDIUM_PAIRS = [
  { 
    word: 'glacier', 
    stories: [
      'Massive chunks of ice calve off the edges of this structure, crashing dramatically into the sea.',
      'It contains the largest reservoir of fresh water on Earth and is highly sensitive to climate shifts.',
      'A colossal, slow-moving river of ancient ice that carves valleys out of mountains over thousands of years.'
    ] 
  },
  { 
    word: 'gravity', 
    stories: [
      'Einstein described it as a curvature of spacetime caused by mass and energy.',
      'The strength of this force depends on the mass of the object; it is much stronger on Jupiter than on Mars.',
      'The invisible pulling force that prevents us from floating away into space and holds the moon in its orbit.'
    ] 
  }
];

const HARD_PAIRS = [
  { 
    word: 'paradox', 
    stories: [
      'A puzzle of reasoning where premises that seem true lead to a self-contradictory conclusion.',
      'The grandfather version describes the logical impossibility of going back in time to change history.',
      'A statement that contradicts itself, yet holds a deeper truth that makes logical sense upon examination.'
    ] 
  }
];

// Only used to clean the secret word for the database (stories are untouched)
function sanitizeWord(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z]/g, "");
}

function isValidWord(word: string): boolean {
  return /^[a-z]{3,20}$/.test(word);
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/generate-word
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
    // Body empty
  }

  // 2. Fetch user's current level
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

  // System prompt requiring JSON response with flawless spelling and grammar
  const prompt = `
You are generating content for an AI word-guessing game.
Task: Generate one secret guessable noun and 3 related clue stories/descriptions for Level ${currentLevel}.

STRICT QUALITY CONSTRAINTS:

1. ANTI-REPETITION:
You MUST generate a highly unique, unpredictable secret word and story every single time.
${excludeWords.length > 0 ? `Additionally, you MUST NOT generate any of the following previously used/solved words:\n[${excludeWords.map(w => `"${w}"`).join(", ")}]` : ""}

2. PERFECT SPELLING & GRAMMAR:
You are an elite English novelist. Write with absolutely flawless spelling, punctuation, and proper word spacing. Never merge articles or prepositions with neighboring nouns (e.g., write "A musician" instead of "Amusician", "In a world" instead of "Inaworld", "It is" instead of "Itis"). Double-check your output before returning.

3. VARIETY:
Select one specific genre (such as Noir Detective, Cyberpunk Mystery, Space Exploration, Ancient Fantasy, Steampunk Adventure, Gothic Horror, or Mythological Tale) and write all 3 clue stories in the style of that genre.

4. LEVEL-WISE DIFFICULTY SCALING:
- Level 1-5 (Easy): Common everyday nouns. Very obvious clues describing physical appearance or utility.
- Level 6-15 (Medium): Moderately challenging nouns (e.g., "glacier", "gravity", "fossil", "silhouette"). Cryptic, atmospheric clues.
- Level 16+ (Hard): Complex or deeply semantic nouns (e.g., "paradox", "nostalgia", "serendipity", "equilibrium"). Enigmatic clues requiring lateral thinking.

Requirements:
1. Return ONLY a valid raw JSON object. Do not include markdown code fences, explanations, or extra text.
2. The "word" must be a single, common noun, all lowercase, between 3 to 20 letters.
3. The "stories" must be an array of EXACTLY 3 distinct clue stories ordered from hard/broad (index 0) to easy/specific (index 2). None of them must contain the secret word or its direct synonyms.

{
  "word": "<the_secret_word>",
  "stories": [
    "<hard_clue_story>",
    "<medium_clue_story>",
    "<easy_clue_story>"
  ]
}
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
          temperature: 0.7, // Lower temperature helps prevent AI typos
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

      if (!isValidWord(cleanWord) || stories.length !== 3) {
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

      if (!isValidWord(cleanWord) || stories.length !== 3) {
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
