"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Film,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Job, JobStatus, Clip } from "@/types";

// ─── Status badge ────────────────────────────────────────────────────────────

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ReactNode;
  pulsing?: boolean;
}

function getStatusConfig(status: JobStatus): StatusConfig {
  switch (status) {
    case "done":
      return {
        label: "Done",
        className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
        icon: <CheckCircle2 className="w-3 h-3" />,
      };
    case "error":
      return {
        label: "Error",
        className: "bg-red-500/15 text-red-400 border-red-500/25",
        icon: <XCircle className="w-3 h-3" />,
      };
    case "queued":
      return {
        label: "Queued",
        className: "bg-[#262626] text-[#737373] border-[#333]",
        icon: <Clock className="w-3 h-3" />,
      };
    default:
      return {
        label: status.charAt(0).toUpperCase() + status.slice(1),
        className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
        pulsing: true,
      };
  }
}

// ─── Inline clip preview ─────────────────────────────────────────────────────

function ClipPreview({ clip }: { clip: Clip }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-[#0d0d0d] border border-[#1f1f1f] hover:border-[#333] transition-colors group">
      <div className="relative w-16 h-10 flex-shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a] flex items-center justify-center">
        {clip.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={clip.thumbnailUrl}
            alt={clip.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Film className="w-4 h-4 text-[#525252]" />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Play className="w-3 h-3 text-white fill-white" />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-white truncate">{clip.title}</p>
        <p className="text-[10px] text-[#525252] mt-0.5 line-clamp-1">
          {clip.transcript}
        </p>
      </div>
      <div className="flex-shrink-0">
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">
          {clip.score}
        </span>
      </div>
    </div>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] text-[#737373]">{message}</span>
        <span className="text-[11px] text-violet-400 font-medium">{progress}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-[#1f1f1f] overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  job: Job;
}

function truncateUrl(url: string, max = 50): string {
  try {
    const u = new URL(url);
    const clean = u.hostname + u.pathname;
    return clean.length > max ? clean.slice(0, max) + "…" : clean;
  } catch {
    return url.length > max ? url.slice(0, max) + "…" : url;
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const isProcessing = (status: JobStatus): boolean =>
  !["done", "error", "queued"].includes(status);

export default function ProjectCard({ job }: ProjectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const statusConfig = getStatusConfig(job.status);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "relative rounded-2xl border border-[#262626] bg-[#111] p-5 flex flex-col gap-4",
        "hover:border-[#333] transition-colors duration-200",
        "group"
      )}
    >
      {/* Hover glow */}
      <div className="absolute inset-0 rounded-2xl bg-violet-500/0 group-hover:bg-violet-500/[0.02] transition-colors pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-[#525252] mb-1 flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate hover:text-[#a3a3a3] transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {truncateUrl(job.url)}
            </a>
          </p>
          <p className="text-[11px] text-[#404040] flex items-center gap-1.5">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {formatDate(job.createdAt)}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium flex-shrink-0",
            statusConfig.className
          )}
        >
          {statusConfig.icon}
          {statusConfig.label}
        </span>
      </div>

      {/* Clips count row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-sm text-[#737373]">
            <Film className="w-4 h-4" />
            <span>
              {job.status === "done" ? (
                <span>
                  <span className="text-white font-semibold">{job.clips.length}</span>
                  {" "}clips generated
                </span>
              ) : job.status === "error" ? (
                <span className="text-red-400 text-xs">{job.error ?? "Processing failed"}</span>
              ) : (
                <span className="text-[#525252] text-xs">Processing…</span>
              )}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {job.status === "done" && job.clips.length > 0 && (
            <>
              <button
                onClick={() => setExpanded((prev) => !prev)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#737373] hover:text-white hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#333] transition-all"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    Preview
                  </>
                )}
              </button>
              <Link
                href={`/dashboard/jobs/${job.id}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white font-medium bg-violet-600 hover:bg-violet-500 transition-colors"
              >
                <Play className="w-3 h-3" />
                View clips
              </Link>
            </>
          )}

          {job.status !== "done" && job.status !== "error" && (
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#737373] hover:text-white border border-[#262626] hover:border-[#333] transition-all"
            >
              View progress
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar for in-progress jobs */}
      {isProcessing(job.status) && (
        <ProgressBar progress={job.progress} message={job.message} />
      )}

      {/* Expandable clips preview */}
      <AnimatePresence>
        {expanded && job.clips.length > 0 && (
          <motion.div
            key="clips"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1f1f1f] pt-3 space-y-2">
              <p className="text-[11px] text-[#525252] mb-2">Top clips preview</p>
              {job.clips.slice(0, 3).map((clip) => (
                <ClipPreview key={clip.id} clip={clip} />
              ))}
              {job.clips.length > 3 && (
                <Link
                  href={`/dashboard/jobs/${job.id}`}
                  className="block text-center text-xs text-violet-400 hover:text-violet-300 py-2 transition-colors"
                >
                  +{job.clips.length - 3} more clips →
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
