/**
 * localStorage helper for tracking submitted job IDs on the client.
 * All functions guard against SSR (typeof window === "undefined").
 */

const STORAGE_KEY = "opus_jobs";

export interface LocalJob {
  jobId: string;
  url: string;
  createdAt: number;
}

/**
 * Save a new job entry to localStorage. Deduplicates by jobId.
 */
export function saveJob(jobId: string, url: string): void {
  if (typeof window === "undefined") return;

  const existing = getJobIds();
  const alreadyExists = existing.some((j) => j.jobId === jobId);
  if (alreadyExists) return;

  const updated: LocalJob[] = [
    { jobId, url, createdAt: Date.now() },
    ...existing,
  ];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable in private browsing
    console.warn("Could not write to localStorage");
  }
}

/**
 * Read all locally stored job entries, newest first.
 */
export function getJobIds(): LocalJob[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Basic runtime validation
    return parsed.filter(
      (item): item is LocalJob =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as Record<string, unknown>).jobId === "string" &&
        typeof (item as Record<string, unknown>).url === "string" &&
        typeof (item as Record<string, unknown>).createdAt === "number"
    );
  } catch {
    return [];
  }
}

/**
 * Remove all stored job entries.
 */
export function clearJobs(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn("Could not clear localStorage");
  }
}
