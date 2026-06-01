"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Film, RefreshCw, Video, Clapperboard, Star, Search } from "lucide-react";
import ProjectCard from "@/components/dashboard/project-card";
import { removeJob } from "@/lib/local-jobs";
import type { JobSummary } from "@/app/api/jobs/route";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────────

type FilterOption = "all" | "done" | "active" | "error";
type SortOption = "newest" | "best-score" | "most-clips";

// ─── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-[#111] border border-[#262626]">
      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-xs text-[#737373] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 px-6 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6">
        <Film className="w-7 h-7 text-violet-400" />
      </div>
      <h2 className="text-xl font-semibold text-white mb-2">Sin proyectos aún</h2>
      <p className="text-sm text-[#737373] max-w-xs mb-8 leading-relaxed">
        Procesa un video desde la página principal y tus clips aparecerán aquí
        automáticamente.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
      >
        <Plus className="w-4 h-4" />
        Procesar mi primer video
      </Link>
    </motion.div>
  );
}

// ─── No results state (after filters) ────────────────────────────────────────

function NoResultsState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <p className="text-[#737373] text-sm mb-4">Sin resultados para los filtros actuales.</p>
      <button
        onClick={onClear}
        className="text-violet-400 hover:text-violet-300 text-sm transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(["queued", "downloading", "transcribing", "analyzing", "cutting"]);

async function fetchAllJobs(): Promise<JobSummary[]> {
  try {
    const res = await fetch("/api/jobs", { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as JobSummary[];
  } catch {
    return [];
  }
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [search, setSearch] = useState("");

  // Fetch all jobs from the server DB
  const loadJobs = useCallback(async () => {
    const results = await fetchAllJobs();
    setJobs(results);
    setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  // Auto-refresh every 10s while any job is still active
  useEffect(() => {
    const hasActive = jobs.some((j) => ACTIVE_STATUSES.has(j.status));
    if (!hasActive) return;

    const interval = setInterval(() => {
      void loadJobs();
    }, 10_000);

    return () => clearInterval(interval);
  }, [jobs, loadJobs]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalJobs = jobs.length;
  const totalClips = jobs.reduce((acc, j) => acc + j.clipCount, 0);
  const avgScore = useMemo(() => {
    const jobsWithClips = jobs.filter((j) => j.clipCount > 0);
    if (jobsWithClips.length === 0) return "—";
    const avg =
      jobsWithClips.reduce((a, j) => a + j.avgScore, 0) / jobsWithClips.length;
    return avg.toFixed(1);
  }, [jobs]);

  // ── Filtered + sorted list ───────────────────────────────────────────────────
  const displayedJobs = useMemo(() => {
    let list = [...jobs];

    // Filter
    if (filter === "done") list = list.filter((j) => j.status === "done");
    else if (filter === "active") list = list.filter((j) => ACTIVE_STATUSES.has(j.status));
    else if (filter === "error") list = list.filter((j) => j.status === "error");

    // Search by URL
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((j) => j.url.toLowerCase().includes(q));
    }

    // Sort
    if (sort === "newest") {
      list.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === "best-score") {
      list.sort((a, b) => b.avgScore - a.avgScore);
    } else if (sort === "most-clips") {
      list.sort((a, b) => b.clipCount - a.clipCount);
    }

    return list;
  }, [jobs, filter, sort, search]);

  // ── Delete a job ─────────────────────────────────────────────────────────────
  const handleDeleteJob = useCallback(async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    } catch {
      // Ignore network errors — still remove locally
    }
    removeJob(jobId);
    setJobs((prev) => prev.filter((j) => j.id !== jobId));
  }, []);

  const clearFilters = () => {
    setFilter("all");
    setSort("newest");
    setSearch("");
  };

  const filterLabels: Record<FilterOption, string> = {
    all: "Todos",
    done: "Completados",
    active: "En proceso",
    error: "Con error",
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Page header */}
      <div className="px-6 py-6 border-b border-[#1f1f1f]">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">Mis Proyectos</h1>
            <p className="text-sm text-[#737373] mt-0.5">
              {totalJobs > 0
                ? `${totalJobs} proyecto${totalJobs !== 1 ? "s" : ""}`
                : "Sin proyectos aún"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => void loadJobs()}
              className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#333] transition-all"
              title="Actualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo video
            </Link>
          </div>
        </div>

        {/* Stats row */}
        {!loading && totalJobs > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <StatCard
              icon={<Video className="w-5 h-5 text-violet-400" />}
              value={totalJobs}
              label="Videos procesados"
            />
            <StatCard
              icon={<Clapperboard className="w-5 h-5 text-violet-400" />}
              value={totalClips}
              label="Clips generados"
            />
            <StatCard
              icon={<Star className="w-5 h-5 text-violet-400" />}
              value={avgScore}
              label="Score promedio"
            />
          </div>
        )}

        {/* Search + filters + sort row */}
        {!loading && totalJobs > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#262626] focus-within:border-violet-500/50 transition-colors flex-1 min-w-0 max-w-xs">
              <Search className="w-3.5 h-3.5 text-[#525252] flex-shrink-0" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por URL…"
                className="flex-1 bg-transparent text-xs text-white placeholder:text-[#525252] outline-none min-w-0"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {(Object.keys(filterLabels) as FilterOption[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                    filter === f
                      ? "bg-violet-600 text-white"
                      : "bg-[#111] border border-[#262626] text-[#737373] hover:text-white hover:border-[#333]"
                  )}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>

            {/* Sort select */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-lg bg-[#111] border border-[#262626] text-xs text-[#a3a3a3] outline-none hover:border-[#333] transition-colors cursor-pointer"
            >
              <option value="newest">Más reciente primero</option>
              <option value="best-score">Mejor score</option>
              <option value="most-clips">Más clips</option>
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {loading ? (
          // Skeleton grid
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-[#111] border border-[#262626] animate-pulse"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <EmptyState />
        ) : displayedJobs.length === 0 ? (
          <NoResultsState onClear={clearFilters} />
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {displayedJobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
              >
                <ProjectCard job={job} onDelete={handleDeleteJob} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
