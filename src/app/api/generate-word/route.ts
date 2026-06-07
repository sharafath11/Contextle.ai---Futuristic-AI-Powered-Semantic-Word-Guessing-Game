import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
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

  const currentLevel = profile.current_level;

  // ── 3. Generate word & clue stories using Gemini API ────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[contextle] GEMINI_API_KEY is not set. Falling back to local words.");
    return useFallbackWord(adminClient, user.id, currentLevel);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are generating content for an AI word-guessing game.
Task: Generate one secret guessable noun and 3 related clue stories/descriptions for Level ${currentLevel}.

Requirements:
1. The response must be a valid raw JSON object matching the schema below.
2. The "word" must be a single, common noun, all lowercase, between 3 to 20 letters.
3. The "stories" must be an array of exactly 3 distinct clue stories or descriptions (each 1-2 sentences) that describe or strongly relate to the secret word, arranged in descending difficulty (from hard/broad to easy/specific):
   - Clue 1 (index 0): The hardest clue. Very broad, abstract, or indirect description.
   - Clue 2 (index 1): Medium difficulty. Includes some specific features, utility, or context.
   - Clue 3 (index 2): The easiest clue. An obvious, common association, or direct physical description that makes it very easy to understand/guess.
4. STRICT RULE: None of the stories must EVER contain the secret word itself or any of its direct synonyms.
5. Difficulty guidelines for the secret word itself:
   - Levels 1-5: Very simple, everyday physical objects (e.g., "apple", "guitar", "ocean").
   - Levels 6-15: Slightly more abstract or less common nouns (e.g., "glacier", "gravity", "mystery").
   - Levels 16+: Abstract, conceptual, or challenging nouns (e.g., "paradox", "nostalgia", "harmony").

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
      console.error("[contextle] Gemini returned invalid JSON:", rawText);
      return useFallbackWord(adminClient, user.id, currentLevel);
    }

    const cleanWord = sanitizeWord(parsed.word);
    const stories = (parsed.stories || []).map(s => s.trim()).filter(Boolean);

    if (!isValidWord(cleanWord) || stories.length < 2) {
      console.error("[contextle] Sanity checks failed for generated pair:", parsed);
      return useFallbackWord(adminClient, user.id, currentLevel);
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
    console.warn("[contextle] Gemini generation failed. Falling back to local vocabulary. Details:", error);
    return useFallbackWord(adminClient, user.id, currentLevel);
  }
}

// ── Helper to pick and save a static fallback word/stories pair ──────────────
async function useFallbackWord(adminClient: any, userId: string, level: number): Promise<NextResponse> {
  let list = EASY_PAIRS;
  if (level >= 6 && level <= 15) {
    list = MEDIUM_PAIRS;
  } else if (level > 15) {
    list = HARD_PAIRS;
  }

  const fallback = list[Math.floor(Math.random() * list.length)];
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
