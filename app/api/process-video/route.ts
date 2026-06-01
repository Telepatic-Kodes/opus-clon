import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { setJob } from "@/lib/jobs-store";
import { processVideo } from "@/lib/video-processor";
import type { Job, ProcessVideoRequest, ProcessVideoResponse } from "@/types";

function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("url" in body) ||
    typeof (body as Record<string, unknown>).url !== "string"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid `url` field" },
      { status: 400 }
    );
  }

  const {
    url: rawUrl,
    model,
    clipCount,
    minDuration,
    maxDuration,
    formats,
  } = body as ProcessVideoRequest;

  const url = rawUrl.trim();

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "The `url` field must be a valid HTTP/HTTPS URL" },
      { status: 400 }
    );
  }

  const jobId = uuidv4();

  const job: Job = {
    id: jobId,
    url,
    status: "queued",
    progress: 0,
    message: "Job queued",
    clips: [],
    createdAt: Date.now(),
  };

  setJob(job);

  // Fire and forget — do not await so the response is returned immediately.
  void processVideo(jobId, url, {
    model: model ?? "gpt-4o",
    clipCount: clipCount ?? 8,
    minDuration: minDuration ?? 15,
    maxDuration: maxDuration ?? 90,
    formats: formats ?? ["9:16", "1:1", "16:9"],
  });

  const response: ProcessVideoResponse = { jobId, status: "queued" };
  return NextResponse.json(response, { status: 202 });
}
