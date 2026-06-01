import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

interface CaptionLine {
  time: string;
  text: string;
}

interface UpdateCaptionsBody {
  captionsUrl: string;
  lines: CaptionLine[];
}

function buildVtt(lines: CaptionLine[]): string {
  const blocks = lines.map((l, i) => `${i + 1}\n${l.time}\n${l.text}`);
  return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: UpdateCaptionsBody;

  try {
    body = (await req.json()) as UpdateCaptionsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { captionsUrl, lines } = body;

  if (
    typeof captionsUrl !== "string" ||
    !captionsUrl.startsWith("/clips/") ||
    !captionsUrl.endsWith(".vtt")
  ) {
    return NextResponse.json({ error: "Invalid captionsUrl" }, { status: 400 });
  }

  if (!Array.isArray(lines)) {
    return NextResponse.json({ error: "lines must be an array" }, { status: 400 });
  }

  // Resolve to public/ path — captionsUrl is like /clips/<jobId>/<clipId>.vtt
  const filePath = path.join(process.cwd(), "public", captionsUrl);

  // Security: ensure the resolved path stays inside public/clips/
  const publicClipsDir = path.join(process.cwd(), "public", "clips");
  if (!filePath.startsWith(publicClipsDir + path.sep)) {
    return NextResponse.json({ error: "Path traversal detected" }, { status: 400 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: "VTT file not found" }, { status: 404 });
  }

  const vttContent = buildVtt(lines);
  fs.writeFileSync(filePath, vttContent, "utf-8");

  return NextResponse.json({ ok: true });
}
