"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, WifiOff, AlertTriangle, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Check initial network state
    setIsOffline(!window.navigator.onLine);

    // Setup network listeners
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Log the error for troubleshooting
    console.error("[contextle] Error boundary caught:", error);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [error]);

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center bg-[#09090b] text-neutral-100 overflow-hidden font-inter">
      {/* Background Dots Grid & Glowing Backdrops */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div 
          className="absolute inset-0 opacity-[0.015]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-red-500/[0.02] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] rounded-full bg-yellow-500/[0.01] blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-md w-full px-6 text-center">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="w-48 h-auto">
            <Logo />
          </div>
        </div>

        {/* Dynamic Icon/Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-6 ${
            isOffline 
              ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
              : "bg-red-500/10 border border-red-500/20 text-red-400"
          }`}
        >
          {isOffline ? (
            <>
              <WifiOff size={12} className="animate-pulse" />
              Connection Terminated
            </>
          ) : (
            <>
              <AlertTriangle size={12} className="animate-pulse" />
              System Anomaly
            </>
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3"
        >
          {isOffline ? "You are Offline" : "System Error"}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-8 max-w-sm mx-auto"
        >
          {isOffline 
            ? "Your connection to the semantic vector database was lost. Please check your internet connection and try again."
            : "An unexpected error occurred while analyzing semantic vectors. Our neural core is logging the event."}
        </motion.p>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-[0_4px_20px_rgba(16,185,129,0.15)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <RefreshCw size={13} />
            Try Again
          </button>
          
          <a
            href="/"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white border border-white/[0.05] hover:border-white/10 bg-white/[0.01] hover:scale-[1.03] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <ArrowLeft size={13} />
            Go to Home
          </a>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 left-0 right-0 text-center z-10">
        <p className="text-[10px] text-neutral-600 font-medium font-mono uppercase tracking-widest">
          Contextle.ai // {isOffline ? "Offline Sandbox" : "Fault Boundary"}
        </p>
      </div>
    </div>
  );
}
