"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function AboutPage() {
  return (
    <div className="relative min-h-dvh bg-[#09090b] text-neutral-100">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-16">
        {/* Back link */}
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-cyan-400 transition-colors mb-10"
          >
            <span>←</span> Back to Game
          </Link>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="text-3xl font-bold tracking-tight mb-2"
        >
          About <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400">Contextle.online</span>
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="h-px w-16 bg-gradient-to-r from-pink-500 to-cyan-400 mb-8"
        />

        {/* Content */}
        <div className="space-y-6 text-sm leading-relaxed text-neutral-400">
          <motion.p initial="hidden" animate="visible" custom={3} variants={fadeUp}>
            <strong className="text-neutral-200">Contextle.online</strong> is an AI-powered semantic word guessing puzzle game built
            for language enthusiasts and puzzle lovers worldwide. Utilizing advanced natural language processing to rank word
            context, Contextle challenges you to discover a secret word by analyzing how semantically close your guesses are
            to the target.
          </motion.p>

          <motion.p initial="hidden" animate="visible" custom={4} variants={fadeUp}>
            Unlike traditional word games that rely on letter patterns, Contextle evaluates the <em className="text-neutral-300">meaning</em> behind
            your words. Each guess receives a similarity rank from 1 (closest) to 1000 (furthest), powered by Google&apos;s
            Gemini AI model. The closer your guess is in semantic space, the higher your rank.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={5}
            variants={fadeUp}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <h2 className="text-sm font-semibold text-neutral-200 mb-3">How It Works</h2>
            <ul className="space-y-2 text-neutral-400">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">▹</span>
                <span>A secret word is generated for each level with AI-crafted clue stories that progress from easy to challenging.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">▹</span>
                <span>Type your guess and receive an instant semantic similarity score ranked by our AI engine.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-pink-400 mt-0.5">▹</span>
                <span>Use the clue stories and similarity feedback to narrow down and discover the secret word.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">▹</span>
                <span>Complete levels to advance through increasingly difficult challenges across 100+ unique stages.</span>
              </li>
            </ul>
          </motion.div>

          <motion.p initial="hidden" animate="visible" custom={6} variants={fadeUp}>
            Contextle is completely <strong className="text-neutral-200">free to play</strong> in your browser — no downloads,
            no installations. Simply sign in with your Google account and start guessing. Your progress is saved automatically
            across sessions.
          </motion.p>

          <motion.div
            initial="hidden"
            animate="visible"
            custom={7}
            variants={fadeUp}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5"
          >
            <h2 className="text-sm font-semibold text-neutral-200 mb-3">Our Mission</h2>
            <p className="text-neutral-400">
              We believe word games should challenge your mind, not just your vocabulary. Contextle bridges the gap between
              gaming and education by leveraging cutting-edge AI to create a unique experience where every guess teaches you
              something about the relationships between words and concepts. Our goal is to make semantic understanding
              accessible, fun, and addictive.
            </p>
          </motion.div>

          <motion.p initial="hidden" animate="visible" custom={8} variants={fadeUp}>
            Built with Next.js, Supabase, and Google Gemini AI. Designed with love for the global word-game community.
          </motion.p>
        </div>

        {/* Footer nav */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={9}
          variants={fadeUp}
          className="mt-12 pt-6 border-t border-white/[0.04] flex flex-wrap gap-4 text-[11px] text-neutral-600"
        >
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact Us</Link>
        </motion.div>
      </div>
    </div>
  );
}
