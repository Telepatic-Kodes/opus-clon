// ─── Scheduler store — localStorage + simulated API (MVP) ────────────────────

export interface ScheduledPost {
  id: string;
  clipId: string;
  clipTitle: string;
  clipVideoUrl: string;
  jobId: string;
  platform: "tiktok" | "instagram" | "youtube";
  ratio: "9:16" | "1:1" | "16:9";
  scheduledAt: number; // unix timestamp ms
  caption: string;
  hashtags: string[];
  status: "pending" | "published" | "failed";
  createdAt: number;
}

const STORAGE_KEY = "aiaiai_scheduled_posts";

export function getScheduledPosts(): ScheduledPost[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? "[]"
    ) as ScheduledPost[];
  } catch {
    return [];
  }
}

export function saveScheduledPost(post: ScheduledPost): void {
  if (typeof window === "undefined") return;
  const posts = getScheduledPosts();
  posts.push(post);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function updatePostStatus(
  id: string,
  status: ScheduledPost["status"]
): void {
  if (typeof window === "undefined") return;
  const posts = getScheduledPosts().map((p) =>
    p.id === id ? { ...p, status } : p
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function deleteScheduledPost(id: string): void {
  if (typeof window === "undefined") return;
  const posts = getScheduledPosts().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}
