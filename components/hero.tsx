"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Link2, Sparkles, Users, Play, AlertCircle } from "lucide-react";
import type { ProcessVideoResponse } from "@/types";
import ProcessingPanel from "./processing-panel";

const demoClips = [
  { label: "Vlog", duration: "45 min" },
  { label: "Podcast", duration: "1.5 hrs" },
  { label: "Sports", duration: "2 hrs" },
];

// Demo URLs for each type — replace with real samples when available
const DEMO_URLS: Record<string, string> = {
  Vlog: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  Podcast: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  Sports: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
};

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export default function Hero() {
  const [url, setUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setJobId(null);
    setUrl("");
    setSubmitError(null);
    setIsSubmitting(false);
  };

  const handleSubmit = async (submittedUrl: string) => {
    if (!isValidUrl(submittedUrl)) {
      setSubmitError("Please enter a valid http:// or https:// URL.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/process-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: submittedUrl }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? `Server error ${res.status}`);
      }

      const data = (await res.json()) as ProcessVideoResponse;
      setJobId(data.jobId);

      // Scroll to results panel
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start processing";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void handleSubmit(url);
  };

  const handleDemoClick = (label: string) => {
    const demoUrl = DEMO_URLS[label] ?? "";
    setUrl(demoUrl);
    void handleSubmit(demoUrl);
  };

  return (
    <div>
      {/* ─── Hero section ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
        {/* Background gradient orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-violet-800/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 right-1/4 w-[350px] h-[350px] bg-purple-600/8 rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-sm font-medium"
          >
            <Users className="w-3.5 h-3.5" />
            Used by 16M+ creators and businesses
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.05]"
          >
            1 long video,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              10 viral clips.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-[#a3a3a3] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            OpusClip turns your long videos into shorts and publishes them to all
            social platforms in one click. Create 10× faster with AI.
          </motion.p>

          {/* URL Input form */}
          <motion.form
            onSubmit={handleFormSubmit}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-3"
          >
            <div
              className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl bg-[#111]
                          border transition-colors group
                          ${submitError
                            ? "border-red-500/60"
                            : "border-[#262626] hover:border-violet-500/50 focus-within:border-violet-500/70"
                          }`}
            >
              <Link2
                className={`w-4 h-4 flex-shrink-0 transition-colors
                            ${submitError
                              ? "text-red-400"
                              : "text-[#525252] group-focus-within:text-violet-400"
                            }`}
              />
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (submitError) setSubmitError(null);
                }}
                placeholder="Paste a YouTube, Zoom, or Podcast URL…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#525252] outline-none"
                disabled={isSubmitting}
                autoComplete="off"
                spellCheck={false}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !url.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                         font-semibold text-sm text-white whitespace-nowrap
                         bg-gradient-to-r from-violet-600 to-violet-500
                         hover:from-violet-500 hover:to-violet-400
                         disabled:from-violet-800 disabled:to-violet-700 disabled:opacity-60
                         transition-all duration-200
                         shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50
                         disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white"
                  />
                  Processing…
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Get free clips
                </>
              )}
            </button>
          </motion.form>

          {/* Error message */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center gap-2 mb-3
                           text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {submitError}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Demo options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            <span className="text-xs text-[#525252]">Try with a demo:</span>
            {demoClips.map((clip) => (
              <button
                key={clip.label}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDemoClick(clip.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           text-xs text-[#a3a3a3] hover:text-white
                           border border-[#262626] hover:border-[#404040]
                           bg-[#111] hover:bg-[#1a1a1a]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all"
              >
                <Play className="w-3 h-3 fill-current" />
                {clip.label}
                <span className="text-[#525252]">· {clip.duration}</span>
              </button>
            ))}
          </motion.div>

          {/* Social proof stats */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto"
          >
            {[
              { value: "16M+", label: "Creators" },
              { value: "10×", label: "Faster workflow" },
              { value: "90%", label: "Time saved" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-[#737373] mt-0.5">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator — hide when a job is active */}
        <AnimatePresence>
          {!jobId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
            >
              <span className="text-xs text-[#525252]">Scroll to explore</span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                className="w-5 h-8 rounded-full border border-[#262626] flex items-start justify-center pt-1.5"
              >
                <div className="w-1 h-2 rounded-full bg-violet-500" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* ─── Results area ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {jobId && (
          <motion.section
            ref={resultsRef}
            key={jobId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="relative py-16 px-4"
          >
            {/* Subtle top separator */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16
                            bg-gradient-to-b from-transparent via-violet-500/40 to-transparent" />

            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-center mb-10"
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  AI is working on your video
                </h2>
                <p className="text-[#a3a3a3] text-sm">
                  Sit tight — this usually takes 1–3 minutes.
                </p>
              </motion.div>

              <ProcessingPanel jobId={jobId} onReset={handleReset} />
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
