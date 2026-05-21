export type JobStatus = "queued" | "downloading" | "transcribing" | "analyzing" | "cutting" | "done" | "error";

export interface ViralMoment {
  start: number;   // seconds
  end: number;     // seconds
  title: string;
  reason: string;
  score: number;   // 0-100 virality score
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
  videoUrl: string;    // relative public path e.g. /clips/<jobId>/<id>.mp4
  thumbnailUrl?: string;
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
}
