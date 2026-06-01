"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import type { JobStatus } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface JobSummary {
  id: string;
  status: JobStatus;
  clipCount: number;
  topScore: number;
  thumbnails: string[];
  firstClipId?: string;
  firstClipTitle?: string;
}

// ─── Score badge ──────────────────────────────────────────────────────────────

function ScorePill({ score }: { score: number }) {
  let colorClass = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (score >= 80) colorClass = "bg-green-500/20 text-green-400 border-green-500/30";
  else if (score >= 60) colorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-semibold ${colorClass}`}
    >
      🔥 {score}
    </span>
  );
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-[#111] border border-[#1f1f1f] overflow-hidden animate-pulse">
      <div className="aspect-video bg-[#1a1a1a]" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 bg-[#1a1a1a] rounded w-3/4" />
        <div className="h-3 bg-[#1a1a1a] rounded w-1/4" />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecentClips() {
  const [clips, setClips] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/jobs", { cache: "no-store" });
        if (!res.ok) return;
        const jobs = (await res.json()) as JobSummary[];
        const completed = jobs
          .filter((j) => j.status === "done" && j.clipCount > 0 && j.firstClipId)
          .slice(0, 3);
        setClips(completed);
      } catch {
        // Silently fail — section just won't render
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Show skeletons while loading, then hide if no data
  if (!loading && clips.length === 0) return null;

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-10"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-white">
          ✨ Últimos clips generados
        </h2>
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          En vivo
        </span>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading
          ? [0, 1, 2].map((i) => <SkeletonCard key={i} />)
          : clips.map((job, i) => {
              const thumbnail = job.thumbnails[0] ?? "";
              const title = job.firstClipTitle ?? "Clip sin título";
              const clipId = job.firstClipId!;

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: i * 0.1 }}
                >
                  <Link
                    href={`/share/${clipId}`}
                    className="group block rounded-2xl bg-[#111] border border-[#1f1f1f]
                               hover:border-violet-500/40 overflow-hidden
                               transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/10"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-[#0a0a0a] overflow-hidden">
                      {thumbnail ? (
                        <Image
                          src={thumbnail}
                          alt={title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-3xl opacity-20">🎬</span>
                        </div>
                      )}

                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                          <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4 flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-[#d4d4d4] group-hover:text-white transition-colors line-clamp-2 flex-1">
                        {title}
                      </p>
                      <div className="shrink-0 mt-0.5">
                        <ScorePill score={job.topScore} />
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="px-4 pb-4">
                      <span className="text-xs text-violet-400 group-hover:text-violet-300 transition-colors">
                        Ver clip →
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
      </div>
    </section>
  );
}
