import { NextRequest, NextResponse } from "next/server";
import {
  getBrandKits,
  saveBrandKit,
  deleteBrandKit,
  applyBrandKitToClip,
  type BrandKit,
} from "@/lib/brand-kit";
import { getJob } from "@/lib/jobs-store";
import path from "path";

// ── GET /api/brand ──────────────────────────────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const kits = getBrandKits();
  return NextResponse.json(kits);
}

// ── POST /api/brand ─────────────────────────────────────────────────────────

interface CreateBrandKitBody {
  name: string;
  primaryColor: string;
  textColor: string;
  watermarkText: string;
  watermarkPosition: BrandKit["watermarkPosition"];
  watermarkSize: number;
  introText?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: CreateBrandKitBody;
  try {
    body = (await req.json()) as CreateBrandKitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const validPositions: BrandKit["watermarkPosition"][] = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
  ];
  if (body.watermarkPosition && !validPositions.includes(body.watermarkPosition)) {
    return NextResponse.json({ error: "Invalid watermarkPosition" }, { status: 400 });
  }

  const kit = saveBrandKit({
    name: body.name.trim(),
    primaryColor: body.primaryColor ?? "#A8FF00",
    textColor: body.textColor ?? "#FFFFFF",
    watermarkText: body.watermarkText ?? "",
    watermarkPosition: body.watermarkPosition ?? "bottom-right",
    watermarkSize: Math.min(36, Math.max(12, body.watermarkSize ?? 18)),
    introText: body.introText ?? "",
  });

  return NextResponse.json(kit, { status: 201 });
}

// ── DELETE /api/brand?id=xxx ────────────────────────────────────────────────

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id query param required" }, { status: 400 });
  }
  deleteBrandKit(id);
  return NextResponse.json({ success: true });
}

// ── PATCH /api/brand ─────────────────────────────────────────────────────────
// Body: { id: string; clipId: string; jobId: string }
// Applies the brand kit watermark to the clip's video file.

interface ApplyBrandKitBody {
  id: string;
  clipId: string;
  jobId: string;
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  let body: ApplyBrandKitBody;
  try {
    body = (await req.json()) as ApplyBrandKitBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id, clipId, jobId } = body;
  if (!id || !clipId || !jobId) {
    return NextResponse.json(
      { error: "id, clipId, and jobId are required" },
      { status: 400 }
    );
  }

  // Find the kit
  const kits = getBrandKits();
  const kit = kits.find((k) => k.id === id);
  if (!kit) {
    return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
  }

  // Find the job and clip
  const job = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const clip = job.clips.find((c) => c.id === clipId);
  if (!clip) {
    return NextResponse.json({ error: "Clip not found in job" }, { status: 404 });
  }

  // Derive filesystem paths
  // clip.videoUrl is typically /clips/<jobId>/<clipId>.mp4
  const clipsDir = path.join(process.cwd(), "public");
  const relativePath = clip.videoUrl.startsWith("/") ? clip.videoUrl.slice(1) : clip.videoUrl;
  const inputPath = path.join(clipsDir, relativePath);
  const outputRelative = relativePath.replace(/\.mp4$/, `_branded.mp4`);
  const outputPath = path.join(clipsDir, outputRelative);

  try {
    await applyBrandKitToClip(inputPath, outputPath, kit);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `FFmpeg failed: ${message}` }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    outputUrl: `/${outputRelative}`,
  });
}
