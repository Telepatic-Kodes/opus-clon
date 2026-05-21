"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Film, RefreshCw } from "lucide-react";
import ProjectCard from "@/components/dashboard/project-card";
import { getJobIds } from "@/lib/local-jobs";
import type { Job } from "@/types";

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
      <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
      <p className="text-sm text-[#737373] max-w-xs mb-8 leading-relaxed">
        Submit a video URL from the homepage and your clips will appear here
        automatically.
      </p>
      <Link
        href="/"
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-violet-500 hover:from-violet-500 hover:to-violet-400 transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
      >
        <Plus className="w-4 h-4" />
        Process your first video
      </Link>
    </motion.div>
  );
}

// ─── Dashboard page ───────────────────────────────────────────────────────────

const ACTIVE_STATUSES = new Set(["queued", "downloading", "transcribing", "analyzing", "cutting"]);

async function fetchJob(jobId: string): Promise<Job | null> {
  try {
    const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as Job;
  } catch {
    return null;
  }
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all jobs from local storage IDs
  const loadJobs = useCallback(async () => {
    const localJobs = getJobIds();
    if (localJobs.length === 0) {
      setLoading(false);
      setJobs([]);
      return;
    }

    const results = await Promise.all(localJobs.map((lj) => fetchJob(lj.jobId)));

    // Merge API results with locally stored metadata for jobs not yet found on server
    const merged: Job[] = localJobs.map((lj, i) => {
      const apiJob = results[i];
      if (apiJob) return apiJob;
      // Fallback placeholder for jobs the server doesn't know about yet
      return {
        id: lj.jobId,
        url: lj.url,
        status: "queued" as const,
        progress: 0,
        message: "Waiting to start…",
        clips: [],
        createdAt: lj.createdAt,
      };
    });

    setJobs(merged);
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

  return (
    <div className="flex-1 flex flex-col">
      {/* Page header */}
      <div className="px-6 py-6 border-b border-[#1f1f1f] flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">My Projects</h1>
          <p className="text-sm text-[#737373] mt-0.5">
            {jobs.length > 0
              ? `${jobs.length} project${jobs.length !== 1 ? "s" : ""}`
              : "No projects yet"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => void loadJobs()}
            className="p-2 rounded-lg text-[#737373] hover:text-white hover:bg-[#1a1a1a] border border-[#262626] hover:border-[#333] transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New video
          </Link>
        </div>
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
        ) : (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {jobs.map((job, index) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.06, ease: "easeOut" }}
              >
                <ProjectCard job={job} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
