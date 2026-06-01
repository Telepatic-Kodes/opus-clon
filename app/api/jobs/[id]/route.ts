import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getJob, deleteJob } from "@/lib/jobs-store";
import type { JobStatusResponse } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const job = getJob(id);

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const response: JobStatusResponse = {
    id: job.id,
    status: job.status,
    progress: job.progress,
    message: job.message,
    clips: job.clips,
    createdAt: job.createdAt,
    url: job.url,
    ...(job.error !== undefined ? { error: job.error } : {}),
  };

  return NextResponse.json(response);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await params;

  const job = getJob(id);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Delete DB record
  deleteJob(id);

  // Delete clip files from public/clips/:id/
  const clipsDir = path.join(process.cwd(), "public", "clips", id);
  try {
    await fs.rm(clipsDir, { recursive: true, force: true });
  } catch {
    // Directory may not exist — not a fatal error
  }

  return NextResponse.json({ ok: true });
}
