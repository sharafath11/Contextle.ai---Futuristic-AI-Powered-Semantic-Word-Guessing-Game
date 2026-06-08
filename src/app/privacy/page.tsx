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

export default function PrivacyPolicyPage() {
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
          Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-violet-500 to-cyan-400">Policy</span>
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
            <h2 className="text-base font-semibold text-neutral-200 mb-3">1. Introduction</h2>
            <p>
              Welcome to Contextle.online (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). We are committed to protecting
              your personal information and your right to privacy. This Privacy Policy explains what information we collect, how we
              use it, and what rights you have in relation to it. By using our website and game services, you agree to the terms
              outlined in this policy.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={5} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">2. Information We Collect</h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="text-sm font-medium text-neutral-300 mb-1">Account Information</h3>
                <p>When you sign in with Google OAuth, we receive your name, email address, and profile picture from Google. This information is used solely for authentication and displaying your profile within the game.</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="text-sm font-medium text-neutral-300 mb-1">Game Data</h3>
                <p>We store your game progress, including your current level, active word state, and guess history. This data is stored securely in our Supabase-hosted database and is linked to your account.</p>
              </div>
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
                <h3 className="text-sm font-medium text-neutral-300 mb-1">Automatically Collected Data</h3>
                <p>We automatically collect certain information when you visit our website, including your IP address, browser type, operating system, referring URLs, device information, pages viewed, and access timestamps.</p>
              </div>
            </div>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={6} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">3. Log Files</h2>
            <p>
              Contextle.online follows a standard procedure of using log files. These files log visitors when they visit websites.
              The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service
              Provider (ISP), date and time stamps, referring/exit pages, and possibly the number of clicks. These are not linked
              to any personally identifiable information. The purpose of the information is for analyzing trends, administering
              the site, tracking user movement on the website, and gathering demographic information.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={7} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">4. Cookies</h2>
            <p className="mb-3">
              Like many websites, Contextle.online uses cookies. Cookies are small files placed on your device that help us
              provide a better user experience. We use cookies for the following purposes:
            </p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span><strong className="text-neutral-300">Authentication cookies:</strong> To keep you signed in securely across sessions via Supabase Auth.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span><strong className="text-neutral-300">Analytics cookies:</strong> Google Analytics uses cookies to collect anonymous usage statistics (see Section 5).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span><strong className="text-neutral-300">Advertising cookies:</strong> Third-party advertising vendors, including Google AdSense, use cookies to serve ads based on your prior visits (see Section 6).</span>
              </li>
            </ul>
            <p className="mt-3">
              You can choose to disable cookies through your browser settings. However, disabling cookies may affect
              your ability to use certain features of our website, such as authentication.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={8} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">5. Google Analytics</h2>
            <p>
              We use Google Analytics (GA4) to understand how visitors interact with our website. Google Analytics collects
              information such as how often users visit our site, what pages they visit, and what other sites they used prior
              to visiting. We use this data solely to improve our website and game experience. Google Analytics collects only
              the IP address assigned to you on the date you visit our site, rather than your name or other identifying
              information. Google&apos;s ability to use and share information collected by Google Analytics about your visits to
              this site is restricted by the{" "}
              <Link href="https://marketingplatform.google.com/about/analytics/terms/us/" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                Google Analytics Terms of Service
              </Link>{" "}
              and the{" "}
              <Link href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                Google Privacy Policy
              </Link>.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={9} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">6. Google AdSense &amp; Third-Party Advertising</h2>
            <p className="mb-3">
              We use Google AdSense to display advertisements on our website. Google AdSense and other third-party advertising
              vendors use cookies to serve ads based on your prior visits to our website or other websites on the internet.
            </p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span>Google uses the DoubleClick DART cookie to serve ads to users based on their visit to our site and other sites on the internet.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span>Users may opt out of the use of the DART cookie by visiting the Google Ad and Content Network privacy policy at{" "}
                  <Link href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                    https://policies.google.com/technologies/ads
                  </Link>.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">•</span>
                <span>Third-party ad servers or ad networks may use technology such as cookies, JavaScript, or web beacons in their advertisements and links that appear on Contextle.online.</span>
              </li>
            </ul>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={10} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">7. GDPR Compliance (European Users)</h2>
            <p className="mb-3">
              If you are a resident of the European Economic Area (EEA), you have certain data protection rights under the
              General Data Protection Regulation (GDPR). We aim to take reasonable steps to allow you to correct, amend,
              delete, or limit the use of your personal data. You have the right to:
            </p>
            <ul className="space-y-1.5 ml-4">
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span><span>Access, update, or delete your personal information.</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span><span>Rectify inaccurate or incomplete data.</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span><span>Object to the processing of your personal data.</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span><span>Request data portability.</span></li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 mt-0.5">•</span><span>Withdraw consent at any time where we relied on your consent to process your personal information.</span></li>
            </ul>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={11} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">8. CCPA Compliance (California Users)</h2>
            <p>
              Under the California Consumer Privacy Act (CCPA), California consumers have the right to request that a business
              that collects personal data disclose the categories and specific pieces of personal data it has collected. You also
              have the right to request deletion of your personal data and to opt out of the sale of your personal data. We do
              not sell personal data to third parties.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={12} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">9. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your personal information. Your data is stored in
              Supabase with Row Level Security (RLS) enabled, ensuring that users can only access their own data. All
              communication between your browser and our servers is encrypted using HTTPS/TLS. However, no method of transmission
              over the internet is 100% secure, and we cannot guarantee absolute security.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={13} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">10. Children&apos;s Privacy</h2>
            <p>
              Contextle.online does not knowingly collect personal information from children under the age of 13. If we become
              aware that we have collected personal data from a child under 13 without verification of parental consent, we
              will take steps to remove that information from our servers.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={14} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated
              revision date. We encourage you to review this Privacy Policy periodically to stay informed about how we are
              protecting your information.
            </p>
          </motion.section>

          <motion.section initial="hidden" animate="visible" custom={15} variants={fadeUp}>
            <h2 className="text-base font-semibold text-neutral-200 mb-3">12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:{" "}
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
          custom={16}
          variants={fadeUp}
          className="mt-12 pt-6 border-t border-white/[0.04] flex flex-wrap gap-4 text-[11px] text-neutral-600"
        >
          <Link href="/about" className="hover:text-cyan-400 transition-colors">About Us</Link>
          <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
          <Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact Us</Link>
        </motion.div>
      </div>
    </div>
  );
}
