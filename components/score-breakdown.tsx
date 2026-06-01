"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Zap, Clock, Sparkles, Hash, Flame } from "lucide-react";
import type { Clip } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const TRENDING_HASHTAGS = new Set([
  "#viral",
  "#trending",
  "#fyp",
  "#parati",
  "#reels",
  "#foryou",
  "#foryoupage",
  "#explore",
]);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcDurationScore(duration: number): number {
  // 100 if between 15s and 60s, decays outside that window
  if (duration >= 15 && duration <= 60) return 100;
  if (duration < 15) {
    // 0s → 0, 15s → 100  (linear)
    return Math.round((duration / 15) * 100);
  }
  // 60s → 100, 120s → 50, 180s → 0
  const excess = duration - 60;
  return Math.max(0, Math.round(100 - (excess / 120) * 100));
}

function calcHookScore(hook: string): number {
  if (!hook || hook.trim().length === 0) return 0;
  const len = hook.trim().length;
  // Short hooks (<20 chars) → 40; long hooks (80+ chars) → 100
  if (len >= 80) return 100;
  if (len >= 40) return 80;
  if (len >= 20) return 60;
  return 40;
}

function scoreColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-yellow-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-red-500";
}

function emotionColor(score: number): string {
  if (score >= 70) return "bg-red-500";
  if (score >= 40) return "bg-orange-500";
  return "bg-yellow-500";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface MetricBarProps {
  label: string;
  value: number;
  colorClass: string;
  description?: string;
  icon: React.ReactNode;
}

function MetricBar({ label, value, colorClass, description, icon }: MetricBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-[#a3a3a3]">
          {icon}
          <span>{label}</span>
        </div>
        <span className="text-xs font-semibold text-white">{value}/100</span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#1f1f1f] overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      {description && (
        <p className="text-[11px] text-[#525252] leading-snug">{description}</p>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ScoreBreakdownProps {
  clip: Clip;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ScoreBreakdown({ clip, onClose }: ScoreBreakdownProps) {
  const durationScore = calcDurationScore(clip.duration);
  const hookScore = calcHookScore(clip.hook);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const shortReason =
    clip.reason.length > 80 ? clip.reason.slice(0, 80).trimEnd() + "…" : clip.reason;

  return (
    <AnimatePresence>
      {/* Overlay */}
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        aria-modal
        role="dialog"
        aria-label={`Score breakdown for ${clip.title}`}
      >
        {/* Card */}
        <motion.div
          key="card"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative w-full max-w-sm bg-[#111] border border-[#262626] rounded-2xl
                     shadow-2xl shadow-black/60 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top accent line */}
          <div className="h-0.5 w-full bg-gradient-to-r from-violet-600 via-violet-400 to-transparent" />

          {/* Header */}
          <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
            <div>
              <p className="text-[11px] text-[#525252] uppercase tracking-wider font-medium mb-0.5">
                Score Breakdown
              </p>
              <h2 className="text-base font-bold text-white">
                Por qué este score:{" "}
                <span className="text-violet-400">{clip.score}/100</span>
              </h2>
              <p className="text-xs text-[#737373] mt-0.5 line-clamp-1">{clip.title}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#1a1a1a] hover:bg-[#262626]
                         border border-[#262626] flex items-center justify-center
                         text-[#737373] hover:text-white transition-all duration-150"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#1f1f1f] mx-5" />

          {/* Metrics */}
          <div className="px-5 py-4 space-y-4">
            <MetricBar
              label="Viralidad"
              value={clip.score}
              colorClass={scoreColor(clip.score)}
              description={shortReason}
              icon={<TrendingUp className="w-3.5 h-3.5" />}
            />
            <MetricBar
              label="Energía emocional"
              value={clip.emotionScore}
              colorClass={emotionColor(clip.emotionScore)}
              icon={<Zap className="w-3.5 h-3.5" />}
            />
            <MetricBar
              label="Duración óptima"
              value={durationScore}
              colorClass={scoreColor(durationScore)}
              description={
                durationScore === 100
                  ? `${clip.duration}s — duración ideal para redes sociales`
                  : clip.duration < 15
                  ? `${clip.duration}s — demasiado corto`
                  : `${clip.duration}s — algo largo, considera recortar`
              }
              icon={<Clock className="w-3.5 h-3.5" />}
            />
            <MetricBar
              label="Impacto del hook"
              value={hookScore}
              colorClass={scoreColor(hookScore)}
              icon={<Sparkles className="w-3.5 h-3.5" />}
            />
          </div>

          {/* Divider */}
          <div className="h-px bg-[#1f1f1f] mx-5" />

          {/* Hook section */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-2">
              Hook detectado
            </p>
            {clip.hook && clip.hook.trim().length > 0 ? (
              <p className="text-sm text-[#a3a3a3] italic leading-relaxed">
                &ldquo;{clip.hook}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-[#525252] italic">
                No se detectó hook específico
              </p>
            )}
          </div>

          {/* Hashtags */}
          {clip.hashtags.length > 0 && (
            <>
              <div className="h-px bg-[#1f1f1f] mx-5" />
              <div className="px-5 py-4">
                <p className="text-xs font-semibold text-[#737373] uppercase tracking-wider mb-2.5">
                  Hashtags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {clip.hashtags.map((tag) => {
                    const isTrending = TRENDING_HASHTAGS.has(tag.toLowerCase());
                    return (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium
                          ${isTrending
                            ? "bg-orange-500/15 border-orange-500/30 text-orange-400"
                            : "bg-[#1a1a1a] border-[#2a2a2a] text-[#737373]"
                          }`}
                      >
                        {isTrending ? (
                          <Flame className="w-2.5 h-2.5" />
                        ) : (
                          <Hash className="w-2.5 h-2.5" />
                        )}
                        {tag.startsWith("#") ? tag.slice(1) : tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* CTA */}
          <div className="px-5 pb-5">
            <button
              onClick={() => {
                // Sonner-style toast via DOM (no sonner dep needed)
                const toast = document.createElement("div");
                toast.textContent = "✨ Próximamente — mejora con IA";
                toast.className = [
                  "fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999]",
                  "px-4 py-2.5 rounded-xl bg-[#1a1a1a] border border-[#333]",
                  "text-sm text-white shadow-lg shadow-black/40",
                  "transition-all duration-300",
                ].join(" ");
                document.body.appendChild(toast);
                setTimeout(() => {
                  toast.style.opacity = "0";
                  setTimeout(() => toast.remove(), 300);
                }, 2500);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                         bg-gradient-to-r from-violet-600 to-violet-500
                         hover:from-violet-500 hover:to-violet-400
                         text-white text-sm font-semibold transition-all duration-200
                         shadow-md shadow-violet-500/20 hover:shadow-violet-500/40"
            >
              <Sparkles className="w-4 h-4" />
              Mejorar este clip con IA
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
