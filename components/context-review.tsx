"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Scissors, TrendingUp, Zap, Loader2 } from "lucide-react";
import type { Clip } from "@/types";
import TrimEditor from "@/components/trim-editor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContextWindowData {
  clipStart: number;
  clipEnd: number;
  contextBefore: { start: number; end: number };
  contextAfter: { start: number; end: number };
  transcriptWindow: string;
}

type ReviewStatus = "pending" | "approved" | "rejected";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContextReviewProps {
  clip: Clip;
  jobId: string;
  onApprove: () => void;
  onReject: () => void;
  onAdjust: (newStart: number, newEnd: number) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function formatDuration(s: number): string {
  return `${s.toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// Timeline visual
// ---------------------------------------------------------------------------

interface TimelineProps {
  contextBefore: { start: number; end: number };
  clipStart: number;
  clipEnd: number;
  contextAfter: { start: number; end: number };
}

function TimelineBar({ contextBefore, clipStart, clipEnd, contextAfter }: TimelineProps) {
  const totalStart = contextBefore.start;
  const totalEnd = contextAfter.end;
  const totalDuration = totalEnd - totalStart || 1;

  const beforePct = ((clipStart - totalStart) / totalDuration) * 100;
  const clipPct = ((clipEnd - clipStart) / totalDuration) * 100;
  const afterPct = ((totalEnd - clipEnd) / totalDuration) * 100;

  return (
    <div className="flex flex-col gap-1">
      {/* Label row */}
      <div
        className="flex text-[10px] font-mono text-[#525252]"
        style={{ fontFamily: "DM Mono, monospace" }}
      >
        <div style={{ width: `${beforePct}%` }} className="truncate pr-1">
          CONTEXTO ANTES
        </div>
        <div style={{ width: `${clipPct}%` }} className="text-center truncate px-1 text-[#A8FF00]">
          ▶ CLIP ◀
        </div>
        <div style={{ width: `${afterPct}%` }} className="text-right truncate pl-1">
          CONTEXTO DESPUÉS
        </div>
      </div>

      {/* Bar */}
      <div className="flex h-5 rounded-full overflow-hidden border border-[#1E1F28] bg-[#0B0C10]">
        <div
          className="bg-[#1E1F28] h-full"
          style={{ width: `${beforePct}%` }}
          title={`${formatTime(contextBefore.start)} → ${formatTime(clipStart)}`}
        />
        <div
          className="bg-[#A8FF00] h-full"
          style={{ width: `${clipPct}%` }}
          title={`${formatTime(clipStart)} → ${formatTime(clipEnd)}`}
        />
        <div
          className="bg-[#2A2B33] h-full"
          style={{ width: `${afterPct}%` }}
          title={`${formatTime(clipEnd)} → ${formatTime(contextAfter.end)}`}
        />
      </div>

      {/* Timestamp row */}
      <div
        className="flex text-[10px] font-mono text-[#525252]"
        style={{ fontFamily: "DM Mono, monospace" }}
      >
        <div style={{ width: `${beforePct}%` }}>
          {formatTime(contextBefore.start)}
        </div>
        <div style={{ width: `${clipPct}%` }} className="text-center text-[#A8FF00]">
          {formatTime(clipStart)} → {formatTime(clipEnd)}
        </div>
        <div style={{ width: `${afterPct}%` }} className="text-right">
          {formatTime(contextAfter.end)}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Highlighted transcript
// ---------------------------------------------------------------------------

interface TranscriptHighlightProps {
  transcriptWindow: string;
  clipTranscript: string;
}

function TranscriptHighlight({ transcriptWindow, clipTranscript }: TranscriptHighlightProps) {
  if (!transcriptWindow) {
    return (
      <p className="text-xs text-[#525252] italic font-sans">
        Sin transcript disponible para este clip.
      </p>
    );
  }

  const clipIdx = transcriptWindow.indexOf(clipTranscript);

  if (clipTranscript && clipIdx !== -1) {
    const before = transcriptWindow.slice(0, clipIdx);
    const highlighted = transcriptWindow.slice(clipIdx, clipIdx + clipTranscript.length);
    const after = transcriptWindow.slice(clipIdx + clipTranscript.length);

    return (
      <p className="text-xs leading-relaxed font-sans">
        <span className="text-[#525252]">{before}</span>
        <mark className="bg-[#A8FF00]/20 text-[#A8FF00] px-0.5 rounded">{highlighted}</mark>
        <span className="text-[#333]">{after}</span>
      </p>
    );
  }

  // Fallback: no match found, show full window dimmed with clip bold
  return (
    <p className="text-xs leading-relaxed font-sans">
      <span className="text-[#444]">{transcriptWindow}</span>
    </p>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ContextReview({
  clip,
  jobId,
  onApprove,
  onReject,
  onAdjust,
}: ContextReviewProps) {
  const [contextData, setContextData] = useState<ContextWindowData | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState<string | null>(null);
  const [status, setStatus] = useState<ReviewStatus>("pending");
  const [showTrimEditor, setShowTrimEditor] = useState(false);
  const [localClip, setLocalClip] = useState<Clip>(clip);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ---------------------------------------------------------------------------
  // Fetch context window
  // ---------------------------------------------------------------------------

  useEffect(() => {
    setContextLoading(true);
    setContextError(null);

    const url = `/api/context-window/${clip.id}?jobId=${encodeURIComponent(jobId)}`;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const d = (await res.json()) as { error?: string };
          throw new Error(d.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<ContextWindowData>;
      })
      .then((data) => {
        setContextData(data);
      })
      .catch((err: unknown) => {
        setContextError(err instanceof Error ? err.message : "Error cargando contexto");
      })
      .finally(() => {
        setContextLoading(false);
      });
  }, [clip.id, jobId]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleApprove = () => {
    setStatus("approved");
    onApprove();
  };

  const handleReject = () => {
    setStatus("rejected");
    onReject();
  };

  const handleTrimUpdate = (updated: Clip) => {
    setLocalClip(updated);
    onAdjust(updated.start, updated.end);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-5 rounded-2xl bg-[#12131A] border border-[#1E1F28] overflow-hidden">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 px-5 pt-5">
        <h2
          className="font-mono font-bold text-sm tracking-widest text-white uppercase"
          style={{ fontFamily: "DM Mono, monospace" }}
        >
          CONTEXT-AWARE REVIEW
        </h2>

        {status !== "pending" && (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold
              ${status === "approved"
                ? "bg-[#A8FF00]/10 text-[#A8FF00] border border-[#A8FF00]/30"
                : "bg-red-500/10 text-red-400 border border-red-500/30"
              }`}
            style={{ fontFamily: "DM Mono, monospace" }}
          >
            {status === "approved" ? (
              <CheckCircle className="w-3 h-3" />
            ) : (
              <XCircle className="w-3 h-3" />
            )}
            {status === "approved" ? "APROBADO" : "RECHAZADO"}
          </span>
        )}
      </div>

      {/* ── Timeline ───────────────────────────────────────────────────────── */}
      <div className="px-5">
        {contextLoading ? (
          <div className="h-14 bg-[#1E1F28] rounded-xl animate-pulse" />
        ) : contextError ? (
          <p className="text-xs text-red-400 font-mono">{contextError}</p>
        ) : contextData ? (
          <TimelineBar
            contextBefore={contextData.contextBefore}
            clipStart={contextData.clipStart}
            clipEnd={contextData.clipEnd}
            contextAfter={contextData.contextAfter}
          />
        ) : null}
      </div>

      {/* ── Transcript with highlighting ───────────────────────────────────── */}
      {(contextData?.transcriptWindow || contextLoading) && (
        <div className="px-5">
          <p
            className="text-[10px] font-mono text-[#525252] mb-2 uppercase tracking-widest"
            style={{ fontFamily: "DM Mono, monospace" }}
          >
            TRANSCRIPT CON CONTEXTO
          </p>
          {contextLoading ? (
            <div className="space-y-1.5 animate-pulse">
              <div className="h-3 rounded bg-[#1E1F28] w-full" />
              <div className="h-3 rounded bg-[#1E1F28] w-5/6" />
              <div className="h-3 rounded bg-[#1E1F28] w-4/6" />
            </div>
          ) : (
            <TranscriptHighlight
              transcriptWindow={contextData?.transcriptWindow ?? ""}
              clipTranscript={localClip.transcript}
            />
          )}
        </div>
      )}

      {/* ── Video player ───────────────────────────────────────────────────── */}
      <div className="px-5">
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-[#1E1F28]">
          <video
            ref={videoRef}
            src={localClip.videoUrl}
            poster={localClip.thumbnailUrl}
            controls
            preload="metadata"
            className="absolute inset-0 w-full h-full object-contain"
            aria-label={`Preview: ${localClip.title}`}
          />
        </div>
      </div>

      {/* ── Clip information ───────────────────────────────────────────────── */}
      <div className="px-5 grid grid-cols-2 gap-3">
        {/* Score */}
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#0B0C10] border border-[#1E1F28]">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#525252] uppercase tracking-widest"
            style={{ fontFamily: "DM Mono, monospace" }}>
            <TrendingUp className="w-3 h-3" />
            VIRAL SCORE
          </div>
          <span className="text-xl font-bold text-white font-mono">{localClip.score}</span>
        </div>

        {/* Emotion score */}
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#0B0C10] border border-[#1E1F28]">
          <div className="flex items-center gap-1 text-[10px] font-mono text-[#525252] uppercase tracking-widest"
            style={{ fontFamily: "DM Mono, monospace" }}>
            <Zap className="w-3 h-3" />
            EMOCIÓN
          </div>
          <span className="text-xl font-bold text-white font-mono">{localClip.emotionScore}</span>
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#0B0C10] border border-[#1E1F28]">
          <div className="text-[10px] font-mono text-[#525252] uppercase tracking-widest"
            style={{ fontFamily: "DM Mono, monospace" }}>
            DURACIÓN
          </div>
          <span className="text-sm font-bold text-white font-mono">
            {formatDuration(localClip.end - localClip.start)}
          </span>
        </div>

        {/* Timecode */}
        <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#0B0C10] border border-[#1E1F28]">
          <div className="text-[10px] font-mono text-[#525252] uppercase tracking-widest"
            style={{ fontFamily: "DM Mono, monospace" }}>
            TIMECODE
          </div>
          <span className="text-sm font-bold text-white font-mono">
            {formatTime(localClip.start)} → {formatTime(localClip.end)}
          </span>
        </div>
      </div>

      {/* Hook detected */}
      {localClip.hook && (
        <div className="px-5">
          <p
            className="text-[10px] font-mono text-[#525252] mb-1 uppercase tracking-widest"
            style={{ fontFamily: "DM Mono, monospace" }}
          >
            HOOK DETECTADO
          </p>
          <p className="text-xs italic text-[#C8C9D0] font-sans">{localClip.hook}</p>
        </div>
      )}

      {/* Razón viral */}
      {localClip.reason && (
        <div className="px-5">
          <p
            className="text-[10px] font-mono text-[#525252] mb-1 uppercase tracking-widest"
            style={{ fontFamily: "DM Mono, monospace" }}
          >
            RAZÓN VIRAL
          </p>
          <p className="text-xs text-[#C8C9D0] font-sans leading-relaxed">{localClip.reason}</p>
        </div>
      )}

      {/* ── Trim Editor (expandable) ──────────────────────────────────────── */}
      <AnimatePresence>
        {showTrimEditor && (
          <motion.div
            key="trim"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden px-5"
          >
            <TrimEditor
              clip={localClip}
              jobId={jobId}
              onUpdate={handleTrimUpdate}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {status !== "pending" && (
          <motion.div
            key="status-banner"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className={`mx-5 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold
              ${status === "approved"
                ? "bg-[#A8FF00]/10 border-[#A8FF00]/40 text-[#A8FF00]"
                : "bg-red-500/10 border-red-500/40 text-red-400"
              }`}
            style={{ fontFamily: "Unbounded, sans-serif" }}
          >
            {status === "approved" ? (
              <>
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                CLIP APROBADO — Añadido a tu colección
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 flex-shrink-0" />
                CLIP RECHAZADO
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Action buttons ────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 flex flex-col gap-2 px-5 pb-5 pt-2 bg-[#12131A] border-t border-[#1E1F28]">
        {/* Adjust cuts toggle */}
        <button
          onClick={() => setShowTrimEditor((v) => !v)}
          className="flex items-center justify-center gap-2 py-2 rounded-xl
                     border border-[#1E1F28] hover:border-[#A8FF00]/30
                     text-xs text-[#737373] hover:text-[#A8FF00]
                     transition-all duration-150"
          style={{ fontFamily: "DM Mono, monospace" }}
        >
          <Scissors className="w-3.5 h-3.5" />
          {showTrimEditor ? "OCULTAR EDITOR" : "↔ AJUSTAR CORTES"}
        </button>

        <div className="grid grid-cols-2 gap-2">
          {/* Reject */}
          <button
            onClick={handleReject}
            disabled={status !== "pending"}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                       border border-red-500/40 text-red-400 text-xs font-bold
                       hover:bg-red-500/10 active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150"
            style={{ fontFamily: "Unbounded, sans-serif" }}
          >
            {contextLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" />
            )}
            ✗ RECHAZAR
          </button>

          {/* Approve */}
          <button
            onClick={handleApprove}
            disabled={status !== "pending"}
            className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl
                       bg-[#A8FF00] text-black text-xs font-bold
                       hover:bg-[#BFFF33] active:scale-95
                       disabled:opacity-40 disabled:cursor-not-allowed
                       transition-all duration-150"
            style={{ fontFamily: "Unbounded, sans-serif" }}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            ✓ APROBAR CLIP
          </button>
        </div>
      </div>
    </div>
  );
}
