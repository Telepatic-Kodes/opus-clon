"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Trophy, Eye, EyeOff, Loader2 } from "lucide-react";
import type { Clip } from "@/types";
import type { HookVariant } from "@/app/api/generate-hooks/route";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface HookTesterProps {
  clip: Clip;
}

// ---------------------------------------------------------------------------
// Skeleton card
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-[#1E1F28] bg-[#12131A] animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-lg bg-[#1E1F28]" />
        <div className="w-24 h-5 rounded-full bg-[#1E1F28]" />
      </div>
      <div className="w-10 h-10 rounded-xl bg-[#1E1F28]" />
      <div className="space-y-2">
        <div className="h-3 rounded bg-[#1E1F28] w-full" />
        <div className="h-3 rounded bg-[#1E1F28] w-4/5" />
        <div className="h-3 rounded bg-[#1E1F28] w-3/5" />
      </div>
      <div className="h-10 rounded-xl bg-[#1E1F28]" />
      <div className="h-8 rounded-lg bg-[#1E1F28]" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant card
// ---------------------------------------------------------------------------

const BADGE_COLORS: Record<"A" | "B" | "C", string> = {
  A: "bg-[#A8FF00]/10 text-[#A8FF00] border-[#A8FF00]/30",
  B: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  C: "bg-orange-500/10 text-orange-400 border-orange-500/30",
};

interface VariantCardProps {
  variant: HookVariant;
  isSelected: boolean;
  blindMode: boolean;
  onChoose: () => void;
  index: number;
}

function VariantCard({ variant, isSelected, blindMode, onChoose, index }: VariantCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1, ease: "easeOut" }}
      className={`relative flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-200
        ${isSelected
          ? "border-[#A8FF00]/60 bg-[#A8FF00]/5 shadow-lg shadow-[#A8FF00]/10"
          : "border-[#1E1F28] bg-[#12131A] hover:border-[#A8FF00]/30"
        }`}
    >
      {/* Top row: badge ID + style badge */}
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-lg border
                      font-mono font-bold text-sm ${BADGE_COLORS[variant.id]}`}
        >
          {variant.id}
        </span>

        {!blindMode && (
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border
                       border-[#A8FF00]/30 text-[#A8FF00] text-[10px] font-mono font-semibold tracking-wider"
          >
            {variant.emoji} {variant.style}
          </span>
        )}
      </div>

      {/* Emoji (big) */}
      {!blindMode && (
        <div className="text-3xl leading-none">{variant.emoji}</div>
      )}

      {/* Hook text */}
      <p className="font-sans italic text-[#C8C9D0] text-sm leading-relaxed">
        &ldquo;{variant.hook}&rdquo;
      </p>

      {/* Overlay text preview — simulates video overlay */}
      <div className="relative rounded-xl overflow-hidden bg-black border border-[#262626]">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80 pointer-events-none" />
        <div className="relative flex items-end justify-start p-3 min-h-[64px]">
          <p
            className="font-display text-white text-sm font-bold leading-tight drop-shadow-lg"
            style={{ fontFamily: "Unbounded, sans-serif", textShadow: "0 2px 8px rgba(0,0,0,0.9)" }}
          >
            {variant.overlayText}
          </p>
        </div>
      </div>

      {/* Choose button */}
      <button
        onClick={onChoose}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl
                    border text-xs font-display font-bold tracking-wider transition-all duration-200
                    ${isSelected
                      ? "bg-[#A8FF00] border-[#A8FF00] text-black"
                      : "border-[#A8FF00]/40 text-[#A8FF00] hover:bg-[#A8FF00]/10"
                    }`}
        style={{ fontFamily: "Unbounded, sans-serif" }}
      >
        {isSelected ? (
          <>
            <Check className="w-3.5 h-3.5" />
            SELECCIONADO
          </>
        ) : (
          "ELEGIR ESTE HOOK"
        )}
      </button>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function HookTester({ clip }: HookTesterProps) {
  const [variants, setVariants] = useState<HookVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blindMode, setBlindMode] = useState(false);
  const [copied, setCopied] = useState(false);

  const winnerVariant = variants.find((v) => v.id === winner);

  // ---------------------------------------------------------------------------
  // Generate variants via API
  // ---------------------------------------------------------------------------

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setVariants([]);
    setSelectedVariant(null);
    setWinner(null);

    try {
      const res = await fetch("/api/generate-hooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          title: clip.title,
          transcript: clip.transcript,
          reason: clip.reason,
          hook: clip.hook,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const data = (await res.json()) as { variants: HookVariant[] };
      setVariants(data.variants);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsGenerating(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Handle choosing a winner
  // ---------------------------------------------------------------------------

  const handleChoose = (id: string) => {
    setSelectedVariant(id);
    setWinner(id);
  };

  // ---------------------------------------------------------------------------
  // Copy overlay text
  // ---------------------------------------------------------------------------

  const handleCopy = () => {
    if (!winnerVariant) return;
    void navigator.clipboard.writeText(winnerVariant.overlayText).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-5 p-5 rounded-2xl bg-[#12131A] border border-[#1E1F28]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2
          className="font-mono font-bold text-sm tracking-widest text-white uppercase"
          style={{ fontFamily: "DM Mono, monospace" }}
        >
          A/B TESTING DE HOOKS
        </h2>

        <button
          onClick={() => void handleGenerate()}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 rounded-xl
                     bg-[#A8FF00] text-black text-xs font-bold tracking-wider
                     hover:bg-[#BFFF33] active:scale-95
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all duration-150"
          style={{ fontFamily: "Unbounded, sans-serif" }}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              GENERANDO…
            </>
          ) : (
            "GENERAR VARIANTES →"
          )}
        </button>
      </div>

      {/* Blind mode toggle */}
      {variants.length > 0 && !isGenerating && (
        <button
          onClick={() => setBlindMode((v) => !v)}
          className="flex items-center gap-2 self-start px-3 py-1.5 rounded-full
                     border border-[#1E1F28] hover:border-[#A8FF00]/30
                     text-[#737373] hover:text-[#A8FF00] text-xs font-mono
                     transition-all duration-150"
          style={{ fontFamily: "DM Mono, monospace" }}
        >
          {blindMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {blindMode ? "MOSTRAR ESTILOS" : "MODO BLIND TEST"}
          {blindMode && (
            <span className="text-[10px] text-[#525252] ml-1">
              — Elige tu preferido sin sesgos
            </span>
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <p className="text-xs text-red-400 font-mono">{error}</p>
      )}

      {/* Skeleton loaders */}
      {isGenerating && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Variant cards */}
      {!isGenerating && variants.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {variants.map((variant, i) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              isSelected={selectedVariant === variant.id}
              blindMode={blindMode}
              onChoose={() => handleChoose(variant.id)}
              index={i}
            />
          ))}
        </div>
      )}

      {/* Winner announcement */}
      <AnimatePresence>
        {winner && winnerVariant && (
          <motion.div
            key="winner"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col gap-4 p-4 rounded-2xl border border-[#A8FF00]/40 bg-[#A8FF00]/5"
          >
            {/* Banner */}
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#A8FF00] flex-shrink-0" />
              <span
                className="text-xs font-bold tracking-widest text-[#A8FF00] uppercase"
                style={{ fontFamily: "Unbounded, sans-serif" }}
              >
                HOOK SELECCIONADO: VARIANTE {winner}
              </span>
            </div>

            {/* Video overlay preview */}
            <div className="relative rounded-xl overflow-hidden bg-black border border-[#A8FF00]/20">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "linear-gradient(to bottom, rgba(168,255,0,0.05), transparent)" }}
              />
              <div className="relative flex items-end justify-start p-4 min-h-[80px]">
                <p
                  className="font-display text-white text-base font-bold leading-tight drop-shadow-lg"
                  style={{ fontFamily: "Unbounded, sans-serif", textShadow: "0 2px 10px rgba(0,0,0,0.9)" }}
                >
                  {winnerVariant.overlayText}
                </p>
              </div>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                         border border-[#A8FF00]/40 text-[#A8FF00] text-xs font-bold
                         hover:bg-[#A8FF00]/10 active:scale-95 transition-all duration-150"
              style={{ fontFamily: "Unbounded, sans-serif" }}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  COPIADO
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  COPIAR TEXTO
                </>
              )}
            </button>

            {/* Tip */}
            <p
              className="text-xs text-[#525252] font-mono"
              style={{ fontFamily: "DM Mono, monospace" }}
            >
              // Añade este texto como primer frame del clip en tu editor de video
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty state */}
      {!isGenerating && variants.length === 0 && !error && (
        <p
          className="text-xs text-[#525252] font-mono text-center py-4"
          style={{ fontFamily: "DM Mono, monospace" }}
        >
          // Haz clic en GENERAR VARIANTES para crear 3 hooks alternativos con IA
        </p>
      )}
    </div>
  );
}
