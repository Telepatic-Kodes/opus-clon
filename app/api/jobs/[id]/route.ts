import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobs-store";
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
    ...(job.error !== undefined ? { error: job.error } : {}),
  };

  return NextResponse.json(response);
}
