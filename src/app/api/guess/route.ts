// ─────────────────────────────────────────────────────────────────────────────
//  app/api/guess/route.ts
//  Secure server-side Route Handler:
//   1. Validates user session via Supabase
//   2. Fetches current level's secret word from DB
//   3. Evaluates semantic similarity via Gemini (server-side only)
//   4. On correct guess, advances the user to the next level in DB
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient, createAdminClient } from "@/utils/supabase/server";
import type { GuessResponse } from "@/types/game";

// ── Security: rate-limit map (per-user, in-memory, resets on cold start) ─────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 60;           // max guesses per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= RATE_LIMIT_MAX) return true;
  entry.count++;
  return false;
}

// ── Sanitize: strip non-alpha characters, trim, lowercase ────────────────────
function sanitizeWord(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z\s'-]/g, "").substring(0, 64);
}



// Fallback: character overlap similarity if Gemini API key rate limits (429) ───
function calculateFallbackSimilarity(guess: string, secretWord: string): { rank: number; similarityPercentage: number } {
  const secretChars = new Set(secretWord.split(""));
  const guessChars = new Set(guess.split(""));
  let commonCount = 0;
  for (const char of guessChars) {
    if (secretChars.has(char)) {
      commonCount++;
    }
  }
  const maxUnique = Math.max(secretChars.size, guessChars.size);
  const overlapRatio = maxUnique > 0 ? commonCount / maxUnique : 0;
  const lengthDiff = Math.abs(secretWord.length - guess.length);
  const lengthPenalty = Math.max(0, 1 - lengthDiff / Math.max(secretWord.length, 1));
  const combinedScore = (overlapRatio * 0.7) + (lengthPenalty * 0.3);
  const similarityPercentage = Math.round(combinedScore * 100);
  const rank = Math.min(1000, Math.max(2, Math.round(1000 - (combinedScore * 900))));
  return { rank, similarityPercentage };
}

// ─────────────────────────────────────────────────────────────────────────────
//  POST /api/guess
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

  // ── 2. Rate Limiting (per user) ────────────────────────────────────────────
  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Slow down, genius! 😅" },
      { status: 429 }
    );
  }

  // ── 3. Parse & Validate Body ───────────────────────────────────────────────
  let body: { word?: unknown; level?: unknown; guessedWords?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body." },
      { status: 400 }
    );
  }

  if (typeof body.word !== "string" || body.word.trim() === "") {
    return NextResponse.json(
      { success: false, error: "A 'word' field is required." },
      { status: 400 }
    );
  }

  const guess = sanitizeWord(body.word);
  const guessedWords = Array.isArray(body.guessedWords) ? body.guessedWords : [];
  if (guessedWords.includes(guess)) {
    return NextResponse.json(
      {
        success: false,
        error: `Already guessed "${guess}"`,
      },
      { status: 400 }
    );
  }

  const requestedLevel =
    typeof body.level === "number" ? Math.round(body.level) : null;

  // ── 4. Fetch user's current level and active word from DB ─────────────────
  const adminClient = await createAdminClient();

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("current_level, active_word")
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

  // Validate: the user can only guess for their current level
  if (requestedLevel !== null && requestedLevel !== currentLevel) {
    return NextResponse.json(
      {
        success: false,
        error: "Level mismatch. Please refresh the page.",
      },
      { status: 409 }
    );
  }

  // ── 5. Check if user has an active word generated ──────────────────────────
  if (!profile.active_word) {
    return NextResponse.json(
      {
        success: false,
        error: "No active word found for this level. Please click 'Take the Word' first.",
      },
      { status: 400 }
    );
  }

  const secretWord = profile.active_word.toLowerCase();

  // ── 6. Instant win check ───────────────────────────────────────────────────
  if (guess === secretWord) {
    // Advance the user to the next level and clear the active word
    const newLevel = currentLevel + 1;
    const { error: updateError } = await adminClient
      .from("profiles")
      .update({
        current_level: newLevel,
        active_word: null,
        current_story: null,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("[contextle] Failed to advance level:", updateError);
    }

    // Save to played_words table if available
    try {
      await adminClient
        .from("played_words")
        .insert({ user_id: user.id, word: guess });
    } catch (err) {
      console.warn("[contextle] Failed to insert into played_words table (might not exist):", err);
    }

    return NextResponse.json<GuessResponse>({
      success: true,
      word: guess,
      rank: 1,
      similarityPercentage: 100,
      isCorrect: true,
      newLevel,
    });
  }

  // ── 7. Gemini API call (server-side only) ──────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[contextle] GEMINI_API_KEY is not set. Using fallback similarity.");
    const { rank, similarityPercentage } = calculateFallbackSimilarity(guess, secretWord);
    return NextResponse.json<GuessResponse>({
      success: true,
      word: guess,
      rank,
      similarityPercentage,
      isCorrect: false,
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are a semantic similarity evaluator for a word-guessing game.

Task: Compare how semantically close the GUESS word is to the SECRET word.

SECRET word: "${secretWord}"
GUESS word:  "${guess}"

Instructions:
1. Evaluate semantic, conceptual, and associative closeness.
2. Assign a RANK from 1 (identical/closest) to 1000 (unrelated/furthest).
   - 1–50:   Extremely close (synonyms, same category, directly related)
   - 51–200: Moderately related (same domain, loose association)
   - 201–500: Distantly related (broad topic overlap)
   - 501–1000: Unrelated
3. Assign a SIMILARITY_PERCENTAGE from 0–100 (100 = identical, 0 = no relation).
4. isCorrect should ONLY be true if the guess exactly matches the secret word.

IMPORTANT: Return ONLY valid JSON. No markdown, no explanation.

{
  "rank": <integer 1-1000>,
  "similarityPercentage": <integer 0-100>,
  "isCorrect": false
}
`.trim();

    const result = await model.generateContent(prompt);
    const rawText = result.response.text().trim();
    console.log("[contextle][API] Guess Gemini raw response:", rawText);

    // Strip potential markdown code fences
    const jsonText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "");

    let parsed: {
      rank: number;
      similarityPercentage: number;
      isCorrect: boolean;
    };
    try {
      parsed = JSON.parse(jsonText);
      console.log("[contextle][API] Guess Gemini parsed JSON:", parsed);
    } catch {
      console.error("[contextle] Gemini returned non-JSON:", rawText);
      return NextResponse.json(
        { success: false, error: "AI evaluation failed. Please try again." },
        { status: 502 }
      );
    }

    // Clamp values defensively
    const rank = Math.min(1000, Math.max(1, Math.round(parsed.rank ?? 999)));
    const similarityPercentage = Math.min(
      100,
      Math.max(0, Math.round(parsed.similarityPercentage ?? 0))
    );

    return NextResponse.json<GuessResponse>({
      success: true,
      word: guess,
      rank,
      similarityPercentage,
      isCorrect: false,
    });
  } catch (error) {
    console.warn("[contextle] Gemini API error, using fallback similarity metric:", error);
    const { rank, similarityPercentage } = calculateFallbackSimilarity(guess, secretWord);
    return NextResponse.json<GuessResponse>({
      success: true,
      word: guess,
      rank,
      similarityPercentage,
      isCorrect: false,
    });
  }
}

// Reject all other HTTP methods
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ error: "Method not allowed." }, { status: 405 });
}
