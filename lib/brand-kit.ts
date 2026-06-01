import db from "@/lib/db";

export interface BrandKit {
  id: string;
  name: string;
  primaryColor: string;    // hex
  textColor: string;       // hex
  watermarkText: string;   // e.g. "@usuario"
  watermarkPosition: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  watermarkSize: number;   // font size 12-36
  introText?: string;      // overlay text at clip start
  createdAt: number;
}

// Initialize brand_kits table
db.exec(`
  CREATE TABLE IF NOT EXISTS brand_kits (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    primary_color TEXT DEFAULT '#A8FF00',
    text_color TEXT DEFAULT '#FFFFFF',
    watermark_text TEXT DEFAULT '',
    watermark_position TEXT DEFAULT 'bottom-right',
    watermark_size INTEGER DEFAULT 18,
    intro_text TEXT DEFAULT '',
    created_at INTEGER NOT NULL
  )
`);

export function getBrandKits(): BrandKit[] {
  const rows = db.prepare("SELECT * FROM brand_kits ORDER BY created_at DESC").all() as Record<string, unknown>[];
  return rows.map(rowToKit);
}

export function saveBrandKit(kit: Omit<BrandKit, "id" | "createdAt">): BrandKit {
  const { v4: uuidv4 } = require("uuid") as { v4: () => string };
  const id = uuidv4();
  const createdAt = Date.now();
  db.prepare(`
    INSERT INTO brand_kits (id, name, primary_color, text_color, watermark_text, watermark_position, watermark_size, intro_text, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, kit.name, kit.primaryColor, kit.textColor, kit.watermarkText, kit.watermarkPosition, kit.watermarkSize, kit.introText ?? "", createdAt);
  return { ...kit, id, createdAt };
}

export function deleteBrandKit(id: string): void {
  db.prepare("DELETE FROM brand_kits WHERE id = ?").run(id);
}

function rowToKit(row: Record<string, unknown>): BrandKit {
  return {
    id: row.id as string,
    name: row.name as string,
    primaryColor: row.primary_color as string,
    textColor: row.text_color as string,
    watermarkText: row.watermark_text as string,
    watermarkPosition: row.watermark_position as BrandKit["watermarkPosition"],
    watermarkSize: row.watermark_size as number,
    introText: row.intro_text as string,
    createdAt: row.created_at as number,
  };
}

export async function applyBrandKitToClip(
  inputPath: string,
  outputPath: string,
  kit: BrandKit
): Promise<void> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  const FFMPEG = process.env.FFMPEG_PATH ?? "/opt/homebrew/bin/ffmpeg";

  if (!kit.watermarkText) {
    // No watermark, just copy
    await execAsync(`"${FFMPEG}" -i "${inputPath}" -c copy "${outputPath}" -y`);
    return;
  }

  // Build FFmpeg drawtext filter for watermark
  const positions: Record<string, string> = {
    "top-left": "x=20:y=20",
    "top-right": "x=w-tw-20:y=20",
    "bottom-left": "x=20:y=h-th-20",
    "bottom-right": "x=w-tw-20:y=h-th-20",
  };

  const pos = positions[kit.watermarkPosition] ?? positions["bottom-right"];
  const colorHex = kit.textColor.replace("#", "");

  const filter = `drawtext=text='${kit.watermarkText.replace(/'/g, "\\'")}':fontsize=${kit.watermarkSize}:fontcolor=${colorHex}@0.8:${pos}:box=1:boxcolor=000000@0.3:boxborderw=5`;

  await execAsync(
    `"${FFMPEG}" -i "${inputPath}" -vf "${filter}" -c:a copy "${outputPath}" -y`
  );
}
