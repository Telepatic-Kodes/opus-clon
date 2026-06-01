import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs-store";
import path from "path";
import fs from "fs";

interface MusicApplyBody {
  clipId: string;
  jobId: string;
  musicUrl: string;
  volume?: number;
}

interface MusicApplyResponse {
  url?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<MusicApplyResponse>> {
  const { clipId, jobId, musicUrl, volume } = (await req.json()) as MusicApplyBody;

  if (!clipId || !jobId || !musicUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const clip = job.clips.find((c) => c.id === clipId);
  if (!clip) {
    return NextResponse.json({ error: "Clip not found" }, { status: 404 });
  }

  const clipVideoPath = path.join(process.cwd(), "public", clip.videoUrl);
  const outputDir = path.join(process.cwd(), "public", "clips", jobId);
  const outputPath = path.join(outputDir, `${clipId}_music.mp4`);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    const { mixMusicWithClip } = await import("@/lib/music");
    await mixMusicWithClip(clipVideoPath, musicUrl, outputPath, volume ?? 0.15);

    return NextResponse.json({ url: `/clips/${jobId}/${clipId}_music.mp4` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to mix music: ${message}` }, { status: 500 });
  }
}
