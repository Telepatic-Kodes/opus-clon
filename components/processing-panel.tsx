"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RotateCcw, CheckCircle2 } from "lucide-react";
import type { JobStatus, JobStatusResponse } from "@/types";
import ClipsGrid from "./clips-grid";

interface ProcessingPanelProps {
  jobId: string;
  onReset: () => void;
}

const STATUS_LABELS: Record<JobStatus, string> = {
  queued: "Preparando el video…",
  downloading: "Descargando video…",
  transcribing: "Transcribiendo audio con IA…",
  analyzing: "Buscando momentos virales…",
  cutting: "Creando tus clips…",
  done: "¡Tus clips están listos!",
  error: "Algo salió mal",
};

// Approximate progress thresholds per status for smooth visual feedback
const STATUS_PROGRESS: Record<JobStatus, number> = {
  queued: 5,
  downloading: 20,
  transcribing: 45,
  analyzing: 70,
  cutting: 88,
  done: 100,
  error: 0,
};

const TERMINAL_STATUSES: JobStatus[] = ["done", "error"];
const POLL_INTERVAL_MS = 2000;

/** Parse "Creando clip N de M" from message field */
function parseCuttingProgress(message: string): { current: number; total: number } | null {
  const match = /clip\s+(\d+)\s+de\s+(\d+)/i.exec(message);
  if (!match) return null;
  return { current: parseInt(match[1], 10), total: parseInt(match[2], 10) };
}

/** Format milliseconds into "Xm Ys" or "menos de 1 min" */
function formatRemaining(ms: number): string {
  const totalSecs = Math.max(0, Math.round(ms / 1000));
  if (totalSecs < 60) return "menos de 1 min";
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export default function ProcessingPanel({ jobId, onReset }: ProcessingPanelProps) {
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  /** When processing truly began (status left "queued") */
  const startTimeRef = useRef<number | null>(null);
  /** Tracks if we've already sent the "done" browser notification */
  const notifiedRef = useRef<boolean>(false);
  /** Previous status so we can detect the queued→downloading transition */
  const prevStatusRef = useRef<JobStatus>("queued");

  const stopPolling = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const poll = async () => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const data = (await res.json()) as JobStatusResponse;
      setJob(data);
      setFetchError(null);

      // Feature 3: record start time when leaving "queued"
      if (
        prevStatusRef.current === "queued" &&
        data.status !== "queued" &&
        startTimeRef.current === null
      ) {
        startTimeRef.current = Date.now();
      }
      prevStatusRef.current = data.status;

      // Feature 3: compute estimated remaining time
      if (
        startTimeRef.current !== null &&
        data.status !== "done" &&
        data.status !== "error"
      ) {
        const elapsed = Date.now() - startTimeRef.current;
        const prog = data.progress ?? STATUS_PROGRESS[data.status];
        if (prog > 0) {
          const estimatedTotal = elapsed / (prog / 100);
          const rem = estimatedTotal - elapsed;
          setRemaining(rem > 0 ? rem : null);
        }
      } else {
        setRemaining(null);
      }

      // Feature 1: browser notification when done
      if (data.status === "done" && !notifiedRef.current) {
        notifiedRef.current = true;
        if (
          typeof window !== "undefined" &&
          "Notification" in window
        ) {
          const clipCount = data.clips?.length ?? 0;
          const fire = () => {
            new Notification("¡Tus clips están listos! 🎬", {
              body: `${clipCount} clips virales generados con IA. Haz clic para verlos.`,
              icon: "/favicon.ico",
            });
          };
          if (Notification.permission === "granted") {
            fire();
          } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then((perm) => {
              if (perm === "granted") fire();
            });
          }
        }
      }

      if (TERMINAL_STATUSES.includes(data.status)) {
        stopPolling();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch job status";
      setFetchError(message);
    }
  };

  useEffect(() => {
    // Kick off immediately, then set interval
    void poll();
    intervalRef.current = setInterval(() => void poll(), POLL_INTERVAL_MS);

    return () => stopPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const status: JobStatus = job?.status ?? "queued";
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const isDone = status === "done";
  const isError = status === "error" || fetchError !== null;

  // Smooth progress: use server-reported value when available, fall back to status-based estimate
  const rawProgress = job?.progress ?? STATUS_PROGRESS[status];
  // Clamp to 0-100 and never go backwards
  const progress = Math.max(0, Math.min(100, rawProgress));

  const statusLabel = fetchError
    ? "Error de conexión — reintentando…"
    : STATUS_LABELS[status];

  // Feature 4: cutting progress parsed from message
  const cuttingProgress = status === "cutting" && job?.message
    ? parseCuttingProgress(job.message)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full max-w-5xl mx-auto px-4 sm:px-6"
    >
      {/* Processing card (shown while not done) */}
      <AnimatePresence mode="wait">
        {!isDone && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            transition={{ duration: 0.3 }}
            className="bg-[#111] border border-[#262626] rounded-2xl p-8 mb-8"
          >
            {isError && !fetchError ? (
              /* Error state */
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20
                                flex items-center justify-center">
                  <AlertCircle className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">El procesamiento falló</h3>
                  <p className="text-[#a3a3a3] text-sm max-w-sm mx-auto">
                    {job?.error ?? "Ocurrió un error inesperado al procesar tu video."}
                  </p>
                </div>
                <button
                  onClick={onReset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-[#1a1a1a] border border-[#262626] hover:border-violet-500/40
                             text-white text-sm font-semibold transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  Intentar de nuevo
                </button>
              </div>
            ) : (
              /* Processing / progress state */
              <div className="flex flex-col items-center gap-6">
                {/* Animated icon */}
                <div className="relative w-16 h-16">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-2 border-transparent
                               border-t-violet-500 border-r-violet-500/50"
                  />
                  <div className="absolute inset-2 rounded-full bg-violet-500/10
                                  flex items-center justify-center">
                    <div className="w-3 h-3 rounded-full bg-violet-500 animate-pulse" />
                  </div>
                </div>

                {/* Status label */}
                <AnimatePresence mode="wait">
                  <motion.p
                    key={statusLabel}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="text-base font-medium text-white"
                  >
                    {statusLabel}
                  </motion.p>
                </AnimatePresence>

                {/* Feature 4: analyzing pulse + cutting progress */}
                <AnimatePresence mode="wait">
                  {status === "analyzing" && (
                    <motion.p
                      key="analyzing-hint"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm text-[#a3a3a3] flex items-center gap-1.5"
                    >
                      <span>🔍 Analizando momentos virales</span>
                      <span className="animate-pulse font-bold text-violet-400">…</span>
                    </motion.p>
                  )}
                  {status === "cutting" && cuttingProgress && (
                    <motion.p
                      key={`cutting-${cuttingProgress.current}`}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm text-[#a3a3a3]"
                    >
                      ✂ Creando clip{" "}
                      <span className="animate-pulse font-semibold text-violet-300">
                        {cuttingProgress.current}
                      </span>{" "}
                      de {cuttingProgress.total}…
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Progress bar */}
                <div className="w-full max-w-sm">
                  <div className="h-2 rounded-full bg-[#1a1a1a] border border-[#262626] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400
                                 transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-[#525252]">
                      {fetchError ? "Reintentando…" : "Procesando"}
                    </span>
                    <span className="text-xs text-[#525252]">{Math.round(progress)}%</span>
                  </div>

                  {/* Feature 3: Estimated time remaining */}
                  {remaining !== null && !isError && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-1.5 text-xs text-[#525252] text-center"
                    >
                      ⏱ Tiempo estimado: ~{formatRemaining(remaining)}
                    </motion.p>
                  )}
                </div>

                {/* Step pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {(["downloading", "transcribing", "analyzing", "cutting"] as JobStatus[]).map(
                    (step) => {
                      const stepProgress = STATUS_PROGRESS[step];
                      const currentProgress = STATUS_PROGRESS[status] ?? 0;
                      const isDoneStep = currentProgress > stepProgress;
                      const isActive = status === step;

                      return (
                        <div
                          key={step}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-all duration-300 ${
                            isDoneStep
                              ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                              : isActive
                              ? "bg-violet-600/20 border-violet-500/50 text-violet-300"
                              : "bg-[#0a0a0a] border-[#262626] text-[#525252]"
                          }`}
                        >
                          {isDoneStep && (
                            <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />
                          )}
                          {STATUS_LABELS[step]}
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Job ID reference */}
                <p className="text-xs text-[#404040]">
                  Job ID: <span className="font-mono">{jobId}</span>
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Done state — show clips */}
      <AnimatePresence>
        {isDone && job && (
          <motion.div
            key="clips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <ClipsGrid clips={job.clips} jobId={jobId} onReset={onReset} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fetch/network error banner (non-terminal) */}
      <AnimatePresence>
        {fetchError && !isTerminal && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl
                       bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{fetchError} — se reintentará automáticamente.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
