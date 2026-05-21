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
  queued: "Getting video ready…",
  downloading: "Downloading video…",
  transcribing: "Transcribing audio with AI…",
  analyzing: "Finding viral moments…",
  cutting: "Creating your clips…",
  done: "Your clips are ready!",
  error: "Something went wrong",
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

export default function ProcessingPanel({ jobId, onReset }: ProcessingPanelProps) {
  const [job, setJob] = useState<JobStatusResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    ? "Connection error — retrying…"
    : STATUS_LABELS[status];

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
                  <h3 className="text-lg font-semibold text-white mb-2">Processing failed</h3>
                  <p className="text-[#a3a3a3] text-sm max-w-sm mx-auto">
                    {job?.error ?? "An unexpected error occurred while processing your video."}
                  </p>
                </div>
                <button
                  onClick={onReset}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                             bg-[#1a1a1a] border border-[#262626] hover:border-violet-500/40
                             text-white text-sm font-semibold transition-all duration-200"
                >
                  <RotateCcw className="w-4 h-4" />
                  Try again
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
                      {fetchError ? "Retrying…" : "Processing"}
                    </span>
                    <span className="text-xs text-[#525252]">{Math.round(progress)}%</span>
                  </div>
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
            <span>{fetchError} — will retry automatically.</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
