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
  },
  {
    word: 'mountain',
    stories: [
      'A massive landform that rises high above its surroundings, often having a steep slope and a peak.',
      'Climbers challenge themselves to reach its summit, wearing specialized gear to survive the thin air.',
      'A giant peak of rock and earth, often covered in snow at the top, towering over valleys.'
    ]
  },
  {
    word: 'camera',
    stories: [
      'A device used to capture moments in time, freezing them into visual records.',
      'It uses a lens to focus light onto a digital sensor or a strip of chemical film.',
      'You press a button on this device to take a photograph or record a video.'
    ]
  },
  {
    word: 'bicycle',
    stories: [
      'A lightweight vehicle with two wheels placed one behind the other.',
      'It is powered entirely by the rider turning pedals with their feet.',
      'You steer it using handlebars and balance on it to ride down streets or paths.'
    ]
  },
  {
    word: 'umbrella',
    stories: [
      'A folding canopy of fabric on a metal frame, supported by a central rod.',
      'It is carried in the hand to protect against rain or hot sunlight.',
      'You pop it open when the sky turns gray to keep yourself dry while walking.'
    ]
  },
  {
    word: 'clock',
    stories: [
      'A device that measures and displays the passage of hours and minutes.',
      'It has a face with rotating hands, or a digital screen showing numbers.',
      'It hangs on walls or sits on nightstands, ticking away the seconds of the day.'
    ]
  },
  {
    word: 'telephone',
    stories: [
      'An electronic device used to talk to people who are far away.',
      'It has a screen, a microphone, and a speaker, and connects to wireless networks.',
      'You use it to make calls, send text messages, or browse the internet from your pocket.'
    ]
  },
  {
    word: 'window',
    stories: [
      'An opening in a wall or vehicle, fitted with glass in a frame.',
      'It allows light and fresh air to enter a room while keeping the weather out.',
      'You look through it to see what is happening outside without leaving the house.'
    ]
  },
  {
    word: 'garden',
    stories: [
      'A planned space outdoors set aside for the cultivation of plants.',
      'It is filled with soil, blooming flowers, fresh vegetables, and buzzing insects.',
      'A peaceful green area behind a house where plants are watered and tended.'
    ]
  },
  {
    word: 'library',
    stories: [
      'A building or room containing collections of books for reading or borrowing.',
      'It is a quiet place designed for study, research, and quiet contemplation.',
      'A place where shelves are filled with stories, knowledge, and history.'
    ]
  },
  {
    word: 'kitchen',
    stories: [
      'A room or area where food is prepared and cooked.',
      'It typically contains a stove, an oven, a refrigerator, and a sink.',
      'The heart of the home where meals are made and delicious smells originate.'
    ]
  },
  {
    word: 'pocket',
    stories: [
      'A small bag-like patch sewn into or onto a garment for carrying small items.',
      'It is the perfect size for holding keys, coins, or a smartphone.',
      'A convenient storage pouch built directly into your trousers or jacket.'
    ]
  },
  {
    word: 'blanket',
    stories: [
      'A large piece of soft fabric, typically used for warmth.',
      'It is spread over a bed or wrapped around a person sitting on a sofa.',
      'A cozy cover that keeps you warm and snug while sleeping on a cold night.'
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
    word: 'fossil',
    stories: [
      'The preserved remains or impressions of prehistoric organisms embedded in rock.',
      'Paleontologists dig deep into the earth to find these relics of ancient life.',
      'A petrified bone, shell, or leaf imprint that tells the story of life millions of years ago.'
    ]
  },
  {
    word: 'silhouette',
    stories: [
      'The dark shape and outline of someone or something visible against a brighter background.',
      'A shadow-like profile portrait, named after an 18th-century French finance minister.',
      'A dark outline seen when a light shines from directly behind an object.'
    ]
  },
  {
    word: 'horizon',
    stories: [
      'The line at which the earth\'s surface and the sky appear to meet.',
      'Sailors look toward this distant boundary to spot incoming ships or land.',
      'The apparent line where the land or sea seems to touch the sky.'
    ]
  },
  {
    word: 'labyrinth',
    stories: [
      'A complicated irregular network of passages or paths in which it is difficult to find one\'s way.',
      'In Greek mythology, it was built by Daedalus to contain the monstrous Minotaur.',
      'An intricate maze designed to confuse and challenge anyone who enters it.'
    ]
  },
  {
    word: 'eclipse',
    stories: [
      'An astronomical event that occurs when one celestial body moves into the shadow of another.',
      'During this phenomenon, the day turns to twilight as the moon blocks out the sun.',
      'A rare alignment of the sun, earth, and moon that casts a shadow across the planet.'
    ]
  },
  {
    word: 'compass',
    stories: [
      'An instrument containing a magnetized pointer which shows the direction of magnetic north.',
      'It is a crucial tool for navigation, used alongside maps by hikers and sailors.',
      'A pocket-sized device with a dial indicating North, South, East, and West.'
    ]
  },
  {
    word: 'blueprint',
    stories: [
      'A design plan or technical drawing mapping out an architectural or engineering project.',
      'Engineers and builders study this detailed schematic before starting construction.',
      'A detailed plan of action or drawing, historically printed as white lines on blue paper.'
    ]
  },
  {
    word: 'symphony',
    stories: [
      'An elaborate musical composition for a full orchestra, typically in four movements.',
      'Beethoven and Mozart wrote famous examples of this complex orchestral work.',
      'A grand, multi-instrument musical masterpiece performed by a large classical ensemble.'
    ]
  },
  {
    word: 'telescope',
    stories: [
      'An optical instrument designed to make distant objects appear nearer.',
      'Astronomers use it to study stars, planets, nebulae, and distant galaxies.',
      'A device with lenses and mirrors used to look closely at the night sky.'
    ]
  },
  {
    word: 'velocity',
    stories: [
      'The speed of something in a given direction, defined as a vector quantity.',
      'In physics, it describes both how fast an object is moving and where it is going.',
      'The rate of change of an object\'s position with respect to time.'
    ]
  },
  {
    word: 'catalyst',
    stories: [
      'A substance that increases the rate of a chemical reaction without undergoing permanent change.',
      'It lowers the activation energy required, speeding up biological or chemical processes.',
      'An agent or substance that provokes or speeds up a reaction or change.'
    ]
  },
  {
    word: 'artifact',
    stories: [
      'An object made by a human being, typically of cultural or historical interest.',
      'Archaeologists carefully excavate these ancient tools, pottery, and relics.',
      'An item of historical importance discovered from a past civilization.'
    ]
  },
  {
    word: 'reflection',
    stories: [
      'The throwing back by a body or surface of light, heat, or sound without absorbing it.',
      'You see a mirror image of yourself when looking at a still, calm surface of water.',
      'An image or light cast back from a polished surface like a mirror.'
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
      'A sentimental longing or wistful affection for the past, typically for a period with happy personal associations.',
      'It was originally defined as a medical disease, a form of homesickness suffered by Swiss mercenaries.',
      'A bittersweet feeling of longing for past times, memories, or places from childhood.'
    ]
  },
  {
    word: 'equilibrium',
    stories: [
      'A state in which opposing forces or influences are balanced.',
      'In chemistry, it is the state where the forward and reverse reaction rates are equal.',
      'A stable condition of physical or chemical balance where no change occurs over time.'
    ]
  },
  {
    word: 'serendipity',
    stories: [
      'The occurrence and development of events by chance in a happy or beneficial way.',
      'The word was coined by Horace Walpole, inspired by a fairy tale about three princes of a faraway land.',
      'A fortunate accident or pleasant surprise found when you were not actively looking for it.'
    ]
  },
  {
    word: 'harmony',
    stories: [
      'The combination of simultaneously sounded musical notes to produce chords.',
      'A state of peaceful agreement, cooperation, and unity among people or elements.',
      'The pleasing arrangement of parts or sounds to create a unified, beautiful experience.'
    ]
  },
  {
    word: 'anomaly',
    stories: [
      'Something that deviates from what is standard, normal, or expected.',
      'Scientists investigate this unexpected data point that does not fit the established pattern.',
      'An unusual, irregular occurrence or deviation from the normal rules.'
    ]
  },
  {
    word: 'infinity',
    stories: [
      'The state or quality of being limitless or endless in space, extent, or size.',
      'In mathematics, it represents a concept larger than any natural number or quantity.',
      'A boundless, endless progression that goes on forever without limit.'
    ]
  },
  {
    word: 'theory',
    stories: [
      'A system of ideas intended to explain something, especially one based on general principles.',
      'Unlike a hypothesis, this is a well-substantiated explanation supported by vast evidence.',
      'A structured set of rules or principles explaining observed facts or phenomena.'
    ]
  },
  {
    word: 'enigma',
    stories: [
      'A person or thing that is mysterious, puzzling, or difficult to understand.',
      'Historically, it was the name of a famous cipher machine used to encrypt secret military messages.',
      'A baffling riddle or mysterious puzzle that defies easy explanation.'
    ]
  },
  {
    word: 'metaphor',
    stories: [
      'A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable.',
      'It asserts that one thing is another thing to draw a vivid comparison without using "like" or "as".',
      'A symbolic comparison used in literature to explain one idea in terms of another.'
    ]
  },
  {
    word: 'dimension',
    stories: [
      'A measurable extent of some kind, such as length, breadth, depth, or height.',
      'Physicists describe our reality as having three spatial axes and one temporal axis.',
      'A direction of measurement or an alternate realm of existence.'
    ]
  },
  {
    word: 'legacy',
    stories: [
      'An amount of money or property left to someone in a will, or a long-lasting impact.',
      'It represents the footprint or history a person leaves behind for future generations.',
      'Something handed down from an ancestor or predecessor to those who follow.'
    ]
  },
  {
    word: 'illusion',
    stories: [
      'A thing that is or is likely to be wrongly perceived or interpreted by the senses.',
      'A magic trick or mirage in the desert that makes you see something that is not truly there.',
      'A deceptive appearance or false impression of reality.'
    ]
  },
  {
    word: 'symmetry',
    stories: [
      'The quality of being made up of exactly similar parts facing each other or around an axis.',
      'A butterfly\'s wings or a snowflake demonstrate this perfect, balanced proportion.',
      'A balanced, mirrored arrangement of matching parts on opposite sides of a divider.'
    ]
  },
  {
    word: 'sanctuary',
    stories: [
      'A place of safety or refuge, historically a holy place like a temple or church.',
      'Wildlife reserves serve as this protective haven for endangered animals.',
      'A peaceful, safe haven where one can find shelter from danger or stress.'
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
