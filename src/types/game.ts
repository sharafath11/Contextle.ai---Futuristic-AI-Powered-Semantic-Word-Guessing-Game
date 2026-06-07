// ─────────────────────────────────────────────────────────────────────────────
//  types/game.ts – Shared TypeScript types for the Contextle game
// ─────────────────────────────────────────────────────────────────────────────

export interface GuessResponse {
  success: boolean;
  word: string;
  rank: number;
  similarityPercentage: number;
  isCorrect: boolean;
  error?: string;
  newLevel?: number; // Returned when the user levels up
}

export interface GuessEntry extends GuessResponse {
  id: string;       // unique ID for Framer Motion keying
  timestamp: number;
}

export type RankTier = "hot" | "warm" | "cold" | "ice";

export function getRankTier(rank: number): RankTier {
  if (rank <= 50)  return "hot";
  if (rank <= 200) return "warm";
  if (rank <= 500) return "cold";
  return "ice";
}

export function getRankLabel(rank: number): string {
  if (rank === 1)    return "🎯 EXACT MATCH!";
  if (rank <= 10)   return "🔥 Scorching";
  if (rank <= 50)   return "♨️  Very Hot";
  if (rank <= 100)  return "🌡️  Warm";
  if (rank <= 200)  return "🌊 Cool";
  if (rank <= 500)  return "❄️  Cold";
  return "🧊 Freezing";
}

export function getRankColor(rank: number): string {
  if (rank <= 50)  return "text-red-400";
  if (rank <= 200) return "text-amber-400";
  if (rank <= 500) return "text-blue-400";
  return "text-slate-400";
}

export function getRankBarClass(rank: number): string {
  if (rank <= 50)  return "rank-hot";
  if (rank <= 200) return "rank-warm";
  if (rank <= 500) return "rank-cold";
  return "rank-ice";
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  current_level: number;
  active_word?: string | null;
  current_story?: string | null;
  updated_at: string;
}

// ─── Game Level (matches Supabase `game_levels` table) ────────────────────
export interface GameLevel {
  level_number: number;
  secret_word: string;
  difficulty: "easy" | "medium" | "hard";
}
