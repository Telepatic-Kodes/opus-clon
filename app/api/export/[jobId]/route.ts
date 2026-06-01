import { NextRequest, NextResponse } from "next/server";
import archiver from "archiver";
import { getJob } from "@/lib/jobs-store";
import path from "path";
import fs from "fs";
import { PassThrough } from "stream";
import type { Clip } from "@/types";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
): Promise<NextResponse> {
  const { jobId } = await params;

  const job = getJob(jobId);
  if (!job || job.status !== "done") {
    return NextResponse.json({ error: "Job not found or not complete" }, { status: 404 });
  }

  const archive = archiver("zip", { zlib: { level: 6 } });
  const passThrough = new PassThrough();
  archive.pipe(passThrough);

  // Base directory where clips are stored
  const clipsBaseDir = path.join(process.cwd(), "public", "clips", jobId);

  for (const clip of job.clips) {
    const titleSanitized = clip.title
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()
      .slice(0, 60);

    const folderName = `clips/${titleSanitized}/`;

    const formatFiles: { filename: string; suffix: string }[] = [
      { filename: `${clip.id}_9x16.mp4`, suffix: "9x16" },
      { filename: `${clip.id}_1x1.mp4`, suffix: "1x1" },
      { filename: `${clip.id}_16x9.mp4`, suffix: "16x9" },
    ];

    for (const { filename } of formatFiles) {
      const filePath = path.join(clipsBaseDir, filename);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: `${folderName}${filename}` });
      }
    }

    // Add VTT captions if they exist
    if (clip.captionsUrl) {
      // captionsUrl is like /clips/<jobId>/<id>.vtt — resolve to disk path
      const vttFilename = `${clip.id}.vtt`;
      const vttPath = path.join(clipsBaseDir, vttFilename);
      if (fs.existsSync(vttPath)) {
        archive.file(vttPath, { name: `${folderName}${vttFilename}` });
      }
    }
  }

  // Build README.txt content
  const readmeLines: string[] = [
    "OPUS CLIP EXPORT",
    "================",
    "",
  ];

  for (const clip of job.clips as Clip[]) {
    readmeLines.push(`--- ${clip.title} ---`);
    readmeLines.push(`Score de viralidad: ${clip.score}/100`);
    readmeLines.push(`Hook: ${clip.hook}`);
    readmeLines.push(`Hashtags: ${clip.hashtags.join(" ")}`);
    readmeLines.push(`Transcript: ${clip.transcript}`);
    readmeLines.push("");
  }

  const readmeContent = readmeLines.join("\n");
  archive.append(readmeContent, { name: "README.txt" });

  archive.finalize().catch(() => {
    // Finalization errors are surfaced through the stream
  });

  const readable = new ReadableStream<Uint8Array>({
    start(controller) {
      passThrough.on("data", (chunk: Buffer) => {
        controller.enqueue(new Uint8Array(chunk));
      });
      passThrough.on("end", () => controller.close());
      passThrough.on("error", (err: Error) => controller.error(err));
    },
  });

  return new NextResponse(readable, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="opus_${jobId.slice(0, 8)}.zip"`,
    },
  });
}
