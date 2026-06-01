import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs-store";

// ---------------------------------------------------------------------------
// Response shape
// ---------------------------------------------------------------------------

interface ContextWindowResponse {
  clipStart: number;
  clipEnd: number;
  contextBefore: { start: number; end: number };
  contextAfter: { start: number; end: number };
  transcriptWindow: string;
}

// ---------------------------------------------------------------------------
// GET /api/context-window/[clipId]?jobId=xxx
// ---------------------------------------------------------------------------

const CONTEXT_SECONDS = 10;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
): Promise<NextResponse> {
  const { clipId } = await params;
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");

  if (!jobId) {
    return NextResponse.json({ error: "Missing required query param: jobId" }, { status: 400 });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: `Job not found: ${jobId}` }, { status: 404 });
  }

  const clip = job.clips.find((c) => c.id === clipId);
  if (!clip) {
    return NextResponse.json({ error: `Clip not found: ${clipId}` }, { status: 404 });
  }

  // Calculate context window (10s before/after, clamped to 0)
  const contextBeforeStart = Math.max(0, clip.start - CONTEXT_SECONDS);
  const contextBeforeEnd = clip.start;

  const contextAfterStart = clip.end;
  // Use a reasonable upper bound; we don't track total video duration so
  // we just add the constant — the video player will stop at its end naturally.
  const contextAfterEnd = clip.end + CONTEXT_SECONDS;

  // Build a transcript window by combining nearby clip transcripts
  // sorted by start time so they form a coherent reading order.
  const windowStart = contextBeforeStart;
  const windowEnd = contextAfterEnd;

  const nearbyClips = job.clips
    .filter((c) => c.end >= windowStart && c.start <= windowEnd)
    .sort((a, b) => a.start - b.start);

  const transcriptWindow = nearbyClips.map((c) => c.transcript).filter(Boolean).join(" ").trim();

  const response: ContextWindowResponse = {
    clipStart: clip.start,
    clipEnd: clip.end,
    contextBefore: { start: contextBeforeStart, end: contextBeforeEnd },
    contextAfter: { start: contextAfterStart, end: contextAfterEnd },
    transcriptWindow,
  };

  return NextResponse.json(response);
}
