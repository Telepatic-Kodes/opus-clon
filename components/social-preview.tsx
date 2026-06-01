"use client";

import { useState } from "react";
import type { Clip } from "@/types";

interface SocialPreviewProps {
  clip: Clip;
  platform?: "tiktok" | "instagram" | "youtube";
}

type Platform = "tiktok" | "instagram" | "youtube";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TikTokFrame({ clip }: { clip: Clip }) {
  const videoUrl =
    clip.formats.find((f) => f.ratio === "9:16")?.videoUrl ?? clip.videoUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Phone frame */}
      <div
        className="relative w-56 h-[400px] rounded-[2rem] border-2 border-[#333] bg-black overflow-hidden flex-shrink-0"
      >
        {/* Video */}
        <video
          src={videoUrl}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
          autoPlay
        />

        {/* Right-side action buttons overlay */}
        <div className="absolute right-2 bottom-20 flex flex-col items-center gap-3 z-10">
          {(
            [
              { icon: "❤️", label: "45.2K" },
              { icon: "💬", label: "1.2K" },
              { icon: "🔁", label: "Share" },
              { icon: "⚡", label: "Duet" },
            ] as const
          ).map((btn) => (
            <div
              key={btn.label}
              className="flex flex-col items-center gap-0.5 bg-black/40 rounded-lg px-1.5 py-1"
            >
              <span className="text-base leading-none">{btn.icon}</span>
              <span className="text-white text-[9px] font-semibold">
                {btn.label}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 z-10 px-3 pb-4 pt-8 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white text-[11px] font-semibold leading-snug">
            @usuario &middot; {clip.title.slice(0, 40)}
            {clip.title.length > 40 ? "..." : ""}
          </p>
          <p className="text-white/80 text-[10px] mt-0.5">
            {clip.hashtags.slice(0, 3).join(" ")}
          </p>
        </div>
      </div>
    </div>
  );
}

function InstagramFrame({ clip }: { clip: Clip }) {
  const videoUrl =
    clip.formats.find((f) => f.ratio === "1:1")?.videoUrl ?? clip.videoUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Instagram card */}
      <div className="w-64 rounded-xl overflow-hidden bg-[#111] border border-[#262626]">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-[#333] flex-shrink-0" />
            <span className="text-white text-xs font-semibold">tu_usuario</span>
          </div>
          <button className="text-[#8b5cf6] text-xs font-semibold">
            Seguir
          </button>
        </div>

        {/* Square video with gradient border wrapper */}
        <div className="relative p-[2px] bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
          <div className="w-full aspect-square bg-black overflow-hidden rounded-[10px]">
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              loop
              playsInline
              autoPlay
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="text-white text-base leading-none">♥</button>
            <button className="text-white text-base leading-none">💬</button>
            <button className="text-white text-base leading-none">✈️</button>
          </div>
          <button className="text-white text-base leading-none">🔖</button>
        </div>

        {/* Like count */}
        <div className="px-3 pb-3">
          <p className="text-white text-[11px] font-semibold">12,430 Me gusta</p>
          <p className="text-[#a3a3a3] text-[11px] mt-0.5">
            <span className="text-white font-semibold">tu_usuario</span>{" "}
            {clip.title.slice(0, 60)}
            {clip.title.length > 60 ? "..." : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function YouTubeFrame({ clip }: { clip: Clip }) {
  const videoUrl =
    clip.formats.find((f) => f.ratio === "16:9")?.videoUrl ?? clip.videoUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* YouTube card */}
      <div className="w-72 rounded-xl overflow-hidden bg-[#111] border border-[#262626]">
        {/* Thumbnail area */}
        <div className="relative w-full h-40 bg-black overflow-hidden">
          {clip.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={clip.thumbnailUrl}
              alt={clip.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <video
              src={videoUrl}
              className="w-full h-full object-cover"
              muted
              playsInline
              preload="metadata"
            />
          )}

          {/* Duration badge */}
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-[11px] font-bold px-1.5 py-0.5 rounded">
            ▶ {formatDuration(clip.duration)}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#333]">
            <div className="h-full w-[30%] bg-red-600" />
          </div>
        </div>

        {/* Video info */}
        <div className="flex gap-2 p-3">
          {/* Channel avatar */}
          <div className="w-8 h-8 rounded-full bg-[#333] flex-shrink-0 mt-0.5" />

          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold leading-snug line-clamp-2">
              {clip.title}
            </p>
            <p className="text-[#a3a3a3] text-[11px] mt-1">Mi Canal</p>
            <p className="text-[#737373] text-[11px]">
              3 días &middot; 12K visualizaciones
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

const PLATFORMS: { id: Platform; emoji: string; label: string }[] = [
  { id: "tiktok", emoji: "📱", label: "TikTok" },
  { id: "instagram", emoji: "📸", label: "Instagram" },
  { id: "youtube", emoji: "🎬", label: "YouTube" },
];

export default function SocialPreview({
  clip,
  platform = "tiktok",
}: SocialPreviewProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(platform);

  return (
    <div className="flex flex-col gap-6">
      {/* Platform selector tabs */}
      <div className="flex items-center gap-2">
        {PLATFORMS.map((p) => {
          const isActive = selectedPlatform === p.id;

          let activeClass = "";
          if (p.id === "tiktok" && isActive) {
            activeClass =
              "bg-black border-white/80 text-white shadow-[0_0_0_1px_rgba(255,20,147,0.4)]";
          } else if (p.id === "instagram" && isActive) {
            activeClass =
              "bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 border-transparent text-white";
          } else if (p.id === "youtube" && isActive) {
            activeClass = "bg-red-600/10 border-red-500 text-red-400";
          }

          const inactiveClass =
            "bg-[#111] border-[#262626] text-[#737373] hover:text-[#a3a3a3] hover:border-[#404040]";

          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlatform(p.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-all duration-200
                ${isActive ? activeClass : inactiveClass}`}
              aria-pressed={isActive}
            >
              <span>{p.emoji}</span>
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Platform frame */}
      <div className="flex justify-center">
        {selectedPlatform === "tiktok" && <TikTokFrame clip={clip} />}
        {selectedPlatform === "instagram" && <InstagramFrame clip={clip} />}
        {selectedPlatform === "youtube" && <YouTubeFrame clip={clip} />}
      </div>
    </div>
  );
}
