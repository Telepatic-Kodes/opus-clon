"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, Clock, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import type { Clip } from "@/types";

interface ClipCardProps {
  clip: Clip;
  index: number;
}

function ScoreBadge({ score }: { score: number }) {
  let colorClass = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (score >= 80) colorClass = "bg-green-500/20 text-green-400 border-green-500/30";
  else if (score >= 60) colorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${colorClass}`}
    >
      <TrendingUp className="w-3 h-3" />
      {score}
    </span>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ClipCard({ clip, index }: ClipCardProps) {
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const transcriptExcerpt = clip.transcript.length > 100
    ? clip.transcript.slice(0, 100) + "…"
    : clip.transcript;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(clip.videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${clip.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(clip.videoUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ scale: 1.02 }}
      className="group bg-[#111] border border-[#262626] rounded-2xl overflow-hidden
                 hover:border-violet-500/40 transition-all duration-300
                 hover:shadow-lg hover:shadow-violet-500/10 flex flex-col"
    >
      {/* Video player */}
      <div className="relative aspect-[9/16] bg-[#0a0a0a] flex-shrink-0">
        <video
          src={clip.videoUrl}
          poster={clip.thumbnailUrl}
          controls
          preload="metadata"
          className="absolute inset-0 w-full h-full object-contain"
          aria-label={`Video clip: ${clip.title}`}
        />
        {/* Score badge overlay */}
        <div className="absolute top-2 right-2 pointer-events-none">
          <ScoreBadge score={clip.score} />
        </div>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Title + duration row */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 flex-1">
            {clip.title}
          </h3>
          <div className="flex items-center gap-1 text-[#737373] text-xs whitespace-nowrap flex-shrink-0 mt-0.5">
            <Clock className="w-3 h-3" />
            {formatDuration(clip.duration)}
          </div>
        </div>

        {/* Timecode */}
        <p className="text-xs text-[#525252]">
          {formatTime(clip.start)} → {formatTime(clip.end)}
        </p>

        {/* Reason tag */}
        <div className="inline-flex items-center">
          <span className="px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20
                           text-violet-400 text-xs font-medium">
            {clip.reason}
          </span>
        </div>

        {/* Transcript */}
        <div className="text-xs text-[#a3a3a3] leading-relaxed">
          <p>{transcriptExpanded ? clip.transcript : transcriptExcerpt}</p>
          {clip.transcript.length > 100 && (
            <button
              onClick={() => setTranscriptExpanded((v) => !v)}
              className="mt-1 flex items-center gap-0.5 text-[#525252] hover:text-[#a3a3a3] transition-colors"
            >
              {transcriptExpanded ? (
                <>Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>More <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          )}
        </div>

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="mt-auto w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                     bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50
                     text-white text-sm font-semibold transition-all duration-200
                     shadow-md shadow-violet-500/20 hover:shadow-violet-500/40
                     disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {isDownloading ? "Downloading…" : "Download clip"}
        </button>
      </div>
    </motion.div>
  );
}
