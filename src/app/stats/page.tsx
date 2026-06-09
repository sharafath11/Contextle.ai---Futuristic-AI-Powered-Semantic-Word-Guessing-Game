"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Share2, Flame, Target, Trophy } from "lucide-react";

export default function StatsPage() {
  const [stats, setStats] = useState({ streak: 5, winRate: 85, played: 42 });

  useEffect(() => {
    const s = localStorage.getItem("contextle_daily_streak");
    if (s) setStats(prev => ({ ...prev, streak: parseInt(s, 10) }));
  }, []);

  const handleShare = () => {
    const text = `🔥 I'm on a ${stats.streak}-day streak on Contextle! Can you beat my semantic guessing skills? Play now: https://contextle.online`;
    if (navigator.share) {
      navigator.share({ text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      alert("Streak copied to clipboard!");
    }
  };

  return (
    <main className="min-h-dvh bg-[#09090b] text-white flex flex-col p-4 md:p-8 relative items-center justify-center">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.02] blur-[140px]" />
      </div>

      <div className="max-w-2xl w-full flex flex-col z-10">
        <Link href="/" className="self-start flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to Game
        </Link>
        
        <h1 className="text-3xl md:text-4xl font-bold mb-10 text-center tracking-tight">Your Stats & Streak</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:border-orange-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Flame size={40} className="text-orange-500 mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" />
            <div className="text-4xl font-bold text-white mb-2">{stats.streak}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Current Streak</div>
          </div>
          
          <div className="glass bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:border-emerald-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Target size={40} className="text-emerald-500 mb-4 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]" />
            <div className="text-4xl font-bold text-white mb-2">{stats.winRate}%</div>
            <div className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Win Rate</div>
          </div>
          
          <div className="glass bg-white/[0.02] border border-white/[0.05] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-500/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Trophy size={40} className="text-blue-500 mb-4 drop-shadow-[0_0_15px_rgba(59,130,246,0.4)]" />
            <div className="text-4xl font-bold text-white mb-2">{stats.played}</div>
            <div className="text-xs text-neutral-500 uppercase tracking-widest font-semibold">Games Played</div>
          </div>
        </div>

        <button 
          onClick={handleShare}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold flex items-center justify-center gap-3 transition-all shadow-[0_0_30px_rgba(16,185,129,0.2)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:scale-[1.02] active:scale-[0.98]"
        >
          <Share2 size={20} />
          Share Streak & Challenge Friends
        </button>
      </div>
    </main>
  );
}
