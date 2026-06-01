"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Plus,
  X,
  ListVideo,
  Settings,
  Play,
  Link2,
} from "lucide-react";
import type { ProcessVideoResponse, JobStatus } from "@/types";
import ProcessingPanel from "./processing-panel";
import { saveJob } from "@/lib/local-jobs";

const MAX_QUEUE = 5;

// ── Settings helpers ────────────────────────────────────────────────────────

interface ActiveSettings {
  model: string;
  clipCount: number;
  minDuration: number;
  maxDuration: number;
  formats: string[];
}

const SETTINGS_DEFAULTS: ActiveSettings = {
  model: "gpt-4o",
  clipCount: 8,
  minDuration: 15,
  maxDuration: 90,
  formats: ["9:16", "1:1", "16:9"],
};

/** Reads all configurable processing settings from localStorage. */
function getSettings(): ActiveSettings {
  if (typeof window === "undefined") return SETTINGS_DEFAULTS;

  const model = localStorage.getItem("opus_settings_model") ?? SETTINGS_DEFAULTS.model;
  const clipCount = parseInt(localStorage.getItem("opus_settings_clip_count") ?? String(SETTINGS_DEFAULTS.clipCount), 10);
  const minDuration = parseInt(localStorage.getItem("opus_settings_min_duration") ?? String(SETTINGS_DEFAULTS.minDuration), 10);
  const maxDuration = parseInt(localStorage.getItem("opus_settings_max_duration") ?? String(SETTINGS_DEFAULTS.maxDuration), 10);

  // formats is stored as { tiktok: boolean, instagram: boolean, youtube: boolean }
  let formats = SETTINGS_DEFAULTS.formats;
  try {
    const raw = localStorage.getItem("opus_settings_formats");
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, boolean>;
      const mapped: string[] = [];
      if (parsed.tiktok)    mapped.push("9:16");
      if (parsed.instagram) mapped.push("1:1");
      if (parsed.youtube)   mapped.push("16:9");
      if (mapped.length > 0) formats = mapped;
    }
  } catch {
    // keep default
  }

  return {
    model: model || SETTINGS_DEFAULTS.model,
    clipCount: isNaN(clipCount) ? SETTINGS_DEFAULTS.clipCount : clipCount,
    minDuration: isNaN(minDuration) ? SETTINGS_DEFAULTS.minDuration : minDuration,
    maxDuration: isNaN(maxDuration) ? SETTINGS_DEFAULTS.maxDuration : maxDuration,
    formats,
  };
}

function isNonDefault(s: ActiveSettings): boolean {
  return (
    s.model !== SETTINGS_DEFAULTS.model ||
    s.clipCount !== SETTINGS_DEFAULTS.clipCount ||
    s.minDuration !== SETTINGS_DEFAULTS.minDuration ||
    s.maxDuration !== SETTINGS_DEFAULTS.maxDuration
  );
}

const demoClips = [
  { label: "Vlog", duration: "45 min" },
  { label: "Podcast", duration: "1.5 hrs" },
  { label: "Deportes", duration: "2 hrs" },
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

function truncateBadgeUrl(url: string, max = 40): string {
  try {
    const u = new URL(url);
    const display = u.hostname + u.pathname + u.search;
    return display.length > max ? display.slice(0, max) + "…" : display;
  } catch {
    return url.length > max ? url.slice(0, max) + "…" : url;
  }
}

const ACTIVE_STATUSES: Set<JobStatus> = new Set([
  "queued",
  "downloading",
  "transcribing",
  "analyzing",
  "cutting",
]);

export default function Hero() {
  const [url, setUrl] = useState("");
  const [urlQueue, setUrlQueue] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [activeSettings, setActiveSettings] = useState<ActiveSettings>(SETTINGS_DEFAULTS);

  // Queue processing state
  const [queueActive, setQueueActive] = useState(false);
  const [queueTotal, setQueueTotal] = useState(0);
  const [queueIndex, setQueueIndex] = useState(0); // 1-based current index

  const resultsRef = useRef<HTMLDivElement>(null);

  // Load settings from localStorage on mount (client-side only)
  useEffect(() => {
    setActiveSettings(getSettings());
  }, []);

  // ── Reset to initial state ──────────────────────────────────────────────────
  const handleReset = () => {
    setJobId(null);
    setUrl("");
    setSubmitError(null);
    setIsSubmitting(false);
    setQueueActive(false);
    setQueueTotal(0);
    setQueueIndex(0);
    setUrlQueue([]);
  };

  // ── Submit a single URL to the API, returns jobId ──────────────────────────
  const submitUrl = async (submittedUrl: string): Promise<string> => {
    const settings = getSettings();
    // Refresh the badge to reflect the snapshot used for this job
    setActiveSettings(settings);
    const res = await fetch("/api/process-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: submittedUrl, ...settings }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Server error ${res.status}`);
    }

    const data = (await res.json()) as ProcessVideoResponse;
    saveJob(data.jobId, submittedUrl);
    return data.jobId;
  };

  // ── Poll until a job reaches done or error ─────────────────────────────────
  const waitForJob = async (id: string): Promise<void> => {
    return new Promise<void>((resolve) => {
      const poll = setInterval(async () => {
        try {
          const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
          if (!res.ok) {
            clearInterval(poll);
            resolve();
            return;
          }
          const data = (await res.json()) as { status: JobStatus };
          if (!ACTIVE_STATUSES.has(data.status)) {
            clearInterval(poll);
            resolve();
          }
        } catch {
          clearInterval(poll);
          resolve();
        }
      }, 3000);
    });
  };

  // ── Scroll to results ───────────────────────────────────────────────────────
  const scrollToResults = () => {
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  // ── Process a single URL (no queue) ───────────────────────────────────────
  const handleSubmitSingle = async (submittedUrl: string) => {
    if (!isValidUrl(submittedUrl)) {
      setSubmitError("Por favor ingresa una URL válida con http:// o https://");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const id = await submitUrl(submittedUrl);
      setJobId(id);
      scrollToResults();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar el procesamiento";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Process queue sequentially ─────────────────────────────────────────────
  const handleProcessQueue = async (urls: string[]) => {
    setQueueActive(true);
    setQueueTotal(urls.length);
    setQueueIndex(1);
    setSubmitError(null);
    setIsSubmitting(true);
    setUrlQueue([]);

    try {
      for (let i = 0; i < urls.length; i++) {
        setQueueIndex(i + 1);
        const id = await submitUrl(urls[i]);
        setJobId(id);
        if (i === 0) scrollToResults();
        await waitForJob(id);
        // Small pause between jobs
        if (i < urls.length - 1) {
          await new Promise<void>((r) => setTimeout(r, 800));
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al procesar la cola";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
      setQueueActive(false);
    }
  };

  // ── Form submit: process URL + queue ──────────────────────────────────────
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();

    if (urlQueue.length > 0) {
      // Build full list: current URL + queued URLs
      const allUrls = trimmed ? [trimmed, ...urlQueue] : [...urlQueue];
      if (allUrls.length === 0) return;
      if (trimmed && !isValidUrl(trimmed)) {
        setSubmitError("Por favor ingresa una URL válida con http:// o https://");
        return;
      }
      void handleProcessQueue(allUrls);
    } else {
      void handleSubmitSingle(trimmed);
    }
  };

  // ── Add current URL to queue ───────────────────────────────────────────────
  const handleAddToQueue = () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    if (!isValidUrl(trimmed)) {
      setSubmitError("Por favor ingresa una URL válida con http:// o https://");
      return;
    }
    if (urlQueue.length >= MAX_QUEUE) return;
    setUrlQueue((prev) => [...prev, trimmed]);
    setUrl("");
    setSubmitError(null);
  };

  // ── Remove a URL from queue ────────────────────────────────────────────────
  const handleRemoveFromQueue = (index: number) => {
    setUrlQueue((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Demo click ─────────────────────────────────────────────────────────────
  const handleDemoClick = (label: string) => {
    const demoUrl = DEMO_URLS[label] ?? "";
    setUrl(demoUrl);
    void handleSubmitSingle(demoUrl);
  };

  const canAddToQueue = url.trim() !== "" && urlQueue.length < MAX_QUEUE;
  const canSubmit = !isSubmitting && (url.trim() !== "" || urlQueue.length > 0);

  return (
    <div>
      {/* ─── Hero section ───────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-16 px-6 lg:px-12">
        {/* Grid background */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />

        {/* Glow orb — verde lima */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full blur-[120px] pointer-events-none"
          style={{ background: "rgba(168,255,0,0.06)" }}
        />

        <div className="relative z-10 max-w-6xl mx-auto w-full">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-3 mb-8"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest" style={{ color: "#6B6D82" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#A8FF00] animate-pulse" />
              Sistema activo
            </span>
            <span style={{ color: "#2E3050" }}>|</span>
            <span className="text-xs uppercase tracking-widest" style={{ color: "#6B6D82" }}>16M+ creadores</span>
          </motion.div>

          {/* HEADLINE — Unbounded, massive, left-aligned */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-black uppercase leading-[0.9] mb-10 tracking-tight"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(52px, 8vw, 120px)",
            }}
          >
            <span className="block" style={{ color: "#A8FF00" }}>CONVIERTE</span>
            <span className="block text-white">CUALQUIER</span>
            <span className="block text-white">VIDEO EN</span>
            <span className="block" style={{ color: "#A8FF00" }}>CLIPS VIRALES.</span>
          </motion.h1>

          {/* Subtitle — DM Mono */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm mb-10 max-w-lg leading-relaxed"
            style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
          >
            IA que detecta, extrae y exporta tus mejores momentos.<br />
            <span style={{ color: "#4B4D62" }}>GPT-4o · Whisper · FFmpeg · 9:16 · 1:1 · 16:9</span>
          </motion.p>

          {/* URL INPUT AREA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mb-4"
          >
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-0 mb-4">
              <div
                className={`flex-1 flex items-center gap-3 px-4 py-4 border transition-colors ${
                  submitError
                    ? "border-[#FF3B3B]"
                    : "border-[#1E2030] focus-within:border-[#A8FF00]/50"
                }`}
                style={{ background: "#12131A" }}
              >
                <span
                  className="text-sm flex-shrink-0"
                  style={{ color: "#A8FF00", fontFamily: "var(--font-mono)" }}
                >
                  ▸
                </span>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (submitError) setSubmitError(null);
                  }}
                  placeholder="pega la URL del video..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#3B3D52]"
                  style={{ fontFamily: "var(--font-mono)", color: "#F0F0F2" }}
                  disabled={isSubmitting}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              {/* Add to queue button */}
              <button
                type="button"
                onClick={handleAddToQueue}
                disabled={isSubmitting || !canAddToQueue}
                title={urlQueue.length >= MAX_QUEUE ? `Máximo ${MAX_QUEUE} URLs` : "Añadir a la cola"}
                className="flex items-center justify-center gap-2 px-4 py-4
                           text-xs uppercase tracking-widest whitespace-nowrap
                           border border-l-0 border-[#1E2030]
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-colors duration-150"
                style={{
                  background: "#12131A",
                  color: "#6B6D82",
                  fontFamily: "var(--font-mono)",
                }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) e.currentTarget.style.color = "#F0F0F2";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#6B6D82";
                }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">+COLA</span>
              </button>

              {/* Main submit button */}
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-8 py-4 font-black uppercase tracking-widest text-sm
                           transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isSubmitting ? "#6B7A00" : "#A8FF00",
                  color: "#0B0C10",
                  fontFamily: "var(--font-display)",
                }}
              >
                {isSubmitting
                  ? queueActive
                    ? `${queueIndex}/${queueTotal}...`
                    : "PROCESANDO..."
                  : urlQueue.length > 0
                  ? `PROCESAR ${urlQueue.length + (url.trim() ? 1 : 0)} →`
                  : "PROCESAR →"}
              </button>
            </form>

            {/* Active settings badge — shown when settings differ from defaults */}
            {isNonDefault(activeSettings) && (
              <div
                className="flex items-center gap-2 text-xs mb-3"
                style={{ color: "#4B4D62", fontFamily: "var(--font-mono)" }}
              >
                <Settings className="w-3 h-3" />
                <span>
                  {activeSettings.model} · {activeSettings.clipCount} clips · {activeSettings.minDuration}s–{activeSettings.maxDuration}s
                </span>
                <a
                  href="/dashboard/settings"
                  className="transition-colors"
                  style={{ color: "#A8FF00" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#A8FF00")}
                >
                  Cambiar
                </a>
              </div>
            )}

            {/* Queue progress indicator */}
            <AnimatePresence>
              {queueActive && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 mb-3 text-xs"
                  style={{ color: "#A8FF00", fontFamily: "var(--font-mono)" }}
                >
                  <ListVideo className="w-3.5 h-3.5 flex-shrink-0" />
                  PROCESANDO {queueIndex} DE {queueTotal} VIDEOS
                  <div
                    className="flex-1 max-w-[120px] h-0.5 overflow-hidden"
                    style={{ background: "#1E2030" }}
                  >
                    <motion.div
                      className="h-full"
                      style={{ background: "#A8FF00" }}
                      animate={{ width: `${(queueIndex / queueTotal) * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* URL Queue badges */}
            <AnimatePresence>
              {urlQueue.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mb-3"
                >
                  <div className="flex flex-col gap-1.5 text-left">
                    <p
                      className="text-xs mb-1 flex items-center gap-1 uppercase tracking-widest"
                      style={{ color: "#4B4D62", fontFamily: "var(--font-mono)" }}
                    >
                      <ListVideo className="w-3 h-3" />
                      Cola ({urlQueue.length}/{MAX_QUEUE})
                    </p>
                    {urlQueue.map((queuedUrl, i) => (
                      <motion.div
                        key={`${queuedUrl}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2 px-3 py-2 border group"
                        style={{ background: "#12131A", borderColor: "#1E2030" }}
                      >
                        <Link2 className="w-3 h-3 flex-shrink-0" style={{ color: "#4B4D62" }} />
                        <span
                          className="flex-1 text-xs truncate"
                          style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
                        >
                          {truncateBadgeUrl(queuedUrl)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromQueue(i)}
                          disabled={isSubmitting}
                          className="p-0.5 transition-colors disabled:opacity-40"
                          style={{ color: "#4B4D62" }}
                          title="Eliminar de la cola"
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#FF3B3B")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#4B4D62")
                          }
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            <AnimatePresence>
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 mb-3 text-xs"
                  style={{ color: "#FF3B3B", fontFamily: "var(--font-mono)" }}
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {submitError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Trust row — platforms + demo clips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3"
          >
            <span
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
            >
              Compatible:
            </span>
            {["YouTube", "Zoom", "Loom", "Podcast"].map((platform) => (
              <span
                key={platform}
                className="text-xs uppercase tracking-widest"
                style={{ fontFamily: "var(--font-mono)", color: "#3B3D52" }}
              >
                {platform}
              </span>
            ))}
          </motion.div>

          {/* Demo clips */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-wrap items-center gap-2 mb-12"
          >
            <span
              className="text-xs uppercase tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
            >
              Demo:
            </span>
            {demoClips.map((clip) => (
              <button
                key={clip.label}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleDemoClick(clip.label)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-widest
                           border disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-150"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "#6B6D82",
                  borderColor: "#1E2030",
                  background: "#12131A",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#F0F0F2";
                  e.currentTarget.style.borderColor = "#A8FF00";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#6B6D82";
                  e.currentTarget.style.borderColor = "#1E2030";
                }}
              >
                <Play className="w-2.5 h-2.5 fill-current" />
                {clip.label}
                <span style={{ color: "#4B4D62" }}>· {clip.duration}</span>
              </button>
            ))}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex items-center gap-8 pt-8 border-t"
            style={{ borderColor: "#1E2030" }}
          >
            {[
              { value: "16M+", label: "CREATORS" },
              { value: "10×", label: "MÁS RÁPIDO" },
              { value: "90%", label: "TIEMPO AHORRADO" },
            ].map((s) => (
              <div key={s.label}>
                <div
                  className="font-black text-2xl"
                  style={{ fontFamily: "var(--font-display)", color: "#A8FF00" }}
                >
                  {s.value}
                </div>
                <div
                  className="text-xs tracking-widest"
                  style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
                >
                  {s.label}
                </div>
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
              <span
                className="text-xs uppercase tracking-widest"
                style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
              >
                Scroll
              </span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
                style={{ borderColor: "#1E2030" }}
              >
                <div className="w-1 h-2 rounded-full" style={{ background: "#A8FF00" }} />
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
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16"
              style={{
                background: "linear-gradient(to bottom, transparent, rgba(168,255,0,0.4), transparent)",
              }}
            />

            <div className="max-w-6xl mx-auto">
              {/* Section header */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="text-center mb-10"
              >
                <h2
                  className="text-2xl sm:text-3xl font-bold text-white mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {queueActive
                    ? `Procesando video ${queueIndex} de ${queueTotal}`
                    : "La IA está procesando tu video"}
                </h2>
                <p
                  className="text-sm"
                  style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
                >
                  Espera un momento — suele tardar entre 1 y 3 minutos.
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
