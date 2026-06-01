"use client";

import { useState, useEffect, useCallback, use } from "react";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  Film,
  AlertTriangle,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Clip, Job, JobStatus } from "@/types";
import ClipCard from "@/components/clip-card";

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
      label: "Completado",
      className: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    error: {
      label: "Error",
      className: "bg-red-500/15 text-red-400 border-red-500/25",
      icon: <XCircle className="w-3.5 h-3.5" />,
    },
    queued: {
      label: "En cola",
      className: "bg-[#262626] text-[#737373] border-[#333]",
      icon: <Clock className="w-3.5 h-3.5" />,
    },
    downloading: {
      label: "Descargando",
      className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    transcribing: {
      label: "Transcribiendo",
      className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    analyzing: {
      label: "Analizando",
      className: "bg-violet-500/15 text-violet-400 border-violet-500/25",
      icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
    },
    cutting: {
      label: "Cortando clips",
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
  { status: "queued", label: "En cola" },
  { status: "downloading", label: "Descargando video" },
  { status: "transcribing", label: "Transcribiendo audio" },
  { status: "analyzing", label: "Buscando momentos virales" },
  { status: "cutting", label: "Cortando clips" },
  { status: "done", label: "Completado" },
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
      <h2 className="text-sm font-semibold text-white mb-5">Estado del procesamiento</h2>

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

// ─── Analytics section ────────────────────────────────────────────────────────

function scoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-500";
  return "bg-orange-500";
}

function AnalyticsSection({ clips }: { clips: Clip[] }) {
  // ── derived stats ──────────────────────────────────────────────────────────
  const avgScore = Math.round(clips.reduce((acc, c) => acc + c.score, 0) / clips.length);
  const topClip = [...clips].sort((a, b) => b.score - a.score)[0];
  const totalMinutes = +(clips.reduce((acc, c) => acc + (c.duration ?? 0), 0) / 60).toFixed(1);
  const totalFillerWords = clips.reduce((acc, c) => acc + (c.fillerWordsRemoved ?? 0), 0);
  // Approximate total segments as clips.length * avg duration / 30 (rough unit)
  const fillerPct = clips.length > 0
    ? Math.min(100, Math.round((totalFillerWords / (clips.length * 5)) * 100))
    : 0;

  // ── hashtag frequency ─────────────────────────────────────────────────────
  const hashtagCounts = new Map<string, number>();
  for (const clip of clips) {
    for (const tag of clip.hashtags) {
      hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1);
    }
  }
  const maxCount = Math.max(1, ...hashtagCounts.values());
  const sortedTags = [...hashtagCounts.entries()].sort((a, b) => b[1] - a[1]);

  function tagSizeClass(count: number): string {
    const ratio = count / maxCount;
    if (ratio > 0.66) return "text-base font-semibold text-white";
    if (ratio > 0.33) return "text-sm font-medium text-[#a3a3a3]";
    return "text-xs text-[#737373]";
  }

  const copyToClipboard = (text: string) => {
    void navigator.clipboard.writeText(text).catch(() => undefined);
    // tiny transient feedback via DOM
    const el = document.createElement("div");
    el.textContent = `Copiado: ${text}`;
    el.className = [
      "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]",
      "px-4 py-2 rounded-xl bg-[#1a1a1a] border border-[#333]",
      "text-sm text-white shadow-lg shadow-black/40 pointer-events-none",
    ].join(" ");
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, 1800);
  };

  return (
    <div className="mt-10">
      <h2 className="text-base font-semibold text-white mb-5 flex items-center gap-2">
        📊 Análisis del video
      </h2>

      {/* ── A. Summary stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-2xl border border-[#262626] bg-[#111] p-4 flex flex-col gap-1">
          <span className="text-xs text-[#737373]">Score promedio</span>
          <span className="text-2xl font-bold text-white">{avgScore}</span>
          <span className="text-xs text-[#525252]">de todos los clips</span>
        </div>
        <div className="rounded-2xl border border-[#262626] bg-[#111] p-4 flex flex-col gap-1">
          <span className="text-xs text-[#737373]">Clip más viral</span>
          <span className="text-sm font-bold text-violet-400 line-clamp-2 leading-tight">
            {topClip ? (topClip.title.length > 28 ? topClip.title.slice(0, 28) + "…" : topClip.title) : "—"}
          </span>
          <span className="text-xs text-[#525252]">score {topClip?.score ?? 0}</span>
        </div>
        <div className="rounded-2xl border border-[#262626] bg-[#111] p-4 flex flex-col gap-1">
          <span className="text-xs text-[#737373]">Minutos generados</span>
          <span className="text-2xl font-bold text-white">{totalMinutes}</span>
          <span className="text-xs text-[#525252]">de contenido total</span>
        </div>
        <div className="rounded-2xl border border-[#262626] bg-[#111] p-4 flex flex-col gap-1">
          <span className="text-xs text-[#737373]">Muletillas (% elim.)</span>
          <span className="text-2xl font-bold text-white">{fillerPct}%</span>
          <span className="text-xs text-[#525252]">{totalFillerWords} eliminadas</span>
        </div>
      </div>

      {/* ── B. Score bar chart ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-[#262626] bg-[#111] p-5 mb-4">
        <h3 className="text-sm font-semibold text-white mb-4">
          Score por clip
        </h3>
        <div className="flex flex-col gap-2.5">
          {[...clips].sort((a, b) => b.score - a.score).map((clip) => (
            <div key={clip.id} className="flex items-center gap-3">
              <span className="text-xs text-[#737373] w-32 flex-shrink-0 truncate" title={clip.title}>
                {clip.title}
              </span>
              <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <div
                  style={{ width: `${clip.score}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${scoreBarColor(clip.score)}`}
                />
              </div>
              <span className="text-xs text-white w-8 text-right flex-shrink-0">{clip.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── C. Hashtag cloud ─────────────────────────────────────────────── */}
      {sortedTags.length > 0 && (
        <div className="rounded-2xl border border-[#262626] bg-[#111] p-5">
          <h3 className="text-sm font-semibold text-white mb-1">
            Hashtags
            <span className="ml-2 text-xs font-normal text-[#525252]">
              click para copiar
            </span>
          </h3>
          <p className="text-xs text-[#525252] mb-3">
            Tamaño proporcional a frecuencia entre clips
          </p>
          <div className="flex flex-wrap gap-2 items-baseline">
            {sortedTags.map(([tag, count]) => (
              <button
                key={tag}
                onClick={() => copyToClipboard(tag)}
                title={`Aparece en ${count} clip${count !== 1 ? "s" : ""} — click para copiar`}
                className={`px-2.5 py-1 rounded-full border border-[#2a2a2a] bg-[#1a1a1a]
                            hover:border-violet-500/40 hover:bg-violet-500/10
                            transition-all duration-150 cursor-pointer ${tagSizeClass(count)}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
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
          <p className="text-sm text-[#737373]">Cargando…</p>
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
        <h2 className="text-lg font-semibold text-white mb-2">Trabajo no encontrado</h2>
        <p className="text-sm text-[#737373] mb-6">
          Este ID no existe o el servidor fue reiniciado.
        </p>
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a proyectos
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
              Creado {formatDate(job.createdAt)}
            </p>
          </div>

          {job.status === "done" && (
            <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {job.clips.length} clips listos
              </div>
              <a
                href={`/api/export/${job.id}`}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                           text-white bg-gradient-to-r from-violet-600 to-violet-500
                           hover:from-violet-500 hover:to-violet-400 transition-all"
              >
                <Download className="w-4 h-4" />
                Descargar todo (ZIP)
              </a>
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
              <p className="text-sm font-medium text-red-400 mb-1">El procesamiento falló</p>
              <p className="text-xs text-[#737373]">
                {job.error ?? "Ocurrió un error desconocido. Por favor intenta de nuevo."}
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
              Clips generados
              <span className="ml-2 text-sm text-[#737373] font-normal">
                ({job.clips.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {job.clips.map((clip, i) => (
                <ClipCard key={clip.id} clip={clip} index={i} jobId={job.id} />
              ))}
            </div>
          </div>
        )}

        {/* Analytics section */}
        {job.status === "done" && job.clips.length > 0 && (
          <AnalyticsSection clips={job.clips} />
        )}

        {/* Done but no clips */}
        {job.status === "done" && job.clips.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Film className="w-10 h-10 text-[#333] mb-4" />
            <p className="text-sm text-[#737373]">No se generaron clips para este video.</p>
          </div>
        )}
      </div>
    </div>
  );
}
