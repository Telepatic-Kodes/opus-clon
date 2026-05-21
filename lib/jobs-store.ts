/**
 * In-memory job store using a module-level Map singleton.
 * NOTE: This is suitable for dev/demo only. Jobs will not persist
 * across server restarts or across multiple serverless instances.
 */

import type { Job, JobStatus } from "@/types";

// Module-level singleton — shared across all imports within the same process.
const store = new Map<string, Job>();

export function getJob(id: string): Job | undefined {
  return store.get(id);
}

export function setJob(job: Job): void {
  store.set(job.id, job);
}

/**
 * Partially update a job. Only the provided keys are merged onto the
 * existing record; the rest are left intact.
 */
export function updateJob(id: string, patch: Partial<Job>): Job | undefined {
  const existing = store.get(id);
  if (!existing) return undefined;
  const updated: Job = { ...existing, ...patch };
  store.set(id, updated);
  return updated;
}

export function updateJobStatus(
  id: string,
  status: JobStatus,
  progress: number,
  message: string
): Job | undefined {
  return updateJob(id, { status, progress, message });
}

export function getAllJobs(): Job[] {
  return Array.from(store.values());
}

export { store as jobsStore };
