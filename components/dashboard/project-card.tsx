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
  ExternalLink,
  Film,
  Trash2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { JobSummary } from "@/app/api/jobs/route";
import type { JobStatus } from "@/types";

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
        label: "Listo",
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
        label: "En cola",
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

// ─── Score average bar ────────────────────────────────────────────────────────

function ScoreAvgBar({
  avgScore,
  topScore,
}: {
  avgScore: number;
  topScore: number;
}) {
  if (avgScore === 0) return null;
  const color =
    avgScore >= 80
      ? "bg-emerald-500"
      : avgScore >= 60
      ? "bg-violet-500"
      : "bg-[#404040]";

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-end h-5 w-16">
        <div
          className={cn("w-full rounded-sm transition-all", color)}
          style={{ height: `${Math.max(4, avgScore)}%` }}
        />
      </div>
      <span className="text-[10px] text-[#525252]">
        prom <span className="text-[#a3a3a3]">{avgScore}</span>
        {topScore > avgScore && (
          <>
            {" "}
            · top{" "}
            <span className="text-violet-400 flex-shrink-0 inline-flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5" />
              {topScore}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

// ─── Thumbnail row ────────────────────────────────────────────────────────────

function ThumbnailRow({ thumbnails }: { thumbnails: string[] }) {
  if (thumbnails.length === 0) return null;
  return (
    <div className="flex items-center gap-1">
      {thumbnails.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={i}
          src={url}
          alt={`clip thumbnail ${i + 1}`}
          className="w-6 h-6 rounded object-cover border border-[#262626]"
        />
      ))}
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

// ─── URL display helper ───────────────────────────────────────────────────────

function formatVideoUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const hostname = u.hostname.replace(/^www\./, "");

    // YouTube: show youtube.com/watch?v=XXXXXX
    if (hostname === "youtube.com" || hostname === "youtu.be") {
      const v = u.searchParams.get("v");
      if (v) return `youtube.com/watch?v=${v}`;
      // youtu.be/ID
      const id = u.pathname.replace("/", "");
      if (id) return `youtube.com/watch?v=${id}`;
    }

    // Generic: hostname + pathname (truncated)
    const combined = hostname + u.pathname;
    return combined.length > 45 ? combined.slice(0, 45) + "…" : combined;
  } catch {
    return rawUrl.length > 45 ? rawUrl.slice(0, 45) + "…" : rawUrl;
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("es-CL", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const isProcessing = (status: JobStatus): boolean =>
  !["done", "error", "queued"].includes(status);

// ─── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  job: JobSummary;
  onDelete: (jobId: string) => void;
}

export default function ProjectCard({ job, onDelete }: ProjectCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const statusConfig = getStatusConfig(job.status);

  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await onDelete(job.id);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

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
              {formatVideoUrl(job.url)}
            </a>
          </p>
          <p className="text-[11px] text-[#404040] flex items-center gap-1.5">
            <Clock className="w-3 h-3 flex-shrink-0" />
            {formatDate(job.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Status badge */}
          <span
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium",
              statusConfig.className
            )}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </span>

          {/* Delete button */}
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={deleting}
            className="p-1.5 rounded-lg text-[#525252] hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all disabled:opacity-40"
            title="Eliminar proyecto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 flex flex-col gap-3">
              <p className="text-xs text-[#a3a3a3] leading-relaxed">
                <span className="text-red-400 font-medium">¿Eliminar este proyecto?</span>{" "}
                Esto borrará todos los clips asociados.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                  className="flex-1 py-1.5 rounded-lg text-xs text-[#737373] hover:text-white border border-[#333] hover:border-[#444] bg-transparent transition-all disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void handleDeleteConfirm()}
                  disabled={deleting}
                  className="flex-1 py-1.5 rounded-lg text-xs text-white font-medium bg-red-600 hover:bg-red-500 transition-colors disabled:opacity-60 flex items-center justify-center gap-1.5"
                >
                  {deleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white"
                    />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  Eliminar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clips count + score row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <div className="flex items-center gap-1.5 text-sm text-[#737373] flex-shrink-0">
            <Film className="w-4 h-4" />
            <span>
              {job.status === "done" ? (
                <span>
                  <span className="text-white font-semibold">{job.clipCount}</span>
                  {" "}clips
                </span>
              ) : job.status === "error" ? (
                <span className="text-red-400 text-xs">{job.error ?? "Procesamiento fallido"}</span>
              ) : (
                <span className="text-[#525252] text-xs">Procesando…</span>
              )}
            </span>
          </div>

          {/* Score avg bar */}
          {job.status === "done" && job.clipCount > 0 && (
            <ScoreAvgBar avgScore={job.avgScore} topScore={job.topScore} />
          )}

          {/* Thumbnails */}
          {job.status === "done" && job.thumbnails.length > 0 && (
            <ThumbnailRow thumbnails={job.thumbnails} />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {job.status === "done" && job.clipCount > 0 && (
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white font-medium bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              <Play className="w-3 h-3" />
              Ver clips
            </Link>
          )}

          {job.status !== "done" && job.status !== "error" && (
            <Link
              href={`/dashboard/jobs/${job.id}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-[#737373] hover:text-white border border-[#262626] hover:border-[#333] transition-all"
            >
              Ver progreso
            </Link>
          )}
        </div>
      </div>

      {/* Progress bar for in-progress jobs */}
      {isProcessing(job.status) && (
        <ProgressBar progress={job.progress} message={job.message} />
      )}
    </motion.div>
  );
}
