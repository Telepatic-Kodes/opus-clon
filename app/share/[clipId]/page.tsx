import type { Metadata } from "next";
import ShareClientPage from "./client-page";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClipMetadata {
  clip: {
    title: string;
    score: number;
    hook: string;
    thumbnailUrl: string;
    hashtags: string[];
  };
  jobId: string;
}

// ─── Server-side data fetching for metadata ────────────────────────────────────

async function getClipData(clipId: string): Promise<ClipMetadata | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3001";
    const res = await fetch(`${baseUrl}/api/share/${clipId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as ClipMetadata;
  } catch {
    return null;
  }
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clipId: string }>;
}): Promise<Metadata> {
  const { clipId } = await params;
  const data = await getClipData(clipId);

  if (!data) {
    return { title: "Clip — AIAIAI" };
  }

  const { clip } = data;
  const title = `${clip.title} — Score ${clip.score}/100 | AIAIAI`;
  const description = clip.hook
    ? `${clip.hook}. ${clip.hashtags.slice(0, 5).join(" ")}`
    : `Clip viral generado con IA. Score de viralidad: ${clip.score}/100. ${clip.hashtags.slice(0, 5).join(" ")}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      images: clip.thumbnailUrl
        ? [{ url: clip.thumbnailUrl, width: 1280, height: 720, alt: clip.title }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: clip.thumbnailUrl ? [clip.thumbnailUrl] : [],
    },
  };
}

// ─── Page (server component) ──────────────────────────────────────────────────

export default function SharePage({
  params,
}: {
  params: Promise<{ clipId: string }>;
}) {
  return <ShareClientPage params={params} />;
}
