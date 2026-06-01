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
