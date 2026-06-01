import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/jobs-store";
import type { Clip } from "@/types";

interface PatchClipBody {
  jobId: string;
  clipId: string;
  title?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: PatchClipBody;

  try {
    body = (await req.json()) as PatchClipBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { jobId, clipId, title } = body;

  if (!jobId || !clipId) {
    return NextResponse.json({ error: "jobId and clipId are required" }, { status: 400 });
  }

  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const clipIndex = job.clips.findIndex((c: Clip) => c.id === clipId);
  if (clipIndex === -1) {
    return NextResponse.json({ error: "Clip not found" }, { status: 404 });
  }

  const updatedClip: Clip = {
    ...job.clips[clipIndex],
    ...(title !== undefined ? { title: title.trim() } : {}),
  };

  const updatedClips = [...job.clips];
  updatedClips[clipIndex] = updatedClip;

  updateJob(jobId, { clips: updatedClips });

  return NextResponse.json({ clip: updatedClip });
}
