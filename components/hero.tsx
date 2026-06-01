"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Link2,
  Sparkles,
  Users,
  Play,
  AlertCircle,
  Plus,
  X,
  ListVideo,
  Settings,
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
            Usado por más de 16M de creadores y empresas
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.05]"
          >
            1 video largo,{" "}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              10 clips virales.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg sm:text-xl text-[#a3a3a3] max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            OpusClip convierte tus videos largos en shorts y los publica en todas
            las redes sociales con un clic. Crea 10× más rápido con IA.
          </motion.p>

          {/* URL Input form */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-3"
          >
            <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row gap-3 mb-3">
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
                  placeholder="Pega una URL de YouTube, Zoom o Podcast…"
                  className="flex-1 bg-transparent text-sm text-white placeholder:text-[#525252] outline-none"
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
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                           font-semibold text-sm text-[#a3a3a3] whitespace-nowrap
                           bg-[#111] border border-[#262626]
                           hover:text-white hover:border-violet-500/50 hover:bg-[#1a1a1a]
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Añadir a cola</span>
              </button>

              {/* Main submit button */}
              <button
                type="submit"
                disabled={!canSubmit}
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
                    {queueActive ? `${queueIndex} de ${queueTotal}…` : "Procesando…"}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {urlQueue.length > 0
                      ? `Procesar ${urlQueue.length + (url.trim() ? 1 : 0)} videos`
                      : "Obtener clips gratis"}
                  </>
                )}
              </button>
            </form>

            {/* Active settings badge — shown when settings differ from defaults */}
            {isNonDefault(activeSettings) && (
              <div className="flex items-center justify-center gap-2 text-xs text-[#525252] mb-3">
                <Settings className="w-3 h-3" />
                <span>
                  Modelo: {activeSettings.model} · {activeSettings.clipCount} clips · {activeSettings.minDuration}s–{activeSettings.maxDuration}s
                </span>
                <a href="/dashboard/settings" className="text-violet-400 hover:text-violet-300 transition-colors">
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
                  className="flex items-center justify-center gap-2 mb-3 text-violet-400 text-sm"
                >
                  <ListVideo className="w-4 h-4 flex-shrink-0" />
                  Procesando {queueIndex} de {queueTotal} videos
                  <div className="flex-1 max-w-[120px] h-1 rounded-full bg-[#1f1f1f] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-violet-500"
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
                    <p className="text-xs text-[#525252] mb-1 flex items-center gap-1">
                      <ListVideo className="w-3 h-3" />
                      Cola de procesamiento ({urlQueue.length}/{MAX_QUEUE})
                    </p>
                    {urlQueue.map((queuedUrl, i) => (
                      <motion.div
                        key={`${queuedUrl}-${i}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#262626] group"
                      >
                        <Link2 className="w-3 h-3 text-[#525252] flex-shrink-0" />
                        <span className="flex-1 text-xs text-[#a3a3a3] truncate font-mono">
                          {truncateBadgeUrl(queuedUrl)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFromQueue(i)}
                          disabled={isSubmitting}
                          className="p-0.5 rounded text-[#525252] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                          title="Eliminar de la cola"
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
                  className="flex items-center justify-center gap-2 mb-3
                             text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {submitError}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Demo options */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex items-center justify-center gap-2 flex-wrap"
          >
            <span className="text-xs text-[#525252]">Prueba con un demo:</span>
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
              { value: "16M+", label: "Creadores" },
              { value: "10×", label: "Flujo más rápido" },
              { value: "90%", label: "Tiempo ahorrado" },
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
              <span className="text-xs text-[#525252]">Desliza para explorar</span>
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
                  {queueActive
                    ? `Procesando video ${queueIndex} de ${queueTotal}`
                    : "La IA está procesando tu video"}
                </h2>
                <p className="text-[#a3a3a3] text-sm">
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
