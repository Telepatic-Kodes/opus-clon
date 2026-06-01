"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Sparkles } from "lucide-react";
import type { Clip } from "@/types";
import ClipCard from "./clip-card";

interface ClipsGridProps {
  clips: Clip[];
  jobId: string;
  onReset: () => void;
}

// ─── Confetti ────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#8b5cf6", // violet
  "#ffffff", // white
  "#06b6d4", // cyan
  "#facc15", // yellow
  "#22c55e", // green
];

const CONFETTI_COUNT = 50;

/** Mulberry32 seeded PRNG — same algorithm as trim-editor.tsx */
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

/** Convert a jobId string to a numeric seed */
function jobIdToSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

interface ConfettiPiece {
  id: number;
  left: number;       // percent 0-100
  color: string;
  duration: number;   // seconds 2-4
  delay: number;      // seconds 0-1
  rotation: number;   // initial deg 0-360
  rotationDir: number; // +1 or -1
}

const CONFETTI_CSS = `
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(var(--rot-start)); opacity: 1; }
  80%  { opacity: 1; }
  100% { transform: translateY(100vh) rotate(var(--rot-end)); opacity: 0; }
}
.confetti-piece {
  animation: confetti-fall var(--dur) var(--delay) ease-in forwards;
}
`;

function Confetti({ jobId }: { jobId: string }) {
  const [show, setShow] = useState(true);
  const injectedRef = useRef(false);

  // Inject keyframes once
  useEffect(() => {
    if (injectedRef.current) return;
    injectedRef.current = true;
    if (typeof document === "undefined") return;
    const style = document.createElement("style");
    style.textContent = CONFETTI_CSS;
    document.head.appendChild(style);
  }, []);

  // Hide after 4 s
  useEffect(() => {
    const t = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(t);
  }, []);

  const pieces = useMemo<ConfettiPiece[]>(() => {
    const rand = seededRandom(jobIdToSeed(jobId));
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      left: rand() * 100,
      color: CONFETTI_COLORS[Math.floor(rand() * CONFETTI_COLORS.length)],
      duration: 2 + rand() * 2,
      delay: rand() * 1,
      rotation: rand() * 360,
      rotationDir: rand() > 0.5 ? 1 : -1,
    }));
  }, [jobId]);

  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 overflow-hidden z-50"
    >
      {pieces.map((p) => (
        <div
          key={p.id}
          className="confetti-piece absolute w-2 h-2 rounded-sm"
          style={{
            left: `${p.left}%`,
            top: 0,
            backgroundColor: p.color,
            // CSS custom properties used by the @keyframes
            ["--dur" as string]: `${p.duration}s`,
            ["--delay" as string]: `${p.delay}s`,
            ["--rot-start" as string]: `${p.rotation}deg`,
            ["--rot-end" as string]: `${p.rotation + p.rotationDir * 540}deg`,
          }}
        />
      ))}
    </div>
  );
}

// ─── ClipsGrid ───────────────────────────────────────────────────────────────

export default function ClipsGrid({ clips, jobId, onReset }: ClipsGridProps) {
  const sorted = [...clips].sort((a, b) => b.score - a.score);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Feature 2: confetti on first render */}
      <Confetti jobId={jobId} />

      {/* Header row */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-green-500/10 border border-green-500/20">
            <Sparkles className="w-3.5 h-3.5 text-green-400" />
            <span className="text-green-400 text-sm font-semibold">
              {sorted.length} clip{sorted.length !== 1 ? "s" : ""} generado{sorted.length !== 1 ? "s" : ""}
            </span>
          </div>
          <span className="text-[#525252] text-sm">
            Ordenados por puntaje de viralidad
          </span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-[#111] border border-[#262626] hover:border-violet-500/40
                     text-[#a3a3a3] hover:text-white text-sm font-medium
                     transition-all duration-200"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Procesar otro video
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map((clip, i) => (
          <ClipCard key={clip.id} clip={clip} index={i} jobId={jobId} />
        ))}
      </div>

      {/* Bottom CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: sorted.length * 0.08 + 0.3, duration: 0.5 }}
        className="mt-12 text-center"
      >
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                     font-semibold text-sm text-white
                     bg-gradient-to-r from-violet-600 to-violet-500
                     hover:from-violet-500 hover:to-violet-400
                     transition-all duration-200
                     shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
        >
          <Sparkles className="w-4 h-4" />
          Procesar otro video
        </button>
      </motion.div>
    </motion.div>
  );
}
