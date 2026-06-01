"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Clock, TrendingUp, Captions, Pencil, Check, RefreshCw, Share2, Play, Scissors, Smartphone, FileText, Zap, Keyboard } from "lucide-react";
import type { Clip, ClipFormat } from "@/types";
import TrimEditor from "@/components/trim-editor";
import SocialPreview from "@/components/social-preview";
import CaptionPanel from "@/components/caption-panel";
import ScoreBreakdown from "@/components/score-breakdown";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "video" | "editor" | "social" | "caption";

interface ClipCardProps {
  clip: Clip;
  index: number;
  jobId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ScoreBadge({ score, onClick }: { score: number; onClick: () => void }) {
  let colorClass = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (score >= 80) colorClass = "bg-green-500/20 text-green-400 border-green-500/30";
  else if (score >= 60) colorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <button
      onClick={onClick}
      title="Ver desglose del score"
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold
                  cursor-pointer hover:opacity-80 transition-opacity ${colorClass}`}
    >
      <TrendingUp className="w-3 h-3" />
      {score}
    </button>
  );
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const FORMAT_META: Record<ClipFormat["ratio"], { Icon: React.ComponentType<{ className?: string }>; short: string; aspect: string; resolution: string }> = {
  "9:16": { Icon: Smartphone, short: "TikTok",     aspect: "aspect-[9/16]", resolution: "720×1280"  },
  "1:1":  { Icon: FileText,   short: "Instagram",  aspect: "aspect-square", resolution: "1080×1080" },
  "16:9": { Icon: Play,       short: "YouTube",    aspect: "aspect-video",  resolution: "1280×720"  },
};

function ratioToFilename(ratio: ClipFormat["ratio"]): string {
  return ratio.replace(":", "x");
}

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "video",   label: "Video",   Icon: Play },
  { id: "editor",  label: "Editar",  Icon: Scissors },
  { id: "social",  label: "Social",  Icon: Smartphone },
  { id: "caption", label: "Caption", Icon: FileText },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClipCard({ clip, index, jobId }: ClipCardProps) {
  const [activeTab, setActiveTab] = useState<TabId>("video");
  const [localClip, setLocalClip] = useState<Clip>(clip);
  const [selectedFormat, setSelectedFormat] = useState<ClipFormat | null>(null);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [isPlayingManually, setIsPlayingManually] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showShortcutsTooltip, setShowShortcutsTooltip] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // ── Inline title editing ────────────────────────────────────────────────────
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(localClip.title);
  const [titleSaved, setTitleSaved] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const hasFormats = Array.isArray(localClip.formats) && localClip.formats.length > 0;

  const activeFormat: { ratio: ClipFormat["ratio"]; label: string; videoUrl: string } =
    selectedFormat ??
    localClip.formats?.[0] ??
    { ratio: "16:9", label: "YouTube", videoUrl: localClip.videoUrl };

  const aspectClass = FORMAT_META[activeFormat.ratio]?.aspect ?? "aspect-video";

  // Sync captions track mode whenever captionsEnabled changes
  useEffect(() => {
    const track = videoRef.current?.textTracks?.[0];
    if (track) track.mode = captionsEnabled ? "showing" : "hidden";
  }, [captionsEnabled]);

  // Reset video state when format changes
  useEffect(() => {
    setVideoReady(false);
    setIsPlayingManually(false);
  }, [activeFormat.videoUrl]);

  // ── Share handler ───────────────────────────────────────────────────────────
  const handleShare = () => {
    const url = `${window.location.origin}/share/${localClip.id}`;
    void navigator.clipboard.writeText(url).catch(() => undefined);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // ── Keyboard shortcuts (when card is focused) ───────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tag = (e.target as HTMLElement).tagName.toLowerCase();
    // Don't intercept keys when typing in inputs
    if (tag === "input" || tag === "textarea") return;

    const vid = videoRef.current;

    switch (e.key) {
      case " ":
      case "k":
        e.preventDefault();
        if (vid) {
          if (vid.paused) { void vid.play(); } else { vid.pause(); }
        }
        break;
      case "m":
        e.preventDefault();
        if (vid) vid.muted = !vid.muted;
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (vid) vid.currentTime = Math.max(0, vid.currentTime - 5);
        break;
      case "ArrowRight":
        e.preventDefault();
        if (vid) vid.currentTime = Math.min(vid.duration || Infinity, vid.currentTime + 5);
        break;
      case "1":
        e.preventDefault();
        setActiveTab("video");
        break;
      case "2":
        e.preventDefault();
        setActiveTab("editor");
        break;
      case "3":
        e.preventDefault();
        setActiveTab("social");
        break;
      case "4":
        e.preventDefault();
        setActiveTab("caption");
        break;
      default:
        break;
    }
  };

  const handleSaveTitle = async () => {
    const trimmed = editTitle.trim();
    if (!trimmed || trimmed === localClip.title) {
      setIsEditingTitle(false);
      setEditTitle(localClip.title);
      return;
    }

    // Optimistic update
    const previousTitle = localClip.title;
    setLocalClip((prev) => ({ ...prev, title: trimmed }));
    setIsEditingTitle(false);
    setTitleError(null);

    try {
      const res = await fetch("/api/clips/patch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, clipId: localClip.id, title: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      setTitleSaved(true);
      setTimeout(() => setTitleSaved(false), 1500);
    } catch {
      // Revert optimistic update on failure
      setLocalClip((prev) => ({ ...prev, title: previousTitle }));
      setEditTitle(previousTitle);
      setTitleError("No se pudo guardar el título");
      setTimeout(() => setTitleError(null), 2500);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    const downloadUrl = activeFormat.videoUrl;
    const baseName = localClip.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const suffix = ratioToFilename(activeFormat.ratio);
    const filename = `${baseName}_${suffix}.mp4`;

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(downloadUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* ── Score Breakdown Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {showBreakdown && (
          <ScoreBreakdown
            clip={localClip}
            onClose={() => setShowBreakdown(false)}
          />
        )}
      </AnimatePresence>

      <motion.div
        ref={cardRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
        className="group relative bg-[#111] border border-[#262626] rounded-2xl overflow-hidden
                   hover:border-violet-500/40 transition-all duration-300
                   hover:shadow-lg hover:shadow-violet-500/10 flex flex-col
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60"
      >
        {/* ── Keyboard shortcuts tooltip ──────────────────────────────────── */}
        <div
          className="absolute top-2 right-2 z-20"
          onMouseEnter={() => setShowShortcutsTooltip(true)}
          onMouseLeave={() => setShowShortcutsTooltip(false)}
        >
          <button
            tabIndex={-1}
            className="w-6 h-6 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center
                       justify-center text-[#525252] hover:text-white hover:border-[#555]
                       transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Atajos de teclado"
          >
            <Keyboard className="w-3 h-3" />
          </button>
          {showShortcutsTooltip && (
            <div className="absolute right-0 top-8 w-48 bg-[#1a1a1a] border border-[#333]
                            rounded-xl p-3 text-[11px] text-[#a3a3a3] space-y-1
                            shadow-xl shadow-black/60 z-30">
              <div className="flex items-center gap-1.5 text-white font-semibold mb-2 text-xs">
                <Keyboard className="w-3 h-3" />
                Atajos (foco en card)
              </div>
              <p><kbd className="bg-[#2a2a2a] px-1 rounded">Space</kbd> / <kbd className="bg-[#2a2a2a] px-1 rounded">K</kbd> — Play/Pause</p>
              <p><kbd className="bg-[#2a2a2a] px-1 rounded">M</kbd> — Silenciar</p>
              <p><kbd className="bg-[#2a2a2a] px-1 rounded">←</kbd> / <kbd className="bg-[#2a2a2a] px-1 rounded">→</kbd> — ±5s</p>
              <p><kbd className="bg-[#2a2a2a] px-1 rounded">1</kbd> Video · <kbd className="bg-[#2a2a2a] px-1 rounded">2</kbd> Editar</p>
              <p><kbd className="bg-[#2a2a2a] px-1 rounded">3</kbd> Social · <kbd className="bg-[#2a2a2a] px-1 rounded">4</kbd> Caption</p>
            </div>
          )}
        </div>
        {/* ── Card Header (always visible) ──────────────────────────────────── */}
        <div className="relative">
          {/* Thumbnail */}
          {localClip.thumbnailUrl && (
            <div className="relative h-32 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={localClip.thumbnailUrl}
                alt={localClip.title}
                className="w-full h-full object-cover"
              />
              {/* Dark gradient overlay so text is readable */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80" />
            </div>
          )}

          {/* Header info */}
          <div className={`flex flex-col gap-2 px-4 py-3 ${localClip.thumbnailUrl ? "absolute bottom-0 left-0 right-0" : ""}`}>
            {/* Title + score */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                {isEditingTitle ? (
                  <input
                    ref={titleInputRef}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => void handleSaveTitle()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); void handleSaveTitle(); }
                      if (e.key === "Escape") { setIsEditingTitle(false); setEditTitle(localClip.title); }
                    }}
                    className="bg-transparent border-b border-violet-500 outline-none text-white text-sm font-semibold w-full"
                    autoFocus
                  />
                ) : (
                  <h3
                    onClick={() => { setEditTitle(localClip.title); setIsEditingTitle(true); }}
                    className="text-sm font-semibold text-white leading-snug line-clamp-2 cursor-pointer group-hover:text-violet-100 flex items-center gap-1"
                  >
                    {localClip.title}
                    <Pencil className="w-3 h-3 ml-1 inline flex-shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
                  </h3>
                )}

                {titleSaved && (
                  <span className="flex items-center gap-1 text-green-400 text-xs mt-0.5">
                    <Check className="w-3 h-3" />
                    Guardado
                  </span>
                )}
                {titleError && (
                  <span className="text-red-400 text-xs mt-0.5">{titleError}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <ScoreBadge score={localClip.score} onClick={() => setShowBreakdown(true)} />
                {/* Share button */}
                <button
                  onClick={handleShare}
                  title="Copiar link para compartir"
                  className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center
                             justify-center text-[#525252] hover:text-violet-400 hover:border-violet-500/40
                             transition-colors flex-shrink-0"
                  aria-label="Compartir clip"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Share copied toast */}
              {shareCopied && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30
                                px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-[#333]
                                text-xs text-white shadow-lg shadow-black/40 pointer-events-none
                                whitespace-nowrap">
                  🔗 Link copiado!
                </div>
              )}
            </div>

            {/* Metric chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Emotion score chip */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium
                  ${localClip.emotionScore >= 70
                    ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
                    : localClip.emotionScore >= 40
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-[#1f1f1f] text-[#737373] border-[#333]"
                  }`}
              >
                <Zap className="w-3 h-3 flex-shrink-0" />
                {localClip.emotionScore}
              </span>

              {/* Filler words chip (only if > 0) */}
              {localClip.fillerWordsRemoved > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium
                                 bg-green-500/10 text-green-400 border-green-500/20">
                  <Scissors className="w-3 h-3 flex-shrink-0" />
                  {localClip.fillerWordsRemoved} muletilla{localClip.fillerWordsRemoved !== 1 ? "s" : ""}
                </span>
              )}

              {/* Timecode */}
              <span className="text-xs text-[#525252] flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(localClip.start)} → {formatTime(localClip.end)}
              </span>
            </div>

            {/* Hook */}
            {localClip.hook && localClip.hook.trim().length > 0 && (
              <p className="text-xs italic text-[#737373] line-clamp-1">{localClip.hook}</p>
            )}
          </div>
        </div>

        {/* ── Tab Bar ───────────────────────────────────────────────────────── */}
        <div className="flex border-b border-[#1f1f1f]">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 px-2 py-2.5 text-xs font-medium transition-all duration-150
                  ${isActive
                    ? "bg-violet-500/15 text-violet-400 border-b-2 border-violet-500"
                    : "text-[#525252] hover:text-[#a3a3a3] border-b-2 border-transparent"
                  }`}
                aria-selected={isActive}
              >
                <tab.Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="h-full"
            >
              {/* ── Video tab ──────────────────────────────────────────────── */}
              {activeTab === "video" && (
                <div className="flex flex-col gap-0">
                  {/* Format selector + captions toggle */}
                  {hasFormats && (
                    <div className="flex items-center justify-between gap-2 px-3 pt-3">
                      <div className="flex items-center gap-1.5">
                        {localClip.formats.map((fmt) => {
                          const meta = FORMAT_META[fmt.ratio];
                          const isActive = fmt.videoUrl === activeFormat.videoUrl;
                          return (
                            <button
                              key={fmt.ratio}
                              onClick={() => setSelectedFormat(fmt)}
                              className={`flex flex-col items-center px-2.5 py-1 rounded-full border text-xs font-medium transition-all duration-150
                                ${isActive
                                  ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                                  : "bg-[#0a0a0a] border-[#262626] text-[#525252] hover:text-[#a3a3a3]"
                                }`}
                              aria-pressed={isActive}
                              title={fmt.label}
                            >
                              <span className="flex items-center gap-1">
                                {meta?.Icon && <meta.Icon className="w-3 h-3 flex-shrink-0" />}
                                <span>{meta?.short ?? fmt.label}</span>
                              </span>
                              {isActive && meta?.resolution && (
                                <span className="text-[10px] text-[#404040] leading-none mt-0.5">
                                  {meta.resolution}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {localClip.captionsUrl && (
                        <button
                          onClick={() => setCaptionsEnabled((v) => !v)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-medium transition-all duration-150
                            ${captionsEnabled
                              ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                              : "bg-[#0a0a0a] border-[#262626] text-[#525252] hover:text-[#a3a3a3]"
                            }`}
                          aria-pressed={captionsEnabled}
                          title={captionsEnabled ? "Desactivar subtítulos" : "Activar subtítulos"}
                        >
                          <Captions className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {captionsEnabled ? "Subtítulos" : "Sin subtítulos"}
                          </span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Video player */}
                  <div
                    className={`relative ${aspectClass} bg-[#0a0a0a] flex-shrink-0 mt-2 max-h-[480px] overflow-hidden ${!isPlayingManually ? "cursor-pointer" : ""}`}
                    onMouseEnter={() => {
                      const vid = videoRef.current;
                      if (!vid || isPlayingManually) return;
                      vid.muted = true;
                      vid.currentTime = 0;
                      vid.play().catch((err: Error) => {
                        if (err.name !== "AbortError") console.error(err);
                      });
                    }}
                    onMouseLeave={() => {
                      const vid = videoRef.current;
                      if (!vid || isPlayingManually) return;
                      const p = vid.play().catch(() => undefined);
                      void p.then(() => { vid.pause(); vid.currentTime = 0; });
                    }}
                  >
                    {/* Skeleton loader — shown until video is ready */}
                    {!videoReady && (
                      <div className="absolute inset-0 z-10 bg-[#1a1a1a] animate-pulse transition-opacity duration-300" />
                    )}
                    <video
                      key={activeFormat.videoUrl}
                      ref={videoRef}
                      src={activeFormat.videoUrl}
                      poster={localClip.thumbnailUrl}
                      controls
                      muted
                      loop
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-contain"
                      aria-label={`Video clip: ${localClip.title}`}
                      onCanPlay={() => setVideoReady(true)}
                      onLoadedData={() => setVideoReady(true)}
                      onPlay={() => {
                        // Only mark as manually playing when user clicks native controls
                        // (hover auto-play keeps muted=true; user intent sets muted=false or uses controls)
                        const vid = videoRef.current;
                        if (vid && !vid.muted) setIsPlayingManually(true);
                      }}
                      onPause={() => {
                        const vid = videoRef.current;
                        if (vid && !vid.muted) setIsPlayingManually(false);
                      }}
                      onEnded={() => setIsPlayingManually(false)}
                    >
                      {captionsEnabled && localClip.captionsUrl && (
                        <track
                          kind="subtitles"
                          src={localClip.captionsUrl}
                          srcLang="es"
                          label="Español"
                          default
                        />
                      )}
                    </video>
                  </div>

                  {/* Download button */}
                  <div className="p-4">
                    <button
                      onClick={() => void handleDownload()}
                      disabled={isDownloading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                                 bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50
                                 text-white text-sm font-semibold transition-all duration-200
                                 shadow-md shadow-violet-500/20 hover:shadow-violet-500/40
                                 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {isDownloading ? "Descargando…" : "Descargar clip"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── Editor tab ─────────────────────────────────────────────── */}
              {activeTab === "editor" && (
                <div className="p-4 flex flex-col gap-3">
                  <TrimEditor
                    clip={localClip}
                    jobId={jobId}
                    onUpdate={(updated) => setLocalClip(updated)}
                  />
                  <button
                    onClick={() => alert("Esta funcionalidad estará disponible próximamente ✨")}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl
                               text-xs text-[#737373] border border-[#262626] hover:border-violet-500/30
                               hover:text-violet-400 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Regenerar con diferentes parámetros
                  </button>
                </div>
              )}

              {/* ── Social tab ─────────────────────────────────────────────── */}
              {activeTab === "social" && (
                <div className="p-4">
                  <SocialPreview clip={localClip} />
                </div>
              )}

              {/* ── Caption tab ────────────────────────────────────────────── */}
              {activeTab === "caption" && (
                <div className="p-4">
                  <CaptionPanel clip={localClip} />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
}
