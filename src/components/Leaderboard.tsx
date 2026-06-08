"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trophy, Loader2 } from "lucide-react";

interface Player {
  username: string | null;
  display_name: string | null;
  current_level: number;
}

export default function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlayers() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("username, display_name, current_level")
        .order("current_level", { ascending: false })
        .limit(5);

      if (!error && data) {
        setPlayers(data);
      }
      setLoading(false);
    }
    fetchPlayers();
  }, []);

  return (
    <section 
      className="glass rounded-xl p-5 border border-white/[0.04] bg-white/[0.003] w-full"
      aria-label="Top Players Leaderboard"
    >
      <div className="flex items-center gap-2 mb-5 pb-3 border-b border-white/[0.04]">
        <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Trophy size={12} className="text-emerald-400" />
        </div>
        <h3 
          className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase" 
          style={{ textShadow: "0 0 12px rgba(16, 185, 129, 0.4)" }}
        >
          Top Crawlers
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 size={16} className="text-emerald-500 animate-spin" />
        </div>
      ) : players.length === 0 ? (
        <p className="text-[10px] text-neutral-500 text-center py-6 font-mono uppercase tracking-wider">
          No players yet
        </p>
      ) : (
        <div className="space-y-2">
          {players.map((player, idx) => {
            const isTop = idx === 0;
            const isSecond = idx === 1;
            const isThird = idx === 2;
            
            const rankColor = isTop 
              ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/20" 
              : isSecond 
                ? "text-slate-300 bg-slate-300/10 border-slate-300/20" 
                : isThird 
                  ? "text-amber-600 bg-amber-600/10 border-amber-600/20" 
                  : "text-neutral-500 bg-white/[0.02] border-white/[0.04]";

            return (
              <div 
                key={idx} 
                className="flex items-center justify-between p-2.5 rounded-lg bg-white/[0.015] border border-white/[0.03] hover:border-emerald-500/20 hover:bg-white/[0.03] transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-mono font-bold border ${rankColor}`}>
                    {idx + 1}
                  </div>
                  <span className="text-[11px] font-medium text-neutral-300 group-hover:text-white transition-colors truncate max-w-[100px] sm:max-w-[140px]">
                    {player.display_name || player.username || "Player_" + Math.floor(Math.random() * 9000 + 1000)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span 
                    className="text-[10px] font-mono font-bold text-emerald-400 shadow-emerald-500/10"
                    style={{ textShadow: "0 0 8px rgba(16, 185, 129, 0.3)" }}
                  >
                    Lvl {player.current_level}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
