import { NextResponse } from "next/server";
import { getAllJobs } from "@/lib/jobs-store";
import type { JobStatus } from "@/types";

export interface JobSummary {
  id: string;
  url: string;
  status: JobStatus;
  progress: number;
  message: string;
  createdAt: number;
  clipCount: number;
  avgScore: number;
  topScore: number;
  thumbnails: string[];
  firstClipId?: string;
  firstClipTitle?: string;
  error?: string;
}

export async function GET(): Promise<NextResponse> {
  const jobs = getAllJobs(); // returns Job[] from SQLite, latest first

  const summary: JobSummary[] = jobs.map((job) => ({
    id: job.id,
    url: job.url,
    status: job.status,
    progress: job.progress,
    message: job.message,
    createdAt: job.createdAt,
    clipCount: job.clips.length,
    avgScore:
      job.clips.length > 0
        ? Math.round(
            job.clips.reduce((s, c) => s + c.score, 0) / job.clips.length
          )
        : 0,
    topScore:
      job.clips.length > 0 ? Math.max(...job.clips.map((c) => c.score)) : 0,
    thumbnails: job.clips
      .slice(0, 3)
      .map((c) => c.thumbnailUrl)
      .filter(Boolean),
    ...(job.clips.length > 0
      ? { firstClipId: job.clips[0].id, firstClipTitle: job.clips[0].title }
      : {}),
    ...(job.error !== undefined ? { error: job.error } : {}),
  }));

  return NextResponse.json(summary);
}
