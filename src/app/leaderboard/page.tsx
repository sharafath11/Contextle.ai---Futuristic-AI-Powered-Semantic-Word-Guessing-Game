"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Trophy, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 20;

  const fetchPlayers = async (pageIndex: number) => {
    const supabase = createClient();
    const from = pageIndex * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, current_level")
      .order("current_level", { ascending: false })
      .range(from, to);
    
    return { data, error };
  };

  useEffect(() => {
    async function init() {
      setLoading(true);
      const { data, error } = await fetchPlayers(0);
      if (!error && data) {
        setPlayers(data);
        if (data.length < PAGE_SIZE) setHasMore(false);
      }
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const { data, error } = await fetchPlayers(nextPage);
    if (!error && data) {
      setPlayers((prev) => [...prev, ...data]);
      setPage(nextPage);
      if (data.length < PAGE_SIZE) setHasMore(false);
    }
    setLoadingMore(false);
  };

  const observer = useRef<IntersectionObserver | null>(null);
  const lastPlayerRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    });
    if (node) observer.current.observe(node);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadingMore, hasMore, page]);

  return (
    <main className="min-h-dvh bg-[#09090b] text-white flex flex-col p-4 md:p-8 relative">
      <div className="max-w-4xl mx-auto w-full flex flex-col items-center">
        <Link href="/" className="self-start flex items-center gap-2 text-emerald-400 hover:text-emerald-300 text-sm mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Game
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.15)]">
            <Trophy size={24} className="text-yellow-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Global Leaderboard</h1>
        </div>

        {/* AdSense Banner Section - Top */}
        <div className="w-full h-24 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center mb-8 text-neutral-500 text-sm font-mono uppercase tracking-widest border-dashed">
          Advertisement Space
        </div>

        <div className="w-full bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 md:p-6 mb-8 shadow-2xl">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 size={32} className="text-emerald-500 animate-spin" />
            </div>
          ) : players.length === 0 ? (
            <p className="text-center py-10 text-neutral-500 font-mono">No players found.</p>
          ) : (
            <div className="space-y-3">
              {players.map((p, i) => {
                const isLast = i === players.length - 1;
                return (
                <div 
                  ref={isLast ? lastPlayerRef : null}
                  key={p.id || i} 
                  className="flex items-center justify-between p-4 bg-white/[0.015] border border-white/[0.03] rounded-xl hover:border-emerald-500/30 hover:bg-white/[0.03] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold font-mono text-sm ${i === 0 ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 shadow-[0_0_10px_rgba(250,204,21,0.2)]" : i === 1 ? "bg-slate-300/20 text-slate-300 border border-slate-300/30" : i === 2 ? "bg-amber-600/20 text-amber-600 border border-amber-600/30" : "bg-white/5 text-neutral-400 border border-white/10"}`}>
                      {i + 1}
                    </span>
                    <span className="font-semibold text-neutral-200 group-hover:text-white transition-colors">
                      {p.display_name || "Anonymous"}
                    </span>
                  </div>
                  <div className="text-emerald-400 font-mono font-bold px-3 py-1 bg-emerald-500/10 rounded border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    Level {p.current_level}
                  </div>
                </div>
                );
              })}
              {loadingMore && (
                <div className="flex justify-center py-6">
                  <Loader2 size={24} className="text-emerald-500 animate-spin" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* AdSense Banner Section - Bottom */}
        <div className="w-full h-24 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center justify-center text-neutral-500 text-sm font-mono uppercase tracking-widest border-dashed">
          Advertisement Space
        </div>
      </div>
    </main>
  );
}
