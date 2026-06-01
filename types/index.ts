export type JobStatus = "queued" | "downloading" | "transcribing" | "analyzing" | "cutting" | "done" | "error";

export interface ViralMoment {
  start: number;   // seconds
  end: number;     // seconds
  title: string;
  reason: string;
  score: number;   // 0-100 virality score
  hook: string;
  emotionScore: number;
  hashtags: string[];
}

export interface ClipFormat {
  ratio: "9:16" | "1:1" | "16:9";
  label: string;   // "TikTok / Reels", "Instagram", "YouTube / LinkedIn"
  videoUrl: string;
}

export interface Clip {
  id: string;
  title: string;
  start: number;
  end: number;
  duration: number;
  transcript: string;
  reason: string;
  score: number;
  videoUrl: string;        // 16:9 original (backward-compatible default)
  thumbnailUrl: string;    // /clips/<jobId>/<id>_thumb.jpg (empty string if extraction failed)
  captionsUrl?: string;    // WebVTT URL e.g. /clips/<jobId>/<id>.vtt
  formats: ClipFormat[];   // all 3 format variants
  hashtags: string[];      // ["#viral", "#tips", "#marketing"]
  hook: string;            // "Abre con estadística sorprendente"
  emotionScore: number;    // 0-100 energía/emoción del momento
  fillerWordsRemoved: number; // cuántas muletillas eliminadas
}

export interface Job {
  id: string;
  url: string;
  status: JobStatus;
  progress: number;   // 0-100
  message: string;
  clips: Clip[];
  error?: string;
  createdAt: number;
}

export interface ProcessVideoRequest {
  url: string;
  model?: string;
  clipCount?: number;
  minDuration?: number;
  maxDuration?: number;
  formats?: string[];
}

export interface ProcessVideoResponse {
  jobId: string;
  status: JobStatus;
}

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number;
  message: string;
  clips: Clip[];
  error?: string;
  createdAt: number;
  url: string;
}

// ─── Brand Kit ────────────────────────────────────────────────────────────────

export interface BrandKit {
  id: string;
  name: string;
  primaryColor: string;
  textColor: string;
  watermarkText: string;
  watermarkPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  watermarkSize: number;
  introText?: string;
  createdAt: number;
}

// ─── Scheduler ────────────────────────────────────────────────────────────────

export interface ScheduledPost {
  id: string;
  clipId: string;
  clipTitle: string;
  clipVideoUrl: string;
  jobId: string;
  platform: "tiktok" | "instagram" | "youtube";
  ratio: "9:16" | "1:1" | "16:9";
  scheduledAt: number;
  caption: string;
  hashtags: string[];
  status: "pending" | "published" | "failed";
  createdAt: number;
}

// ─── Hooks A/B Testing ────────────────────────────────────────────────────────

export interface HookVariant {
  id: "A" | "B" | "C";
  hook: string;
  overlayText: string;
  style: string;
  emoji: string;
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface AnalyticsData {
  totalJobs: number;
  totalClips: number;
  avgScore: number;
  totalFillersRemoved: number;
  clipsByDay: Record<string, number>; // "2025-05-31" → count
  scoreDistribution: { range: string; count: number; color: string }[];
  topHashtags: { tag: string; count: number }[];
  formatDistribution: { ratio: string; count: number }[];
}
