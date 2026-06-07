"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, MessageCircle, BarChart3, Thermometer, RefreshCw, Award } from "lucide-react";

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const rules = [
  { icon: Target, title: "Find the Secret Word", desc: "Each level has a unique hidden word. Discover it using semantic meaning." },
  { icon: MessageCircle, title: "Type Any Word", desc: "Submit any guess. The AI compares its conceptual proximity." },
  { icon: BarChart3, title: "Understand the Rank", desc: "Rank 1 is the exact secret word. 1000 is completely unrelated." },
  { icon: Thermometer, title: "Follow the Cues", desc: "Warm colors indicate close proximity: red = close, amber = medium, blue = distant." },
  { icon: RefreshCw, title: "Unlimited Guesses", desc: "Refine your guesses based on semantic scores to home in." },
  { icon: Award, title: "Save Progression", desc: "Login with Google to automatically save and track your level progress." },
];

export default function HowToPlayModal({ isOpen, onClose }: HowToPlayModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }, [onClose]);

  useEffect(() => {
    if (isOpen) { document.addEventListener("keydown", handleKeyDown); document.body.style.overflow = "hidden"; }
    return () => { document.removeEventListener("keydown", handleKeyDown); document.body.style.overflow = ""; };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div key="bd" className="modal-backdrop fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div key="m" className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <motion.div
              className="glass w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl border border-white/[0.04] shadow-[0_25px_60px_rgba(0,0,0,0.8)]"
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 4 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="flex items-center justify-between p-5 border-b border-white/[0.03]">
                <div>
                  <h2 className="font-bold text-base text-white tracking-tight">How to Play</h2>
                  <p className="text-[10px] text-neutral-500 mt-0.5">Semantic word association</p>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/[0.02] border border-white/[0.05] hover:border-white/10 text-neutral-400 hover:text-white transition-all duration-150">
                  <X size={12} />
                </button>
              </div>
              
              <div className="p-5 space-y-3.5">
                {rules.map((r, i) => (
                  <motion.div key={r.title} className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/10 text-emerald-400 flex-shrink-0 border border-emerald-500/15">
                      <r.icon size={12} />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-neutral-200">{r.title}</p>
                      <p className="text-[10px] text-neutral-400 leading-relaxed mt-0.5">{r.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="px-5 pb-5">
                <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-xs transition-all duration-150 shadow-[0_0_20px_rgba(16,185,129,0.15)] active:scale-[0.98]">
                  Start Playing
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
