// ─────────────────────────────────────────────────────────────────────────────
//  lib/wordOfDay.ts
//  Server-only utility — returns a deterministic secret word for today's date.
//  The word list never leaves the server.
// ─────────────────────────────────────────────────────────────────────────────

// Curated word list — rich, diverse vocabulary to keep the game interesting
const WORD_LIST: readonly string[] = [
  "aurora", "labyrinth", "cascade", "eclipse", "phantom",
  "solstice", "mirage", "zenith", "vortex", "serenity",
  "labrador", "catalyst", "mosaic", "odyssey", "enigma",
  "reverie", "fractal", "nebula", "paradox", "meridian",
  "silhouette", "resonance", "tempest", "kaleidoscope", "abyss",
  "sovereign", "luminous", "cavernous", "verdant", "gossamer",
  "peregrine", "wanderlust", "sanctum", "chrysalis", "elysian",
  "alchemy", "meridian", "labyrinth", "cryptic", "ethereal",
  "telescope", "horizon", "symphony", "monument", "pinnacle",
  "wilderness", "lantern", "sapphire", "current", "archive",
  "momentum", "rainfall", "fortress", "whisper", "clarity",
  "canvas", "forest", "glacier", "compass", "horizon",
  "thunder", "bridge", "circuit", "diamond", "element",
  "feather", "granite", "harvest", "island", "journey",
  "kingdom", "legend", "marble", "nectar", "ocean",
  "prism", "quarter", "river", "silver", "timber",
  "umbrella", "velvet", "winter", "xenon", "yellow",
  "zephyr", "anchor", "beacon", "copper", "dagger",
  "empire", "falcon", "garden", "harbor", "ivory",
];

/**
 * Returns a stable secret word for the current UTC date.
 * The index cycles through the word list using a date-based seed,
 * so the word changes every midnight UTC but stays the same all day.
 */
export function getSecretWordForToday(): string {
  const now = new Date();
  // Create a numeric seed from YYYYMMDD  e.g. 20260607
  const seed =
    now.getUTCFullYear() * 10_000 +
    (now.getUTCMonth() + 1) * 100 +
    now.getUTCDate();

  const index = seed % WORD_LIST.length;
  return WORD_LIST[index];
}

/**
 * Returns milliseconds until midnight UTC (next word reveal).
 */
export function getMsUntilNextWord(): number {
  const now = new Date();
  const tomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
  );
  return tomorrow.getTime() - now.getTime();
}

/**
 * Returns today's date string in YYYY-MM-DD (UTC) for display.
 */
export function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}
