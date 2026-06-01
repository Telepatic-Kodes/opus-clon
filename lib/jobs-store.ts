/**
 * SQLite-backed job store using better-sqlite3.
 * Public interface is identical to the previous in-memory implementation
 * so no callers need to change.
 */

import db from "@/lib/db";
import type { Job, JobStatus } from "@/types";

// ---------------------------------------------------------------------------
// Row shape returned by better-sqlite3
// ---------------------------------------------------------------------------

interface JobRow {
  id: string;
  url: string;
  status: string;
  progress: number;
  message: string;
  clips: string;
  error: string | null;
  created_at: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    url: row.url,
    status: row.status as Job["status"],
    progress: row.progress,
    message: row.message,
    clips: JSON.parse(row.clips) as Job["clips"],
    ...(row.error !== null ? { error: row.error } : {}),
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function getJob(id: string): Job | undefined {
  const row = db.prepare("SELECT * FROM jobs WHERE id = ?").get(id) as JobRow | undefined;
  return row ? rowToJob(row) : undefined;
}

export function setJob(job: Job): void {
  db.prepare(`
    INSERT OR REPLACE INTO jobs (id, url, status, progress, message, clips, error, created_at)
    VALUES (@id, @url, @status, @progress, @message, @clips, @error, @created_at)
  `).run({
    id: job.id,
    url: job.url,
    status: job.status,
    progress: job.progress,
    message: job.message,
    clips: JSON.stringify(job.clips ?? []),
    error: job.error ?? null,
    created_at: job.createdAt,
  });
}

/**
 * Partially update a job. Only the provided keys are merged onto the
 * existing record; the rest are left intact.
 */
export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
  const existing = getJob(id);
  if (!existing) return undefined;
  const updated: Job = { ...existing, ...patch };
  setJob(updated);
  return updated;
}

export function updateJobStatus(
  id: string,
  status: JobStatus,
  progress: number,
  message: string
): Job | undefined {
  db.prepare(
    "UPDATE jobs SET status = ?, progress = ?, message = ? WHERE id = ?"
  ).run(status, progress, message, id);
  return getJob(id);
}

export function getAllJobs(): Job[] {
  const rows = db
    .prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 50")
    .all() as JobRow[];
  return rows.map(rowToJob);
}

export function deleteJob(id: string): void {
  db.prepare("DELETE FROM jobs WHERE id = ?").run(id);
}

// ---------------------------------------------------------------------------
// Legacy compat — callers that imported `jobsStore` directly
// ---------------------------------------------------------------------------

/**
 * Proxy object that satisfies the `Map<string, Job>` subset used by callers
 * that imported `jobsStore` from this module. Backed by SQLite under the hood.
 */
export const jobsStore = {
  get: (id: string) => getJob(id),
  set: (_id: string, job: Job) => { setJob(job); return jobsStore; },
  has: (id: string) => getJob(id) !== undefined,
  values: () => getAllJobs()[Symbol.iterator](),
};
