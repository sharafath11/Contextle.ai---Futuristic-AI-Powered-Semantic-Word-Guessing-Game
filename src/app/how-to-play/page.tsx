"use client";

import Link from "next/link";
import { ArrowLeft, Play, Search, Zap, CheckCircle2, Sparkles } from "lucide-react";

export default function HowToPlayPage() {
  return (
    <main className="min-h-dvh bg-[#09090b] text-white flex flex-col p-4 md:p-10 items-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-blue-500/[0.02] blur-[120px]" />
      </div>

      <div className="max-w-3xl w-full flex flex-col z-10">
        <Link href="/" className="self-start flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Game
        </Link>
        
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <Sparkles size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">How to Play Contextle</h1>
          <p className="text-neutral-400 max-w-lg">Master the art of semantic word guessing with our next-generation AI powered puzzle game.</p>
        </div>
        
        <div className="glass bg-white/[0.02] border border-white/[0.05] rounded-3xl p-6 md:p-10 space-y-10 text-neutral-300 shadow-2xl">
          <section className="flex gap-5 group">
            <div className="mt-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 transition-all">
                <Search className="text-neutral-400 group-hover:text-emerald-400 transition-colors" size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">1. Guess the Secret Word</h2>
              <p className="leading-relaxed">Type any English noun to search the semantic vector space. The AI will evaluate how close your guess is in meaning to the secret word. Spelling and length don't matter, only the conceptual meaning.</p>
            </div>
          </section>

          <section className="flex gap-5 group">
            <div className="mt-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:bg-amber-500/10 group-hover:border-amber-500/30 transition-all">
                <Zap className="text-neutral-400 group-hover:text-amber-400 transition-colors" size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">2. Use the Similarity Score</h2>
              <p className="leading-relaxed">Every guess gives you a similarity percentage and a rank. A higher rank means you are semantically closer. Pay attention to context! If you guess "Dog" and get a high rank, try other animals or pets.</p>
            </div>
          </section>

          <section className="flex gap-5 group">
            <div className="mt-1 flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center group-hover:bg-blue-500/10 group-hover:border-blue-500/30 transition-all">
                <CheckCircle2 className="text-neutral-400 group-hover:text-blue-400 transition-colors" size={24} />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">3. Rely on AI Hints</h2>
              <p className="leading-relaxed">Contextle generates unique AI stories around the secret word. Use these subtle clues to narrow down your guesses when you get stuck. Each level brings new AI-generated narratives.</p>
            </div>
          </section>
        </div>

        <Link href="/" className="mt-12 w-full md:w-auto self-center px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]">
          <Play size={20} />
          Start Playing Now
        </Link>
      </div>
    </main>
  );
}
