import { NextRequest, NextResponse } from "next/server";
import { getAllJobs } from "@/lib/jobs-store";
import type { Clip } from "@/types";

interface ShareResponse {
  clip: Clip;
  jobId: string;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ clipId: string }> }
): Promise<NextResponse> {
  const { clipId } = await params;
  const jobs = getAllJobs();

  for (const job of jobs) {
    const clip = job.clips.find((c) => c.id === clipId);
    if (clip) {
      const body: ShareResponse = { clip, jobId: job.id };
      return NextResponse.json(body);
    }
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
