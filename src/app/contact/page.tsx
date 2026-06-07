"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

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
          Contact <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400">Us</span>
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="h-px w-16 bg-gradient-to-r from-pink-500 to-cyan-400 mb-8"
        />

        {/* Email Card */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 mb-8"
        >
          <p className="text-sm text-neutral-400 mb-3">
            Have questions, feedback, or need support? Reach out to us directly:
          </p>
          <a
            href="mailto:sharafath@sharafathabi.cloud"
            className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            sharafath@sharafathabi.cloud
          </a>
        </motion.div>

        {/* Contact Form */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={4}
          variants={fadeUp}
        >
          <h2 className="text-sm font-semibold text-neutral-200 mb-4">Send Us a Message</h2>

          {submitted ? (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 text-center">
              <p className="text-emerald-400 text-sm font-medium">Thank you for your message!</p>
              <p className="text-neutral-500 text-xs mt-1">We&apos;ll get back to you as soon as possible.</p>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
              }}
              className="space-y-4"
            >
              {/* Name */}
              <div>
                <label htmlFor="contact-name" className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  placeholder="Your name"
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="contact-email" className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label htmlFor="contact-message" className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-1.5">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  required
                  rows={5}
                  placeholder="Tell us what's on your mind..."
                  className="w-full rounded-lg border border-white/[0.06] bg-white/[0.03] px-3.5 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-violet-600 to-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-cyan-500 transition-all active:scale-[0.98]"
              >
                Send Message
              </button>
            </form>
          )}
        </motion.div>

        {/* Footer nav */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={5}
          variants={fadeUp}
          className="mt-12 pt-6 border-t border-white/[0.04] flex flex-wrap gap-4 text-[11px] text-neutral-600"
        >
          <Link href="/about" className="hover:text-cyan-400 transition-colors">About Us</Link>
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
        </motion.div>
      </div>
    </div>
  );
}
