"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

export default function TermsOfServicePage() {
  return (
    <div className="relative min-h-dvh bg-[#09090b] text-neutral-100">
      <div
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 py-16">
        <motion.div initial="hidden" animate="visible" custom={0} variants={fadeUp}>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-cyan-400 transition-colors mb-10"
          >
            <span>←</span> Back to Game
          </Link>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="visible"
          custom={1}
          variants={fadeUp}
          className="text-3xl font-bold tracking-tight mb-2"
        >
          Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400">Service</span>
        </motion.h1>

        <motion.div
          initial="hidden"
          animate="visible"
          custom={2}
          variants={fadeUp}
          className="h-px w-16 bg-gradient-to-r from-pink-500 to-cyan-400 mb-3"
        />

        <motion.p
          initial="hidden"
          animate="visible"
          custom={3}
          variants={fadeUp}
          className="text-xs text-neutral-600 mb-8"
        >
          Last updated: June 7, 2025
        </motion.p>

        <div className="space-y-8 text-sm leading-relaxed text-neutral-400">
          <motion.section initial="hidden" animate="visible" custom={4} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Contextle.online (&ldquo;the Service&rdquo;), you accept and agree to be bound by
              these Terms of Service. If you do not agree to these terms, you should not use the Service. We reserve the
              right to modify these terms at any time, and your continued use of the Service after such modifications
              constitutes your acceptance of the updated terms.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={5} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">2. Description of Service</h2>
            <p>
              Contextle.online is a free, browser-based AI-powered semantic word guessing game. Players attempt to discover
              a secret word by submitting guesses that are evaluated for semantic similarity using artificial intelligence.
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without any warranties of any kind.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={6} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">3. User Accounts</h2>
            <p className="mb-3">
              To use the Service, you must sign in using Google OAuth authentication. By creating an account, you agree to:
            </p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span><span>Provide accurate and complete information during the authentication process.</span></li>
              <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span><span>Maintain the security of your account credentials.</span></li>
              <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span><span>Accept responsibility for all activities that occur under your account.</span></li>
              <li className="flex items-start gap-2"><span className="text-cyan-400 mt-0.5">•</span><span>Notify us immediately of any unauthorized use of your account.</span></li>
            </ul>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={7} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">4. Fair Use Policy</h2>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3">
                You agree to use the Service fairly and responsibly. The following activities are strictly prohibited:
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✕</span><span>Submitting an excessive number of automated or scripted guesses.</span></li>
                <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✕</span><span>Attempting to reverse-engineer the AI evaluation system or extract the secret word through API manipulation.</span></li>
                <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✕</span><span>Sharing exploits, cheats, or vulnerabilities that undermine fair gameplay for others.</span></li>
                <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✕</span><span>Using the Service in any manner that could damage, disable, overburden, or impair our servers.</span></li>
                <li className="flex items-start gap-2"><span className="text-pink-400 mt-0.5">✕</span><span>Engaging in any activity that interferes with or disrupts the Service.</span></li>
              </ul>
            </div>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={8} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">5. Intellectual Property</h2>
            <p className="mb-3">
              All intellectual property rights in the Service, including but not limited to the game design, user interface,
              graphics, AI-generated content, clue stories, and underlying algorithms, are owned by Contextle.online and its
              creators. Specifically:
            </p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span><span>The AI evaluation system, including the semantic similarity ranking engine and clue story generation, is proprietary technology.</span></li>
              <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span><span>The game interface, brand identity, logos, and visual design elements are protected by copyright.</span></li>
              <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">•</span><span>You may not reproduce, distribute, modify, create derivative works of, publicly display, or in any way exploit any of the content without prior written permission.</span></li>
            </ul>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={9} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">6. Prohibition of Automated Bots &amp; Scraping</h2>
            <div className="rounded-lg border border-red-500/10 bg-red-500/[0.03] p-4">
              <p className="mb-3">
                The use of automated bots, scrapers, crawlers, or any other automated means to access the Service is
                strictly prohibited. This includes, but is not limited to:
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">⚠</span><span>Automated submission of guesses through scripts, bots, or third-party tools.</span></li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">⚠</span><span>Scraping or harvesting data from the Service, including game data, user data, or AI responses.</span></li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">⚠</span><span>Using automated tools to create multiple accounts or manipulate game progress.</span></li>
                <li className="flex items-start gap-2"><span className="text-red-400 mt-0.5">⚠</span><span>Making direct API calls to our endpoints outside of the normal game interface.</span></li>
              </ul>
              <p className="mt-3 text-xs text-neutral-500">
                Violation of this section may result in immediate account termination and potential legal action.
              </p>
            </div>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={10} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">7. Third-Party Services</h2>
            <p>
              The Service integrates with third-party services including Google OAuth (for authentication), Google Gemini AI
              (for semantic evaluation), Google AdSense (for advertising), and Google Analytics (for usage analytics). Your
              use of these third-party services is subject to their respective terms of service and privacy policies. We are
              not responsible for the practices of any third-party services.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={11} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">8. Limitation of Liability</h2>
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="mb-3">
                To the fullest extent permitted by applicable law, Contextle.online and its creators, contributors,
                and affiliates shall not be liable for:
              </p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span><span>Any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</span></li>
                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span><span>Any loss of data, profits, revenue, or goodwill.</span></li>
                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span><span>Any interruption or cessation of the Service.</span></li>
                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span><span>The accuracy or reliability of AI-generated content, including semantic similarity scores and clue stories.</span></li>
                <li className="flex items-start gap-2"><span className="text-amber-400 mt-0.5">•</span><span>Any unauthorized access to or alteration of your data.</span></li>
              </ul>
              <p className="mt-3 text-xs text-neutral-500">
                The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without any warranties,
                express or implied, including warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </div>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={12} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">9. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your access to the Service at any time, with or without cause
              and with or without notice. Upon termination, your right to use the Service will immediately cease. All
              provisions of these Terms that by their nature should survive termination shall survive, including ownership
              provisions, warranty disclaimers, and limitations of liability.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={13} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">10. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with applicable international laws. Any disputes
              arising from or relating to the use of the Service shall be resolved through good-faith negotiation. If a
              resolution cannot be reached, disputes shall be submitted to binding arbitration in accordance with applicable
              arbitration rules.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={14} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">11. Contact</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at:{" "}
              <Link href="mailto:sharafathabi.personal@gmail.com" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                sharafathabi.personal@gmail.com
              </Link>
            </p>
          </motion.section>
        </div>

        {/* Footer nav */}
        <motion.div
          initial="hidden"
          animate="visible"
          custom={15}
          variants={fadeUp}
          className="mt-12 pt-6 border-t border-white/[0.04] flex flex-wrap gap-4 text-[11px] text-neutral-600"
        >
          <Link href="/about" className="hover:text-cyan-400 transition-colors">About Us</Link>
          <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact Us</Link>
        </motion.div>
      </div>
    </div>
  );
}
