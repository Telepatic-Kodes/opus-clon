"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Timer,
  Info,
} from "lucide-react";
import {
  getScheduledPosts,
  deleteScheduledPost,
  type ScheduledPost,
} from "@/lib/scheduler";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type Platform = "tiktok" | "instagram" | "youtube";

// ─── Platform config ───────────────────────────────────────────────────────────

interface PlatformConfig {
  id: Platform;
  label: string;
  color: string;
  bestTimes: string[];
  icon: React.ReactNode;
}

// ─── SVG platform icons ────────────────────────────────────────────────────────

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.77a4.85 4.85 0 01-1-.08z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "tiktok",
    label: "TIKTOK",
    color: "#FF0050",
    bestTimes: ["7:00 PM", "9:00 PM", "11:00 PM"],
    icon: <TikTokIcon className="w-4 h-4" />,
  },
  {
    id: "instagram",
    label: "INSTAGRAM",
    color: "#E1306C",
    bestTimes: ["11:00 AM", "2:00 PM", "7:00 PM"],
    icon: <InstagramIcon className="w-4 h-4" />,
  },
  {
    id: "youtube",
    label: "YOUTUBE",
    color: "#FF0000",
    bestTimes: ["12:00 PM", "3:00 PM", "6:00 PM"],
    icon: <YouTubeIcon className="w-4 h-4" />,
  },
];

// ─── Constants ─────────────────────────────────────────────────────────────────

const WEEK_DAYS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatScheduledAt(ts: number): string {
  const d = new Date(ts);
  const months = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ];
  const day = d.getDate().toString().padStart(2, "0");
  const month = months[d.getMonth()];
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} · ${h}:${m}`;
}

function getDayOfWeek(ts: number): number {
  // getDay() → 0=Sun…6=Sat; convert to Mon=0…Sun=6
  const d = new Date(ts).getDay();
  return d === 0 ? 6 : d - 1;
}

function getPlatformConfig(id: Platform): PlatformConfig {
  return PLATFORMS.find((p) => p.id === id) ?? PLATFORMS[0];
}

// ─── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ScheduledPost["status"] }) {
  if (status === "published") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        <span style={{ fontFamily: "var(--font-mono)" }}>PUBLICADO</span>
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="flex items-center gap-1 text-[10px] font-medium text-red-400">
        <AlertCircle className="w-3 h-3" />
        <span style={{ fontFamily: "var(--font-mono)" }}>FALLIDO</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1 text-[10px] font-medium text-yellow-400">
      <Timer className="w-3 h-3" />
      <span style={{ fontFamily: "var(--font-mono)" }}>PENDIENTE</span>
    </span>
  );
}

// ─── Platform badge ────────────────────────────────────────────────────────────

function PlatformBadge({ platform }: { platform: Platform }) {
  const cfg = getPlatformConfig(platform);
  return (
    <span
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
      style={{
        fontFamily: "var(--font-mono)",
        color: cfg.color,
        background: `${cfg.color}18`,
        border: `1px solid ${cfg.color}35`,
      }}
    >
      {platform === "tiktok" && <TikTokIcon className="w-2.5 h-2.5" />}
      {platform === "instagram" && <InstagramIcon className="w-2.5 h-2.5" />}
      {platform === "youtube" && <YouTubeIcon className="w-2.5 h-2.5" />}
      {cfg.label}
    </span>
  );
}

// ─── Weekly grid ──────────────────────────────────────────────────────────────

interface WeeklyGridProps {
  posts: ScheduledPost[];
  selectedPlatform: Platform;
}

function WeeklyGrid({ posts, selectedPlatform }: WeeklyGridProps) {
  const platformPosts = posts.filter((p) => p.platform === selectedPlatform);

  return (
    <div className="rounded-2xl border border-[#1E2030] overflow-hidden">
      {/* Header row */}
      <div className="grid grid-cols-7 border-b border-[#1E2030]">
        {WEEK_DAYS.map((day) => (
          <div
            key={day}
            className="py-2.5 text-center text-[10px] font-bold tracking-widest border-r border-[#1E2030] last:border-r-0"
            style={{
              fontFamily: "var(--font-mono)",
              color: "#6B6D82",
              background: "#12131A",
            }}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Slots row */}
      <div className="grid grid-cols-7">
        {WEEK_DAYS.map((day, dayIdx) => {
          const dayPosts = platformPosts.filter(
            (p) => getDayOfWeek(p.scheduledAt) === dayIdx
          );

          return (
            <div
              key={day}
              className="min-h-[100px] p-2 border-r border-[#1E2030] last:border-r-0 flex flex-col gap-1.5"
              style={{ background: "#0B0C10" }}
            >
              {dayPosts.length === 0 ? (
                <span
                  className="text-[9px] mt-2 text-center w-full"
                  style={{ color: "#2E3050", fontFamily: "var(--font-mono)" }}
                >
                  —
                </span>
              ) : (
                dayPosts.map((post) => {
                  const cfg = getPlatformConfig(post.platform);
                  const d = new Date(post.scheduledAt);
                  const timeStr = `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
                  return (
                    <div
                      key={post.id}
                      className="rounded px-1.5 py-1 text-[9px] leading-tight"
                      style={{
                        background: `${cfg.color}15`,
                        borderLeft: `2px solid ${cfg.color}`,
                        color: "#F0F0F2",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      <div className="font-bold" style={{ color: cfg.color }}>
                        {timeStr}
                      </div>
                      <div
                        className="truncate mt-0.5"
                        style={{ color: "#9597B0" }}
                      >
                        {post.clipTitle}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scheduled post row ────────────────────────────────────────────────────────

interface PostRowProps {
  post: ScheduledPost;
  onDelete: (id: string) => void;
}

function PostRow({ post, onDelete }: PostRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1E2030] hover:border-[#2E3050] transition-colors group"
      style={{ background: "#12131A" }}
    >
      {/* Thumbnail / video indicator */}
      <div
        className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#1E2030]"
        style={{ background: "#0B0C10" }}
      >
        {post.clipVideoUrl ? (
          // Show a video "poster" placeholder since we can't easily load video in a tiny thumb
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: "#1A1C26" }}
          >
            <svg
              className="w-4 h-4"
              style={{ color: "#6B6D82" }}
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        ) : (
          <svg
            className="w-4 h-4"
            style={{ color: "#6B6D82" }}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-xs font-medium truncate"
          style={{ color: "#F0F0F2" }}
        >
          {post.clipTitle || "Clip sin título"}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <PlatformBadge platform={post.platform} />
          <span
            className="flex items-center gap-1 text-[10px]"
            style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
          >
            <Clock className="w-2.5 h-2.5" />
            {formatScheduledAt(post.scheduledAt)}
          </span>
        </div>
      </div>

      {/* Status */}
      <div className="flex-shrink-0">
        <StatusBadge status={post.status} />
      </div>

      {/* Delete */}
      <button
        onClick={() => onDelete(post.id)}
        className="flex-shrink-0 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500/10"
        style={{ color: "#6B6D82" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "#FF3B3B";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "#6B6D82";
        }}
        aria-label="Eliminar post programado"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptySchedule() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 border"
        style={{ background: "#12131A", borderColor: "#1E2030" }}
      >
        <Calendar className="w-6 h-6" style={{ color: "#6B6D82" }} />
      </div>
      <p
        className="text-sm font-medium mb-2"
        style={{ color: "#F0F0F2", fontFamily: "var(--font-display)" }}
      >
        Sin clips programados
      </p>
      <p
        className="text-xs max-w-xs leading-relaxed"
        style={{ color: "#6B6D82", fontFamily: "var(--font-mono)" }}
      >
        Aún no hay clips programados. Ve a tus proyectos y programa tu primer clip.
      </p>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>("tiktok");

  // Load from localStorage
  useEffect(() => {
    setPosts(getScheduledPosts());
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteScheduledPost(id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const activePlatform = getPlatformConfig(selectedPlatform);

  // Stats
  const total = posts.length;
  const pending = posts.filter((p) => p.status === "pending").length;
  const published = posts.filter((p) => p.status === "published").length;

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ color: "#F0F0F2" }}>
      {/* ─── Demo banner ──────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-5 py-3 border-b border-[#1E2030]"
        style={{ background: "#12131A" }}
      >
        <Info
          className="w-3.5 h-3.5 flex-shrink-0"
          style={{ color: "#A8FF00" }}
        />
        <p
          className="text-[10px] tracking-wide"
          style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
        >
          <span style={{ color: "#A8FF00" }}>MODO DEMO</span>
          {" — "}
          La publicación automática requiere conectar tus redes sociales en
          Settings
        </p>
      </div>

      {/* ─── Header ───────────────────────────────────────────────────────── */}
      <div className="px-6 py-6 border-b border-[#1E2030]">
        <h1
          className="text-lg font-black tracking-tight mb-1"
          style={{ fontFamily: "var(--font-display)", color: "#F0F0F2" }}
        >
          PROGRAMAR CONTENIDO
        </h1>
        <p
          className="text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
        >
          Selecciona un clip y programa su publicación
        </p>

        {/* Stats row */}
        {total > 0 && (
          <div className="flex items-center gap-4 mt-4">
            {[
              { label: "TOTAL", value: total, color: "#F0F0F2" },
              { label: "PENDIENTE", value: pending, color: "#FACC15" },
              { label: "PUBLICADO", value: published, color: "#34D399" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <span
                  className="text-base font-bold"
                  style={{ color, fontFamily: "var(--font-display)" }}
                >
                  {value}
                </span>
                <span
                  className="text-[10px]"
                  style={{
                    color: "#6B6D82",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Platform tabs ────────────────────────────────────────────────── */}
      <div className="px-6 pt-5">
        <div className="flex items-center gap-2">
          {PLATFORMS.map((platform) => {
            const isActive = selectedPlatform === platform.id;
            return (
              <button
                key={platform.id}
                onClick={() => setSelectedPlatform(platform.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-bold tracking-widest uppercase transition-all border",
                  isActive ? "border-transparent" : "border-[#1E2030]"
                )}
                style={{
                  fontFamily: "var(--font-mono)",
                  background: isActive ? `${platform.color}20` : "#12131A",
                  color: isActive ? platform.color : "#6B6D82",
                  borderColor: isActive ? `${platform.color}40` : "#1E2030",
                  boxShadow: isActive
                    ? `0 0 12px ${platform.color}20`
                    : "none",
                }}
              >
                <span
                  style={{ color: isActive ? platform.color : "#4B4D62" }}
                >
                  {platform.icon}
                </span>
                {platform.label}
              </button>
            );
          })}
        </div>

        {/* Best times pills */}
        <div className="flex items-center gap-2 mt-4">
          <span
            className="text-[10px] mr-1"
            style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
          >
            MEJORES MOMENTOS
          </span>
          {activePlatform.bestTimes.map((time) => (
            <span
              key={time}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium border"
              style={{
                fontFamily: "var(--font-mono)",
                background: `${activePlatform.color}10`,
                color: activePlatform.color,
                borderColor: `${activePlatform.color}30`,
              }}
            >
              <Clock className="w-2.5 h-2.5" />
              {time}
            </span>
          ))}
        </div>
      </div>

      {/* ─── Two-column layout: grid + list ───────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 px-6 py-6 min-h-0">
        {/* Left: weekly calendar grid */}
        <div className="flex flex-col gap-4">
          <h2
            className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-2"
            style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
          >
            <Calendar className="w-3.5 h-3.5" />
            SEMANA ACTUAL
          </h2>
          <WeeklyGrid posts={posts} selectedPlatform={selectedPlatform} />
        </div>

        {/* Right: posts list */}
        <div className="flex flex-col gap-4 min-h-0">
          <h2
            className="text-[11px] font-bold tracking-widest uppercase flex items-center gap-2"
            style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
          >
            <Timer className="w-3.5 h-3.5" />
            POSTS PROGRAMADOS
            {total > 0 && (
              <span
                className="ml-auto px-2 py-0.5 rounded-full text-[9px] font-bold"
                style={{
                  background: "#A8FF0018",
                  color: "#A8FF00",
                  border: "1px solid #A8FF0030",
                }}
              >
                {total}
              </span>
            )}
          </h2>

          {posts.length === 0 ? (
            <EmptySchedule />
          ) : (
            <div className="flex flex-col gap-2 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {posts
                  .slice()
                  .sort((a, b) => a.scheduledAt - b.scheduledAt)
                  .map((post) => (
                    <PostRow
                      key={post.id}
                      post={post}
                      onDelete={handleDelete}
                    />
                  ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
