"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { Scissors, RotateCcw, Loader2 } from "lucide-react";
import type { Clip } from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Seeded pseudo-random number generator (mulberry32) */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Numeric seed derived from the clip ID string */
function idToSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (Math.imul(31, hash) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TrimEditorProps {
  clip: Clip;
  jobId: string;
  onUpdate: (newClip: Clip) => void;
}

// ---------------------------------------------------------------------------
// Waveform bar heights (memoized, stable per clip.id)
// ---------------------------------------------------------------------------

const BAR_COUNT = 40;

function useWaveformBars(clipId: string): number[] {
  return useMemo(() => {
    const rng = seededRandom(idToSeed(clipId));
    return Array.from({ length: BAR_COUNT }, () => 0.15 + rng() * 0.85);
  }, [clipId]);
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function getValidationError(start: number, end: number): string | null {
  const dur = end - start;
  if (dur < 5) return "Mínimo 5 segundos";
  if (dur > 120) return "Máximo 120 segundos";
  return null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrimEditor({ clip, jobId, onUpdate }: TrimEditorProps) {
  const originalDuration = clip.end - clip.start;

  const [trimStart, setTrimStart] = useState<number>(clip.start);
  const [trimEnd, setTrimEnd] = useState<number>(clip.end);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"start" | "end" | null>(null);

  const bars = useWaveformBars(clip.id);
  const validationError = getValidationError(trimStart, trimEnd);

  const isUnchanged = trimStart === clip.start && trimEnd === clip.end;
  const applyDisabled = loading || !!validationError || isUnchanged;

  // ------------------------------------------------------------------
  // Convert a pixel X position within the container to a time value
  // ------------------------------------------------------------------

  const xToTime = useCallback(
    (clientX: number): number => {
      const el = containerRef.current;
      if (!el) return clip.start;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return clip.start + ratio * originalDuration;
    },
    [clip.start, originalDuration]
  );

  // ------------------------------------------------------------------
  // Drag handlers (document-level mousemove / mouseup)
  // ------------------------------------------------------------------

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const t = xToTime(e.clientX);
      if (dragging.current === "start") {
        setTrimStart(Math.min(t, trimEnd - 1));
      } else {
        setTrimEnd(Math.max(t, trimStart + 1));
      }
    };
    const onUp = () => {
      dragging.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [xToTime, trimStart, trimEnd]);

  // ------------------------------------------------------------------
  // Handle positions as percentages of the container width
  // ------------------------------------------------------------------

  const startPct =
    originalDuration > 0
      ? ((trimStart - clip.start) / originalDuration) * 100
      : 0;
  const endPct =
    originalDuration > 0
      ? ((trimEnd - clip.start) / originalDuration) * 100
      : 100;

  // ------------------------------------------------------------------
  // Apply trim
  // ------------------------------------------------------------------

  const handleApply = async () => {
    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch("/api/trim-clip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId,
          clipId: clip.id,
          newStart: trimStart,
          newEnd: trimEnd,
        }),
      });
      const data = (await res.json()) as { clip?: Clip; error?: string };
      if (!res.ok) {
        setApiError(data.error ?? `Error ${res.status}`);
      } else if (data.clip) {
        onUpdate(data.clip);
      }
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Error de red");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Reset
  // ------------------------------------------------------------------

  const handleReset = () => {
    setTrimStart(clip.start);
    setTrimEnd(clip.end);
    setApiError(null);
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col gap-4 p-4 bg-[#0d0d0d] border border-[#262626] rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/15 border border-violet-500/30">
            <Scissors className="w-4 h-4 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight">
              Editor de recorte
            </h3>
            <p className="text-xs text-[#737373] leading-tight">
              Original: {originalDuration.toFixed(1)}s
            </p>
          </div>
        </div>

        {/* Reset button */}
        <button
          onClick={handleReset}
          disabled={isUnchanged || loading}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#333]
                     text-xs text-[#737373] hover:text-[#a3a3a3] hover:border-[#525252]
                     disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
          title="Restaurar original"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restaurar original
        </button>
      </div>

      {/* Timeline */}
      <div
        ref={containerRef}
        className="relative h-16 bg-[#0d0d0d] border border-[#262626] rounded-xl overflow-visible select-none cursor-crosshair"
        style={{ touchAction: "none" }}
      >
        {/* Dimmed overlay before start handle */}
        <div
          className="absolute inset-y-0 left-0 bg-[#0a0a0a]/70 z-10 rounded-l-xl pointer-events-none"
          style={{ width: `${startPct}%` }}
        />

        {/* Dimmed overlay after end handle */}
        <div
          className="absolute inset-y-0 right-0 bg-[#0a0a0a]/70 z-10 rounded-r-xl pointer-events-none"
          style={{ width: `${100 - endPct}%` }}
        />

        {/* Selected range highlight */}
        <div
          className="absolute inset-y-0 bg-violet-500/10 border-x border-violet-500/30 z-0 pointer-events-none"
          style={{ left: `${startPct}%`, right: `${100 - endPct}%` }}
        />

        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center gap-[1px] px-1 z-0">
          {bars.map((height, i) => {
            const barPct = (i / (BAR_COUNT - 1)) * 100;
            const inRange = barPct >= startPct && barPct <= endPct;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors duration-100 ${
                  inRange ? "bg-violet-500/40" : "bg-[#333]"
                }`}
                style={{ height: `${height * 100}%` }}
              />
            );
          })}
        </div>

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
          style={{ left: `${startPct}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => {
            e.preventDefault();
            dragging.current = "start";
          }}
        >
          <div
            className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white shadow-lg
                         cursor-ew-resize hover:scale-110 transition-transform duration-100"
          />
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 z-20 flex items-center justify-center"
          style={{ left: `${endPct}%`, transform: "translateX(-50%)" }}
          onMouseDown={(e) => {
            e.preventDefault();
            dragging.current = "end";
          }}
        >
          <div
            className="w-4 h-4 rounded-full bg-violet-500 border-2 border-white shadow-lg
                         cursor-ew-resize hover:scale-110 transition-transform duration-100"
          />
        </div>
      </div>

      {/* Duration display */}
      <div className="flex items-center justify-center gap-1 text-xs text-[#a3a3a3]">
        <span className="font-mono text-violet-300">{formatTime(trimStart)}</span>
        <span className="text-[#525252]">→</span>
        <span className="font-mono text-violet-300">{formatTime(trimEnd)}</span>
        <span className="text-[#525252] mx-1">·</span>
        <span className="font-semibold text-white">
          {(trimEnd - trimStart).toFixed(1)}s
        </span>
      </div>

      {/* Validation / API errors */}
      {(validationError ?? apiError) && (
        <p className="text-xs text-red-400 text-center">
          {validationError ?? apiError}
        </p>
      )}

      {/* Apply button */}
      <button
        onClick={() => void handleApply()}
        disabled={applyDisabled}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                   bg-gradient-to-r from-violet-600 to-violet-500
                   hover:from-violet-500 hover:to-violet-400
                   disabled:from-violet-600/40 disabled:to-violet-500/40
                   disabled:cursor-not-allowed
                   text-white text-sm font-semibold
                   shadow-md shadow-violet-500/20 hover:shadow-violet-500/40
                   transition-all duration-200"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Procesando…
          </>
        ) : (
          <>
            <Scissors className="w-4 h-4" />
            Aplicar recorte
          </>
        )}
      </button>
    </motion.div>
  );
}
