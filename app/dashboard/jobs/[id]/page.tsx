"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Film,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job, Clip, JobStatus } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function StatusBadge({ status }: { status: JobStatus }) {
  const configs: Record<JobStatus, { label: string; className: string; icon: React.ReactNode }> = {
    done: {
      label: "Done",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    error: {
      label: "Error",
      className: "bg-red-500/15 text-red-400 border-red-500/25",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    queued: {
      label: "Queued",
      className: "bg-[#262626] text-[#737373] border-[#333]",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    downloading: {
      label: "Downloading",
      className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    transcribing: {
      label: "Transcribing",
      className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    analyzing: {
      label: "Analyzing",
      className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    cutting: {
      label: "Cutting clips",
      className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
  };

  const cfg = configs[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium",
        cfg.className
      )}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Progress panel ───────────────────────────────────────────────────────────

const STEPS: { status: JobStatus; label: string }[] = [
  { status: "queued", label: "Queued" },
  { status: "downloading", label: "Downloading video" },
  { status: "transcribing", label: "Transcribing audio" },
  { status: "analyzing", label: "Finding viral moments" },
  { status: "cutting", label: "Cutting clips" },
  { status: "done", label: "Complete" },
];

const STATUS_ORDER: Record<JobStatus, number> = {
  queued: 0,
  downloading: 1,
  transcribing: 2,
  analyzing: 3,
  cutting: 4,
  done: 5,
  error: 6,
};

function ProgressPanel({ job }: { job: Job }) {
  const currentIdx = STATUS_ORDER[job.status] ?? 0;

  return (
    <div className="rounded-2xl border border-[#262626] bg-[#111] p-6">
      <h2 className="text-sm font-semibold text-white mb-5">Processing status</h2>

      {/* Step list */}
      <div className="space-y-3 mb-6">
        {STEPS.filter((s) => s.status !== "done").map((step, i) => {
          const stepIdx = STATUS_ORDER[step.status];
          const isDone = stepIdx < currentIdx;
          const isActive = stepIdx === currentIdx;
          const isPending = stepIdx > currentIdx;

          return (
            <div key={step.status} className="flex items-center gap-3">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0",
                  isDone && "bg-emerald-500/20 text-emerald-400",
                  isActive && "bg-violet-500/20 text-violet-400",
                  isPending && "bg-[#1f1f1f] text-[#525252]"
                )}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span className="text-[9px] font-bold">{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-sm",
                  isDone && "text-[#737373]",
                  isActive && "text-white font-medium",
                  isPending && "text-[#525252]"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <span className="text-xs text-[#737373]">{job.message}</span>
          <span className="text-xs text-violet-400 font-medium">{job.progress}%</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[#1f1f1f] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
            initial={{ width: 0 }}
            animate={{ width: `${job.progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Clip card ────────────────────────────────────────────────────────────────

function ClipCard({ clip, index }: { clip: Clip; index: number }) {
  const [playing, setPlaying] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: "easeOut" }}
      className="rounded-2xl border border-[#262626] bg-[#111] overflow-hidden hover:border-[#333] transition-colors"
    >
      {/* Video player */}
      <div className="relative aspect-[9/16] max-h-72 bg-[#0d0d0d] w-full flex items-center justify-center overflow-hidden">
        {clip.videoUrl ? (
          <video
            src={clip.videoUrl}
            className="w-full h-full object-cover"
            controls={playing}
            poster={clip.thumbnailUrl}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          />
        ) : (
          <Film className="w-10 h-10 text-[#333]" />
        )}

        {!playing && clip.videoUrl && (
          <button
            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
            onClick={() => {
              const vid = document.querySelector<HTMLVideoElement>(
                `video[src="${clip.videoUrl}"]`
              );
              void vid?.play();
            }}
          >
            <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/25 transition-colors">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white leading-snug flex-1">
            {clip.title}
          </h3>
          <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-400 text-xs font-bold">
            {clip.score}
          </span>
        </div>

        <p className="text-xs text-[#737373] flex items-center gap-1.5">
          <Clock className="w-3 h-3 flex-shrink-0" />
          {formatDuration(clip.start)} – {formatDuration(clip.end)}
          <span className="text-[#404040]">·</span>
          {formatDuration(clip.duration)}
        </p>

        {clip.reason && (
          <p className="text-xs text-[#525252] italic leading-relaxed line-clamp-2">
            {clip.reason}
          </p>
        )}

        {clip.transcript && (
          <details className="group">
            <summary className="text-xs text-[#525252] hover:text-[#737373] cursor-pointer select-none transition-colors">
              Show transcript
            </summary>
            <p className="mt-2 text-xs text-[#737373] leading-relaxed max-h-28 overflow-y-auto">
              {clip.transcript}
            </p>
          </details>
        )}

        {/* Download */}
        {clip.videoUrl && (
          <a
            href={clip.videoUrl}
            download={`${clip.title}.mp4`}
            className="flex items-center justify-center gap-1.5 w-full py-2 rounded-xl text-xs font-medium text-[#737373] hover:text-white border border-[#262626] hover:border-[#333] hover:bg-[#1a1a1a] transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download clip
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ─── Job detail page ──────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set([
  "queued",
  "downloading",
  "transcribing",
  "analyzing",
  "cutting",
]);

export default function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [job, setJob] = useState<Job | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchJob = useCallback(async () => {
    try {
      const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      if (res.status === 404) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Job;
      setJob(data);
    } catch (err) {
      console.error("Failed to fetch job:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Initial load
  useEffect(() => {
    void fetchJob();
  }, [fetchJob]);

  // Poll every 2s while processing
  useEffect(() => {
    if (!job || !ACTIVE_STATUSES.has(job.status)) return;

    const interval = setInterval(() => {
      void fetchJob();
    }, 2_000);

    return () => clearInterval(interval);
  }, [job, fetchJob]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-sm text-[#737373]">Loading job…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !job) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-24 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Job not found</h2>
        <p className="text-sm text-[#737373] mb-6">
          This job ID doesn&apos;t exist or the server was restarted.
        </p>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to projects
        </Link>
      </div>
    );
  }

  const isProcessing = ACTIVE_STATUSES.has(job.status);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-[#1f1f1f]">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-white transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          My Projects
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={job.status} />
            </div>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-[#737373] hover:text-white transition-colors truncate max-w-xl"
            >
              <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{job.url}</span>
            </a>
            <p className="text-xs text-[#525252] mt-1 flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              Created {formatDate(job.createdAt)}
            </p>
          </div>

          {job.status === "done" && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-medium flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
              {job.clips.length} clips ready
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 p-6">
        {/* Error state */}
        {job.status === "error" && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 flex items-start gap-3 mb-6">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-400 mb-1">Processing failed</p>
              <p className="text-xs text-[#737373]">
                {job.error ?? "An unknown error occurred. Please try again."}
              </p>
            </div>
          </div>
        )}

        {/* Progress panel */}
        {isProcessing && (
          <div className="max-w-md mx-auto">
            <ProgressPanel job={job} />
          </div>
        )}

        {/* Clips grid */}
        {job.status === "done" && job.clips.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-white mb-5">
              Generated clips
              <span className="ml-2 text-sm text-[#737373] font-normal">
                ({job.clips.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {job.clips.map((clip, i) => (
                <ClipCard key={clip.id} clip={clip} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Done but no clips */}
        {job.status === "done" && job.clips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Film className="w-10 h-10 text-[#333] mb-4" />
            <p className="text-sm text-[#737373]">No clips were generated for this video.</p>
          </div>
        )}
      </div>
    </div>
  );
}
