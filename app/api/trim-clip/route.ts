import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

import { getJob, updateJob } from "@/lib/jobs-store";
import {
  reframeClip,
  extractThumbnail,
  cutClip,
  findVideoFile,
  clipsDir,
  publicJobDir,
} from "@/lib/video-processor";
import type { Clip, ClipFormat } from "@/types";

// ---------------------------------------------------------------------------
// Request body shape
// ---------------------------------------------------------------------------

interface TrimClipBody {
  jobId: string;
  clipId: string;
  newStart: number;
  newEnd: number;
}

function isValidBody(body: unknown): body is TrimClipBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.jobId === "string" &&
    typeof b.clipId === "string" &&
    typeof b.newStart === "number" &&
    typeof b.newEnd === "number"
  );
}

// ---------------------------------------------------------------------------
// POST /api/trim-clip
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1. Parse body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      {
        error:
          "Body must contain: jobId (string), clipId (string), newStart (number), newEnd (number)",
      },
      { status: 400 }
    );
  }

  const { jobId, clipId, newStart, newEnd } = body;

  // 2. Validate duration constraints
  const newDuration = newEnd - newStart;
  if (newDuration < 5) {
    return NextResponse.json(
      { error: "Mínimo 5 segundos de duración" },
      { status: 422 }
    );
  }
  if (newDuration > 120) {
    return NextResponse.json(
      { error: "Máximo 120 segundos de duración" },
      { status: 422 }
    );
  }
  if (newStart < 0) {
    return NextResponse.json(
      { error: "newStart no puede ser negativo" },
      { status: 422 }
    );
  }

  // 3. Look up the job
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: `Job not found: ${jobId}` }, { status: 404 });
  }

  // 4. Find the clip
  const clipIndex = job.clips.findIndex((c) => c.id === clipId);
  if (clipIndex === -1) {
    return NextResponse.json(
      { error: `Clip not found: ${clipId}` },
      { status: 404 }
    );
  }

  const existingClip: Clip = job.clips[clipIndex];

  // 5. Locate the original source video (yt-dlp output)
  let sourceVideoPath: string;
  try {
    sourceVideoPath = findVideoFile(jobId);
  } catch {
    return NextResponse.json(
      {
        error:
          "Original source video not found. It may have been cleaned up by the server.",
      },
      { status: 409 }
    );
  }

  // 6. Prepare output directories
  const tmpClipsPath = clipsDir(jobId);
  const pubJobPath = publicJobDir(jobId);

  fs.mkdirSync(tmpClipsPath, { recursive: true });
  fs.mkdirSync(pubJobPath, { recursive: true });

  // 7. Cut a fresh base clip from the original video
  const baseTmpPath = path.join(tmpClipsPath, `${clipId}_base.mp4`);
  try {
    await cutClip(sourceVideoPath, newStart, newEnd, baseTmpPath);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `FFmpeg cut failed: ${msg}` },
      { status: 500 }
    );
  }

  // 8. Reframe to all 3 format variants (overwrite existing files)
  const formatDefs: Array<{
    ratio: "9:16" | "1:1" | "16:9";
    label: string;
    suffix: string;
  }> = [
    { ratio: "9:16", label: "TikTok / Reels", suffix: "9x16" },
    { ratio: "1:1", label: "Instagram", suffix: "1x1" },
    { ratio: "16:9", label: "YouTube / LinkedIn", suffix: "16x9" },
  ];

  const formats: ClipFormat[] = [];

  for (const def of formatDefs) {
    const tmpOut = path.join(tmpClipsPath, `${clipId}_${def.suffix}.mp4`);
    try {
      await reframeClip(baseTmpPath, tmpOut, def.ratio);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { error: `FFmpeg reframe (${def.ratio}) failed: ${msg}` },
        { status: 500 }
      );
    }

    const pubFileName = `${clipId}_${def.suffix}.mp4`;
    const pubOut = path.join(pubJobPath, pubFileName);
    fs.copyFileSync(tmpOut, pubOut);

    formats.push({
      ratio: def.ratio,
      label: def.label,
      videoUrl: `/clips/${jobId}/${pubFileName}`,
    });
  }

  // 9. Re-extract thumbnail from the new base clip
  let thumbnailUrl: string;
  try {
    thumbnailUrl = await extractThumbnail(baseTmpPath, clipId, jobId, newDuration);
  } catch {
    // Non-fatal — keep existing thumbnail if extraction fails
    thumbnailUrl = existingClip.thumbnailUrl;
  }

  // 10. Build the updated clip
  const defaultFormat = formats.find((f) => f.ratio === "16:9");
  const updatedClip: Clip = {
    ...existingClip,
    start: newStart,
    end: newEnd,
    duration: Math.round(newDuration * 10) / 10,
    videoUrl:
      defaultFormat?.videoUrl ?? `/clips/${jobId}/${clipId}_16x9.mp4`,
    thumbnailUrl,
    formats,
  };

  // 11. Persist to the job store
  const updatedClips = [...job.clips];
  updatedClips[clipIndex] = updatedClip;
  updateJob(jobId, { clips: updatedClips });

  return NextResponse.json({ clip: updatedClip });
}
