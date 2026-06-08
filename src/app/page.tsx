"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight, HelpCircle, Trophy, Flame, Zap, Snowflake, LogOut, Loader2, Sparkles, ChevronRight, ChevronDown, Activity, Award } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import type { GuessEntry, GuessResponse, UserProfile } from "@/types/game";
import { getRankTier, getRankColor, getRankBarClass, getRankLabel } from "@/types/game";
import HowToPlayModal from "@/components/HowToPlayModal";
import { Logo } from "@/components/Logo";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";

// JSON-LD for Search Engine Optimization
const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["WebApplication", "VideoGame"],
  name: "Contextle.ai",
  url: "https://contextle.online",
  description: "Play Contextle.ai, the ultimate futuristic AI word game. Guess the secret word using real-time semantic similarity ranks and dynamic AI clue stories. Challenge your brain daily!",
  applicationCategory: "GameApplication",
  operatingSystem: "All",
  browserRequirements: "Requires JavaScript. Requires HTML5.",
  genre: "Puzzle, Word Game, Educational",
  offers: {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  aggregateRating: {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "1245",
    "bestRating": "5",
    "worstRating": "1"
  }
};

// ─── Countdown Hook ─────────────────────────────────────────────────────────
function useCountdown() {
  const [t, setT] = useState({ h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const tmr = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
      const d = Math.floor((tmr.getTime() - now.getTime()) / 1000);
      setT({ h: Math.floor(d / 3600), m: Math.floor((d % 3600) / 60), s: d % 60 });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

const pad = (n: number) => String(n).padStart(2, "0");

// ─── Guess Card (Linear/Supabase Design) ────────────────────────────────────
function GuessCard({ entry }: { entry: GuessEntry }) {
  const tier = getRankTier(entry.rank);
  const barClass = getRankBarClass(entry.rank);
  
  // Custom refined colors to match emerald/Supabase aesthetic
  let badgeColor = "text-neutral-400 bg-white/[0.02]";
  let iconColor = "text-neutral-500";
  let borderStyle = "border-white/[0.04]";
  
  if (entry.isCorrect) {
    badgeColor = "text-emerald-400 bg-emerald-500/10";
    iconColor = "text-emerald-400";
    borderStyle = "border-emerald-500/20";
  } else if (tier === "hot") {
    badgeColor = "text-red-400 bg-red-500/5";
    iconColor = "text-red-400";
    borderStyle = "border-red-500/10";
  } else if (tier === "warm") {
    badgeColor = "text-amber-400 bg-amber-500/5";
    iconColor = "text-amber-400";
    borderStyle = "border-amber-500/10";
  } else if (tier === "cold") {
    badgeColor = "text-blue-400 bg-blue-500/5";
    iconColor = "text-blue-400";
    borderStyle = "border-blue-500/10";
  }

  const Icon = tier === "hot" ? Flame : tier === "warm" ? Zap : Snowflake;
  const pct = Math.max(4, entry.similarityPercentage);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className={`glass rounded-xl p-3.5 border ${borderStyle} hover:border-white/10 transition-all duration-200 group flex flex-col gap-2.5 ${entry.isCorrect ? "pulse-ring" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${badgeColor}`}>
            <Icon size={14} className={iconColor} />
          </div>
          <div>
            <p className="font-semibold text-sm text-neutral-200 tracking-tight group-hover:text-white transition-colors">
              {entry.word}
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5 font-medium uppercase tracking-wider">
              {getRankLabel(entry.rank).split(" ").slice(1).join(" ") || "Unrelated"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={`font-mono font-bold text-sm ${entry.isCorrect ? "text-emerald-400" : "text-neutral-300"}`}>
            #{entry.rank}
          </p>
          <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{entry.similarityPercentage}% similarity</p>
        </div>
      </div>
      <div className="w-full h-1 bg-white/[0.03] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barClass}`}
          initial={{ width: "0%" }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

// ─── Login Screen (Supabase inspired) ───────────────────────────────────────
function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative bg-[#09090b]">
      {/* Soft minimalist grid background */}
      <div 
        className="absolute inset-0 opacity-[0.01] pointer-events-none" 
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />
      
      {/* Centered soft radial glow */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.03] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div className="glass rounded-2xl p-10 border border-white/[0.04] shadow-[0_24px_50px_-12px_rgba(0,0,0,0.8)]">
          <div className="text-center flex flex-col items-center">
            {/* Supabase style emerald logo icon */}
            <div className="w-11 h-11 mb-6 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
              <Sparkles size={18} className="text-emerald-400" />
            </div>

            <h1 className="font-bold text-2xl text-white tracking-tight mb-2">
              Contextle<span className="text-neutral-600">.ai</span>
            </h1>
            
            <p className="text-neutral-400 text-xs leading-relaxed mb-8 font-medium max-w-[300px]">
              AI-powered semantic word game.<br />
              <span className="text-neutral-500 font-normal">Find the secret word using meaning.</span>
            </p>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-xs text-neutral-200 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.12] transition-all duration-150 disabled:opacity-50 flex items-center justify-center gap-2.5 cursor-pointer select-none active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 size={14} className="animate-spin text-neutral-400" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#EA4335"
                    d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.91 11.91 0 0 0 12 0C7.305 0 3.327 2.673 1.355 6.577l3.91 3.188z"
                  />
                  <path
                    fill="#34A853"
                    d="M16.04 15.34c-1.045.7-2.38 1.1-4.04 1.1-2.836 0-5.245-1.92-6.1-4.509l-3.923 3.19A11.972 11.972 0 0 0 12 24c3.245 0 6.132-1.082 8.177-2.936l-4.136-3.723z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.49 12.273c0-.818-.082-1.609-.227-2.373H12v4.51h6.464a5.536 5.536 0 0 1-2.4 3.636l4.137 3.723C22.614 19.927 23.49 16.39 23.49 12.273z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.89 13.927c-.227-.682-.359-1.409-.359-2.164 0-.754.132-1.482.36-2.163L1.98 6.414A11.977 11.977 0 0 0 0 11.763c0 1.95.468 3.8 1.295 5.432l4.595-3.268z"
                  />
                </svg>
              )}
              <span>{loading ? "Connecting..." : "Continue with Google"}</span>
            </button>

            <div className="w-full mt-8 pt-6 border-t border-white/[0.02] grid grid-cols-3 gap-1 text-center text-[9px] text-neutral-500 font-semibold tracking-wider uppercase">
              <div>
                <p className="text-emerald-400 mb-0.5">Free</p>
                <p className="text-[8px] text-neutral-600">To Play</p>
              </div>
              <div className="border-x border-white/[0.02]">
                <p className="text-emerald-400 mb-0.5">Secure</p>
                <p className="text-[8px] text-neutral-600">OAuth 2.0</p>
              </div>
              <div>
                <p className="text-emerald-400 mb-0.5">Auto-Save</p>
                <p className="text-[8px] text-neutral-600">Progress</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-neutral-600 mt-5">
          By signing in, you save your completed levels.
        </p>
      </motion.div>
    </div>
  );
}

// ─── Success Modal (Vercel Style Clean Completion) ─────────────────────────
function SuccessModal({ word, guessCount, newLevel, onNext }: { word: string; guessCount: number; newLevel: number; onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="glass rounded-2xl p-6 max-w-sm w-full border border-emerald-500/20 shadow-[0_30px_70px_rgba(0,0,0,0.8)]"
      >
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20">
            <Award size={18} className="text-emerald-400" />
          </div>
          <h2 className="font-bold text-lg text-white tracking-tight mb-1">Level Complete</h2>
          <p className="text-neutral-400 text-xs leading-relaxed mb-5">
            You discovered the secret word &ldquo;<span className="text-emerald-400 font-semibold">{word}</span>&rdquo; in {guessCount} guesses.
          </p>
          <button
            onClick={onNext}
            className="w-full py-2 px-4 rounded-lg font-semibold text-xs text-white bg-emerald-500 hover:bg-emerald-400 transition-all duration-150 flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] active:scale-[0.98]"
          >
            Continue to Level {newLevel} <ChevronRight size={14} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}


function parseStories(rawStory: string | null | undefined): string[] {
  if (!rawStory) return [];
  try {
    const parsed = JSON.parse(rawStory);
    if (Array.isArray(parsed)) {
      return parsed.map(s => String(s));
    }
  } catch {}
  return [rawStory];
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function HomePage() {
  const { h, m, s } = useCountdown();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [guesses, setGuesses] = useState<GuessEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingWord, setGeneratingWord] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [wonWord, setWonWord] = useState<string | null>(null);
  const [wonLevel, setWonLevel] = useState<number | null>(null);
  const [activeClueIndex, setActiveClueIndex] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();
  const sorted = [...guesses].sort((a, b) => a.rank - b.rank);
  const bestRank = sorted[0]?.rank;

  // Listen for authentication updates and automatically create/sync profile rows
  useEffect(() => {
    const syncProfile = async (currentUser: User) => {
      setAuthLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (res.ok && data.success && data.profile) {
          setProfile(data.profile as UserProfile);
        } else {
          console.error("[contextle] Failed to sync profile:", data.error);
          setError(data.error ?? "Failed to initialize user profile.");
        }
      } catch (err) {
        console.error("[contextle] Error during profile sync:", err);
        setError("Network error synchronizing user profile.");
      } finally {
        setAuthLoading(false);
      }
    };

    // Initial check
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) {
        syncProfile(u);
      } else {
        setAuthLoading(false);
      }
    });

    // Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await syncProfile(u);
      } else {
        setProfile(null);
        setGuesses([]);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Local Storage Guess Persistence ────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      const savedKey = `contextle_guesses_${profile.id}_${profile.current_level}`;
      const saved = localStorage.getItem(savedKey);
      if (saved) {
        try {
          setGuesses(JSON.parse(saved));
        } catch {
          setGuesses([]);
        }
      } else {
        setGuesses([]);
      }
    } else {
      setGuesses([]);
    }
  }, [profile?.id, profile?.current_level]);

  useEffect(() => {
    if (profile && guesses.length > 0) {
      const savedKey = `contextle_guesses_${profile.id}_${profile.current_level}`;
      localStorage.setItem(savedKey, JSON.stringify(guesses));
    }
  }, [guesses, profile]);

  useEffect(() => {
    if (profile?.current_story) {
      console.log("[contextle][Frontend] Loaded stories:", parseStories(profile.current_story));
    }
  }, [profile?.current_story]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setGuesses([]);
  };

  const handleGenerateWord = async () => {
    if (!user || generatingWord) return;
    setGeneratingWord(true);
    setError(null);
    try {
      // Get previously solved words from localStorage
      const solvedKey = `contextle_solved_words_${user.id}`;
      const solvedRaw = localStorage.getItem(solvedKey);
      const solvedWords = solvedRaw ? JSON.parse(solvedRaw) : [];

      const res = await fetch("/api/generate-word", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          excludeWords: solvedWords,
          level: profile?.current_level ?? 1,
        }),
      });
      const data = await res.json();
      console.log("[contextle][Frontend] generate-word API response:", data);
      
      if (res.ok && data.success) {
        console.log("[contextle][Frontend] Stories generated successfully:", data.stories);
        setActiveClueIndex(0);
        setDropdownOpen(false);
        // Fetch fresh profile state (contains active_word)
        const profileRes = await fetch("/api/profile");
        const profileData = await profileRes.json();
        if (profileRes.ok && profileData.success && profileData.profile) {
          setProfile(profileData.profile);
        }
      } else {
        setError(data.error ?? "Failed to generate word.");
      }
    } catch {
      setError("Network error generating word.");
    } finally {
      setGeneratingWord(false);
    }
  };

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user) return;
    const word = inputValue;
    if (!word.trim() || isLoading || wonWord || !profile?.active_word) return;
    
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          word, 
          level: profile?.current_level,
          guessedWords: guesses.map(g => g.word)
        }),
      });
      const data: GuessResponse & { error?: string } = await res.json();
      console.log("[contextle][Frontend] guess API response:", data);
      if (!res.ok || !data.success) { setError(data.error ?? "Evaluation failed."); return; }

      const entry: GuessEntry = { ...data, id: `${word}-${Date.now()}`, timestamp: Date.now() };
      setGuesses((prev) => [entry, ...prev]);
      setInputValue("");

      if (entry.isCorrect && data.newLevel) {
        setWonWord(word);
        setWonLevel(data.newLevel);
        
        // Track previously solved words to avoid repetition
        const solvedKey = `contextle_solved_words_${user.id}`;
        const solvedRaw = localStorage.getItem(solvedKey);
        const solvedWords = solvedRaw ? JSON.parse(solvedRaw) : [];
        if (!solvedWords.includes(word)) {
          solvedWords.push(word);
          localStorage.setItem(solvedKey, JSON.stringify(solvedWords));
        }

        if (profile) {
          const savedKey = `contextle_guesses_${profile.id}_${profile.current_level}`;
          localStorage.removeItem(savedKey);
        }
      }
    } catch { setError("Network error. Check connection."); }
    finally { setIsLoading(false); inputRef.current?.focus(); }
  }, [inputValue, isLoading, wonWord, guesses, profile, user]);

  const handleNextLevel = () => {
    if (wonLevel && profile) {
      const savedKey = `contextle_guesses_${profile.id}_${profile.current_level}`;
      localStorage.removeItem(savedKey);
      setProfile({ ...profile, current_level: wonLevel, active_word: null });
    }
    setWonWord(null);
    setWonLevel(null);
    setGuesses([]);
    setActiveClueIndex(0);
    setDropdownOpen(false);
  };

  if (authLoading || (user && !profile && !error)) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#09090b]">
        <Loader2 size={16} className="text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  if (user && !profile && error) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#09090b] px-4 text-center">
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
          <Activity size={24} />
        </div>
        <h1 className="text-white font-bold text-lg mb-2">Failed to Load Profile</h1>
        <p className="text-neutral-400 text-xs max-w-sm mb-6 leading-relaxed">
          {error}
        </p>
        <button
          onClick={async () => {
            setError(null);
            setAuthLoading(true);
            try {
              const res = await fetch("/api/profile");
              const data = await res.json();
              if (res.ok && data.success && data.profile) {
                setProfile(data.profile as UserProfile);
              } else {
                setError(data.error ?? "Failed to initialize user profile.");
              }
            } catch {
              setError("Network error synchronizing user profile.");
            } finally {
              setAuthLoading(false);
            }
          }}
          className="px-5 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08] hover:border-white/20 text-white text-xs font-semibold hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Minimal grid & radial overlay */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
        <div 
          className="absolute inset-0 opacity-[0.015]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] rounded-full bg-emerald-500/[0.02] blur-[140px]" />
      </div>

      <div className="relative z-10 min-h-dvh flex flex-col bg-[#09090b]">
        {/* ── Navbar (Supabase Style Floating Navbar) ─────────────────────── */}
        <header className="sticky top-0 z-30 border-b border-white/[0.04] bg-[#09090b]/80 backdrop-blur-xl">
          <nav className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="h-7 flex items-center hover:opacity-80 transition-opacity" aria-label="Contextle Home">
                <Logo className="h-6.5 w-auto" />
              </Link>
              {profile && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold tracking-wide uppercase">
                  Level {profile.current_level}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-neutral-500 font-mono tracking-wider uppercase">
                Next word: {pad(h)}:{pad(m)}:{pad(s)}
              </span>
              <button 
                onClick={() => setShowModal(true)} 
                className="w-7 h-7 rounded-lg flex items-center justify-center border border-white/[0.05] hover:border-white/10 text-neutral-400 hover:text-white transition-all duration-150 bg-white/[0.01]" 
                aria-label="How to Play"
              >
                <HelpCircle size={14} />
              </button>
              {user && (
                <div className="flex items-center gap-2 border-l border-white/[0.06] pl-3">
                  {user.user_metadata?.avatar_url ? (
                    <Image src={user.user_metadata.avatar_url} alt="User Avatar" width={24} height={24} className="w-6 h-6 rounded-full border border-white/10" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px] text-emerald-400 font-bold border border-emerald-500/30">
                      {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                  <button 
                    onClick={handleLogout} 
                    className="p-1 rounded-md text-neutral-500 hover:text-red-400 transition-colors" 
                    aria-label="Logout"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              )}
            </div>
          </nav>
        </header>

        {/* ── Main Layout (Centered) ─────────────────────────────────────── */}
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 pb-24 pt-12 flex flex-col">
          {/* Hero Header */}
          <motion.div 
            className="text-center mb-8" 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.3 }}
          >
            <h1 className="font-bold text-2xl sm:text-3xl text-white tracking-tight mb-2">
              Play the Best Guess Word Game Online
            </h1>
            <p className="text-neutral-400 text-sm font-medium">
              Find the secret word daily using meaning and context.
            </p>
            {guesses.length > 0 && (
              <p className="text-neutral-500 text-xs mt-3 font-mono tracking-tight">
                {guesses.length} guesses • Best #{bestRank ?? "—"} • Level {profile?.current_level ?? 1}
              </p>
            )}
          </motion.div>

          {/* 💡 AI Clue Stories Card (rendered directly under header) */}
          {profile?.active_word && profile?.current_story && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl p-5 border border-white/[0.04] bg-white/[0.003] relative overflow-hidden mb-6 z-20"
            >
              <div className="absolute top-0 right-0 p-3 text-emerald-500/10">
                <Sparkles size={32} />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                  💡 AI Clue Stories
                </h3>
              </div>

              {/* Dropdown Clue Selector */}
              {parseStories(profile.current_story).length > 1 && (
                <div className="relative mb-4 z-20">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05] hover:border-white/10 text-[10px] font-bold text-neutral-300 transition-all cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={11} className="text-emerald-400" />
                      Clue {activeClueIndex + 1}
                    </span>
                    <ChevronDown size={12} className={`text-neutral-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 rounded-lg bg-[#0e0e11] border border-white/[0.08] shadow-2xl z-30 overflow-hidden py-1">
                      {parseStories(profile.current_story).map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveClueIndex(idx);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-[10px] font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                            activeClueIndex === idx
                              ? "bg-emerald-500/10 text-emerald-400 font-bold"
                              : "text-neutral-400 hover:bg-white/[0.02] hover:text-white"
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full ${activeClueIndex === idx ? "bg-emerald-400" : "bg-transparent"}`} />
                          Clue {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <p className="text-neutral-300 text-xs leading-relaxed font-medium italic min-h-[50px]">
                {parseStories(profile.current_story)[activeClueIndex] || ""}
              </p>

              <div className="mt-4 pt-3 border-t border-white/[0.03] flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                <span>CLUE ACTIVE</span>
                <span>LEVEL {profile.current_level}</span>
              </div>
            </motion.div>
          )}

          {/* If no word is active: show the centered "Take the Word" start card */}
          {!profile?.active_word ? (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-14 px-6 border border-white/[0.04] rounded-2xl bg-white/[0.005] glass flex flex-col items-center justify-center relative overflow-hidden"
            >
              {/* Glowing decorative backdrop */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full bg-emerald-500/[0.03] blur-[40px] pointer-events-none" />
              <div className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles size={20} className="animate-pulse" />
              </div>
              <h2 className="text-white font-bold text-base mb-1.5">Ready for Level {profile?.current_level ?? 1}</h2>
              <p className="text-neutral-500 text-xs max-w-sm mb-6 leading-relaxed">
                Generate a fresh guessable secret word and its AI clue stories.
              </p>
              <button
                onClick={handleGenerateWord}
                disabled={generatingWord}
                className="px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-[0_4px_20px_rgba(16,185,129,0.15)] disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer"
              >
                {generatingWord ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <span>🎲</span> Take the Word
                  </>
                )}
              </button>
            </motion.div>
          ) : (
            /* If a word is active: show the centered play state */
            <div className="space-y-6">
              {/* Premium Input Component */}
              <motion.form
                onSubmit={handleSubmit}
                className="relative"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05, duration: 0.3 }}
              >
                <div className="flex items-center gap-2 p-1.5 glass rounded-xl border border-white/[0.05] focus-within:border-emerald-500/30 focus-within:shadow-[0_0_20px_rgba(16,185,129,0.02)] transition-all duration-200">
                  <div className="pl-2.5 text-neutral-500"><Search size={15} /></div>
                  <input
                    ref={inputRef}
                    id="guess-input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => { setInputValue(e.target.value); setError(null); }}
                    placeholder="Type a guess word..."
                    disabled={isLoading || !!wonWord}
                    maxLength={64}
                    className="flex-1 bg-transparent text-white placeholder-neutral-600 text-xs outline-none py-2 disabled:opacity-40 font-medium"
                  />
                  <button
                    type="submit"
                    disabled={!inputValue.trim() || isLoading || !!wonWord}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:bg-neutral-800 disabled:hover:scale-100 hover:scale-105 active:scale-95 transition-all duration-150 cursor-pointer"
                  >
                    {isLoading ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
                  </button>
                </div>
              </motion.form>

              {/* Error Message */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.p 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="text-center text-xs text-red-400 font-medium my-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Active Gaming Grid or Guess History */}
              <section className="w-full" aria-label="Guess History">
                {guesses.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="text-center py-16 border border-dashed border-white/[0.04] rounded-2xl bg-white/[0.005] relative overflow-hidden animate-pulse"
                  >
                    <div className="w-10 h-10 mx-auto mb-3.5 rounded-xl flex items-center justify-center bg-white/[0.02] border border-white/[0.04]">
                      <Activity size={16} className="text-neutral-500" />
                    </div>
                    <p className="text-neutral-400 text-xs font-semibold mb-1">Level {profile?.current_level ?? 1} Word Active</p>
                    <p className="text-neutral-600 text-[11px] mb-4">Type any English noun to search the vector space.</p>
                    <div className="flex items-center justify-center gap-1.5 text-yellow-400/80 text-xs tracking-wider font-mono">
                      <span>⭐</span>
                      <span>⭐</span>
                      <span>⭐</span>
                      <span>⭐</span>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">History</h2>
                        <div className="flex items-center gap-0.5 text-[9px] text-yellow-500/80 font-semibold px-1 rounded bg-yellow-500/10 border border-yellow-500/20">
                          <span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span>
                        </div>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">{guesses.length} {guesses.length === 1 ? "guess" : "guesses"}</span>
                    </div>
                    <motion.div layout className="space-y-2.5">
                      <AnimatePresence initial={false}>
                        {sorted.map((e) => <GuessCard key={e.id} entry={e} />)}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                )}
              </section>

              {/* Stats Card */}
              <motion.aside 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="mt-8 glass rounded-xl p-4 border border-white/[0.04] flex items-center justify-between bg-white/[0.002]"
                aria-label="Player Statistics"
              >
                <div>
                  <p className="text-xs font-semibold text-neutral-300">Your Progress</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Performance tracking this level</p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs font-mono font-bold text-neutral-300">{guesses.length}</p>
                    <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Guesses</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-emerald-400">#{bestRank ?? "—"}</p>
                    <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Best</p>
                  </div>
                  <div>
                    <p className="text-xs font-mono font-bold text-neutral-300">{profile?.current_level ?? 1}</p>
                    <p className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">Level</p>
                  </div>
                </div>
              </motion.aside>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-white/[0.03] py-5 mt-auto">
          <div className="max-w-2xl mx-auto px-4">
            <p className="text-[10px] text-neutral-600 font-medium text-center mb-3">
              <span className="text-neutral-500">contextle.ai</span>
            </p>
            <div className="flex items-center justify-center gap-4 text-[10px] text-neutral-600">
              <Link href="/about" className="hover:text-cyan-400 transition-colors">About</Link>
              <span className="text-neutral-800">·</span>
              <Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact</Link>
              <span className="text-neutral-800">·</span>
              <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy</Link>
              <span className="text-neutral-800">·</span>
              <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms</Link>
            </div>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <HowToPlayModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <AnimatePresence>
        {wonWord && wonLevel && (
          <SuccessModal word={wonWord} guessCount={guesses.length} newLevel={wonLevel} onNext={handleNextLevel} />
        )}
      </AnimatePresence>

      {/* Version Badge */}
      <div className="fixed bottom-3 right-3 text-[10px] font-mono px-2.5 py-0.5 bg-black/40 border border-neutral-800 text-neutral-500 rounded-md backdrop-blur-sm z-50 hover:text-neutral-300 transition-colors flex items-center gap-1.5 select-none">
        <span className="flex h-1.5 w-1.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
        </span>
        <span>v2.1.0</span>
      </div>
    </>
  );
}
