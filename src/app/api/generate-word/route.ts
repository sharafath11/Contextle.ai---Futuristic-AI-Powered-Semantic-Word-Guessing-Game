import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createAdminClient } from "@/utils/supabase/server";

// ── Fallback Vocabularies with 3 Clue Stories (ordered: Clue 1 = Hard, Clue 2 = Medium, Clue 3 = Easy) ──────
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
  },
  { 
    word: 'camera', 
    stories: [
      'It has a shutter that clicks open and closed to expose digital sensors or analog film to light.',
      'Modern versions are built into smartphones, but professionals still use separate bodies with lenses.',
      'It captures light and freezes a split second of time forever, creating a visual photograph.'
    ] 
  },
  { 
    word: 'cactus', 
    stories: [
      'Often found in dry landscapes like Arizona or Mexico, it is a symbol of desert survival.',
      'It stores water inside its thick, fleshy green stem to survive the blistering dry heat.',
      'A desert plant covered in sharp needles that can survive for months without a single drop of rain.'
    ] 
  },
  { 
    word: 'blanket', 
    stories: [
      'Children often drape this over chairs to build magical indoor play forts in the living room.',
      'Often made of wool, fleece, or cotton, it is perfect for wrapping up on a cold winter night.',
      'A soft, thick sheet of fabric you pull over yourself to stay cozy and warm in bed.'
    ] 
  },
  { 
    word: 'bicycle', 
    stories: [
      'You probably fell off it many times while learning to maintain your balance in your childhood.',
      'A classic outdoor transport vehicle that helps children explore their neighborhood without any fuel.',
      'It has two wheels, handlebars, and pedals that you push with your feet to move forward.'
    ] 
  },
  { 
    word: 'clock', 
    stories: [
      'It hangs on classroom or office walls, reminding everyone of the passing hours.',
      'Historically powered by mechanical gears and weights, modern versions use quartz crystals.',
      'It has two hands that spin in a circle, constantly ticking to let you know what time it is.'
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
  },
  { 
    word: 'mystery', 
    stories: [
      'It is a popular genre of literature and film featuring investigators, clues, and hidden plots.',
      'Something that is secret, unexplained, or unknown, prompting detectives or curious minds to solve it.',
      'A puzzle that keeps you guessing until the final resolution reveals the truth.'
    ] 
  },
  { 
    word: 'pyramid', 
    stories: [
      'Its shape has a square base and four sloping triangular sides meeting at a point at the top.',
      'The most famous examples stand in Giza, built with millions of heavy limestone blocks.',
      'A giant triangular stone monument built by ancient civilizations as a tomb for their rulers.'
    ] 
  },
  { 
    word: 'fossil', 
    stories: [
      'Examples include dinosaur bones, ancient shells, or insect imprints trapped in amber.',
      'These petrified remnants help scientists study dinosaurs and map out the history of life on Earth.',
      'The preserved remains or traces of a prehistoric animal or plant embedded in ancient rock.'
    ] 
  },
  { 
    word: 'telescope', 
    stories: [
      'It collects distant starlight, revealing details invisible to the naked human eye.',
      'Famous space-based versions like Hubble and James Webb capture high-resolution images of outer space.',
      'A long tube with mirrors and lenses that magnifies light, allowing astronomers to see distant stars.'
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
  },
  { 
    word: 'nostalgia', 
    stories: [
      'It originally was considered a medical disease or severe homesickness suffered by soldiers in foreign lands.',
      'A sentimental yearning to return to a happier time, place, or period in one\'s life.',
      'A bitter-sweet, warm feeling of longing for the past, often triggered by an old song or childhood memory.'
    ] 
  },
  { 
    word: 'harmony', 
    stories: [
      'It represents a state of balance and unity among people, ideas, or elements of a design.',
      'In music, it provides the backing chords that complement and enrich the main vocal melody.',
      'A state of peaceful agreement, or the pleasing combination of different musical notes played together.'
    ] 
  },
  { 
    word: 'silhouette', 
    stories: [
      'Originally named after an 18th-century French minister, it is a style of portrait cut from black card.',
      'Typically seen at sunset, it shows shape and form without displaying any surface details.',
      'A dark outline or shadow of a person or object, visible against a bright, glowing background.'
    ] 
  },
  { 
    word: 'serendipity', 
    stories: [
      'A delightful word that combines luck, timing, and unplanned discovery.',
      'It describes how penicillin, microwave ovens, and sticky notes were discovered accidentally.',
      'The beautiful occurrence of finding valuable or agreeable things by pure chance or happy accident.'
    ] 
  },
  { 
    word: 'equilibrium', 
    stories: [
      'The inner ear contains organs that help humans maintain this physical state while moving.',
      'In chemistry, it describes the state where forward and reverse reactions occur at equal rates.',
      'A state of perfect balance where opposing forces cancel each other out, leaving everything stable.'
    ] 
  }
];

// ── Sanitize: strip non-alpha characters, trim, lowercase ────────────────────
function sanitizeWord(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z]/g, "");
}

// ── Validate: only single words containing only a-z ─────────────────────────
function isValidWord(word: string): boolean {
  return /^[a-z]{3,20}$/.test(word);
}

// ── Clean and sanitize story text from common AI artifacts ───────────────────
function sanitizeStoryText(text: string): string {
  if (!text) return text;

  // Fix merged prefix helper
  let cleaned = text.replace(/\b(A|In|The|It|Is)([a-z]+)\b/g, (match, prefix, suffix) => {
    const lowerWord = match.toLowerCase();
    // Exclude common valid words to prevent false positives
    const exclusions = new Set([
      "their", "them", "then", "there", "these", "they", "theme", "theory", "theatre", "thermal", "therapy",
      "into", "inside", "instead", "instant", "industry", "infant", "insect", "insert", "instruct", "instrument",
      "its", "itself", "italy", "item", "island", "issue", "isn't", "isnt",
      "an", "as", "at", "all", "are", "about", "above", "after", "against", "along", "among", "around", "always",
      "another", "answer", "any", "apply", "apple", "agent", "action", "animal", "author", "art", "area", "arm", "arrive"
    ]);
    
    if (exclusions.has(lowerWord)) {
      return match;
    }
    
    // Otherwise, split them
    return `${prefix} ${suffix}`;
  });

  // Handle specific typos/merges
  cleaned = cleaned.replace(/\baboveethe\b/gi, "above the");
  cleaned = cleaned.replace(/\babovethe\b/gi, "above the");
  cleaned = cleaned.replace(/\b(to|in|on|for|with|of|and|is|at|from|by)the\b/gi, "$1 the");

  // Fix repeated trailing characters on common words
  cleaned = cleaned.replace(/\b(would)d+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(could)d+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(should)d+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(shadow)w+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(and)d+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(from)m+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(with)h+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(that)t+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(this)s+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(they)y+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(their)r+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(there)e+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(for)r+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(it)t+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(is)s+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(here)e+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(what)t+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(when)n+\b/gi, "$1");
  cleaned = cleaned.replace(/\b(where)e+\b/gi, "$1");

  return cleaned;
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
CRITICAL: Avoid token merging. Ensure proper spacing between words. Never merge articles or prepositions with neighboring nouns (e.g., do NOT output 'Amusician', 'Afuturistic', or 'aboveethe'). Check your output sentence by sentence.

3. VARIETY:
Rotate between different storytelling genres (e.g., Noir Detective, Cyberpunk Mystery, Space Exploration, Ancient Fantasy) so the game feels fresh every time. Select one specific genre (such as Noir Detective, Cyberpunk Mystery, Space Exploration, Ancient Fantasy, Steampunk Adventure, Gothic Horror, or Mythological Tale) and write all 3 clue stories in the style of that genre.

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
3. The "stories" must be an array of exactly 3 distinct clue stories or descriptions (each 1-2 sentences) that describe or strongly relate to the secret word, written in the style of the chosen genre and arranged in descending difficulty (from hard/broad to easy/specific):
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

  // ── 3. Generate word & clue stories using Gemini API ────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[contextle] GEMINI_API_KEY is not set. Falling back to Groq / local words.");
  }

  try {
    if (!apiKey) {
      throw new Error("No Gemini API key available.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();

    // Clean up potential code block markers
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
    const stories = (parsed.stories || [])
      .map((s: string) => sanitizeStoryText(s.trim()))
      .filter(Boolean);

    if (!isValidWord(cleanWord) || stories.length !== 3) {
      throw new Error("Sanity checks failed for generated pair");
    }

    // Serialize stories array as a JSON string to fit in TEXT column
    const serializedStories = JSON.stringify(stories);

    // ── 4. Save both the active word and serialized clue stories in database ─
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
    
    const groqApiKey = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
    if (!groqApiKey) {
      console.warn("[contextle] GROQ_API_KEY/GROK_API_KEY is not set. Falling back to local vocabulary.");
      return getFallbackWord(adminClient, user.id, currentLevel, excludeWords);
    }

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
      const stories = (parsed.stories || [])
        .map((s: string) => sanitizeStoryText(s.trim()))
        .filter(Boolean);

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
      console.warn("[contextle] Groq backup generation failed. Falling back to local vocabulary. Details:", groqError);
      return getFallbackWord(adminClient, user.id, currentLevel, excludeWords);
    }
  }
}

// ── Helper to pick and save a static fallback word/stories pair ──────────────
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
