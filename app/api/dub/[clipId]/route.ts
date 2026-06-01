import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs-store";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const FFMPEG = process.env.FFMPEG_PATH ?? "/opt/homebrew/bin/ffmpeg";

interface DubRequestBody {
  jobId: string;
  targetLanguage: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
): Promise<NextResponse> {
  const { clipId } = await params;
  const { jobId, targetLanguage } = (await req.json()) as DubRequestBody;

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ELEVENLABS_API_KEY not configured", demo: true },
      { status: 503 }
    );
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
  const audioPath = `/tmp/aiaiai_dub_${clipId}.mp3`;
  const dubbedAudioPath = `/tmp/aiaiai_dub_${clipId}_${targetLanguage}.mp3`;
  const outputDir = path.join(process.cwd(), "public", "clips", jobId);
  const outputPath = path.join(outputDir, `${clipId}_dubbed_${targetLanguage}.mp4`);

  // Ensure output directory exists
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Extract audio from the 16:9 clip
    await execAsync(
      `"${FFMPEG}" -i "${clipVideoPath}" -vn -acodec libmp3lame "${audioPath}" -y`
    );

    // Dub with ElevenLabs
    const { dubClipAudio } = await import("@/lib/dubbing");
    const dubbedBuffer = await dubClipAudio(audioPath, targetLanguage, apiKey);
    fs.writeFileSync(dubbedAudioPath, dubbedBuffer);

    // Mix dubbed audio with video
    await execAsync(
      `"${FFMPEG}" -i "${clipVideoPath}" -i "${dubbedAudioPath}" -c:v copy -map 0:v:0 -map 1:a:0 -shortest "${outputPath}" -y`
    );

    return NextResponse.json({
      url: `/clips/${jobId}/${clipId}_dubbed_${targetLanguage}.mp4`,
    });
  } finally {
    // Cleanup temp files
    [audioPath, dubbedAudioPath].forEach((f) => {
      try {
        fs.unlinkSync(f);
      } catch {
        // ignore cleanup errors
      }
    });
  }
}
