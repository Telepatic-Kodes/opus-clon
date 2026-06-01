"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import { Download, Loader2, AlertTriangle, Link2, Check } from "lucide-react";
import type { Clip, ClipFormat } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShareData {
  clip: Clip;
  jobId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FORMAT_BUTTONS: { ratio: ClipFormat["ratio"]; label: string }[] = [
  { ratio: "9:16", label: "TikTok" },
  { ratio: "1:1",  label: "Instagram" },
  { ratio: "16:9", label: "YouTube" },
];

function ScoreBadge({ score, emotionScore }: { score: number; emotionScore: number }) {
  let colorClass = "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (score >= 80) colorClass = "bg-green-500/20 text-green-400 border-green-500/30";
  else if (score >= 60) colorClass = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";

  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold ${colorClass}`}
      >
        🔥 Score {score}
      </span>
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium bg-orange-500/10 text-orange-300 border-orange-500/20">
        ⚡ Energía {emotionScore}
      </span>
    </div>
  );
}

// ─── Share Buttons ────────────────────────────────────────────────────────────

function ShareButtons({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent("Mira este clip viral 🎬");

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Copy link button */}
      <button
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full
                   bg-[#111] border border-[#262626] hover:border-violet-500/40
                   text-sm font-medium transition-all duration-200
                   hover:text-violet-300 text-[#a3a3a3]"
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-400" />
        ) : (
          <Link2 className="w-4 h-4" />
        )}
        {copied ? "✓ Copiado" : "🔗 Copiar link"}
      </button>

      {/* Social share row */}
      <div className="flex items-center gap-2 w-full">
        <span className="text-xs text-[#525252] whitespace-nowrap">Compartir en:</span>

        {/* Twitter / X */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                     bg-[#111] border border-[#262626] hover:border-[#444]
                     text-xs font-medium text-[#a3a3a3] hover:text-white
                     transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
          X
        </a>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${encodedText}+${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                     bg-[#111] border border-[#262626] hover:border-[#444]
                     text-xs font-medium text-[#a3a3a3] hover:text-white
                     transition-all duration-200"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp
        </a>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShareClientPage({
  params,
}: {
  params: Promise<{ clipId: string }>;
}) {
  const { clipId } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeRatio, setActiveRatio] = useState<ClipFormat["ratio"]>("9:16");
  const [isDownloading, setIsDownloading] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/share/${clipId}`, { cache: "no-store" });
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ShareData;
        setData(json);
        // Default to first available format
        if (json.clip.formats.length > 0) {
          setActiveRatio(json.clip.formats[0].ratio);
        }
      } catch (err) {
        console.error("Failed to load shared clip:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [clipId]);

  const activeFormat = data?.clip.formats.find((f) => f.ratio === activeRatio);
  const videoUrl = activeFormat?.videoUrl ?? data?.clip.videoUrl ?? "";

  const handleDownload = async () => {
    if (!data || !videoUrl) return;
    setIsDownloading(true);
    const baseName = data.clip.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const suffix = activeRatio.replace(":", "x");
    const filename = `${baseName}_${suffix}.mp4`;
    try {
      const response = await fetch(videoUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          <p className="text-sm text-[#737373]">Cargando clip…</p>
        </div>
      </div>
    );
  }

  // ── Not found ──
  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-5">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Clip no encontrado</h2>
        <p className="text-sm text-[#737373] mb-6">
          Este clip no existe o fue eliminado.
        </p>
        <Link
          href="/"
          className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-violet-600 hover:bg-violet-500 transition-colors"
        >
          Ir a OpusClip
        </Link>
      </div>
    );
  }

  const { clip } = data;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* ── Top bar ── */}
      <header className="fixed top-0 left-0 right-0 z-30 px-5 py-4 flex items-center">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-white/80 hover:text-white transition-colors"
        >
          {/* Logo */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-violet-400 flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight text-white">OpusClip</span>
            <span className="text-[10px] text-violet-400/80 font-normal">IA que crea clips virales</span>
          </div>
        </Link>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <div className="w-full max-w-lg flex flex-col items-center gap-6">

          {/* Video player */}
          <div className="w-full aspect-video bg-[#0a0a0a] rounded-2xl overflow-hidden border border-[#1f1f1f] shadow-2xl shadow-violet-500/10">
            <video
              key={videoUrl}
              ref={videoRef}
              src={videoUrl}
              poster={clip.thumbnailUrl}
              controls
              playsInline
              className="w-full h-full object-contain"
              aria-label={`Video clip: ${clip.title}`}
            >
              {clip.captionsUrl && (
                <track
                  kind="subtitles"
                  src={clip.captionsUrl}
                  srcLang="es"
                  label="Español"
                  default
                />
              )}
            </video>
          </div>

          {/* Clip info */}
          <div className="w-full flex flex-col items-center gap-3 text-center">
            <h1 className="text-2xl font-bold text-white leading-tight">{clip.title}</h1>
            <ScoreBadge score={clip.score} emotionScore={clip.emotionScore} />
            {clip.hook && (
              <p className="text-sm italic text-[#a3a3a3]">"{clip.hook}"</p>
            )}
          </div>

          {/* Format selector */}
          <div className="flex items-center gap-2">
            {FORMAT_BUTTONS.map(({ ratio, label }) => {
              const exists = clip.formats.some((f) => f.ratio === ratio);
              if (!exists) return null;
              const isActive = activeRatio === ratio;
              return (
                <button
                  key={ratio}
                  onClick={() => setActiveRatio(ratio)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-150
                    ${isActive
                      ? "bg-violet-500/20 border-violet-500/50 text-violet-300"
                      : "bg-[#111] border-[#262626] text-[#737373] hover:text-white hover:border-[#444]"
                    }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={() => void handleDownload()}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                         bg-violet-600 hover:bg-violet-500 disabled:bg-violet-600/50
                         text-white text-sm font-semibold transition-all duration-200
                         shadow-md shadow-violet-500/20 hover:shadow-violet-500/40
                         disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              {isDownloading ? "Descargando…" : "Descargar"}
            </button>

            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                         bg-[#111] border border-[#262626] hover:border-violet-500/40
                         text-white text-sm font-semibold transition-all duration-200
                         hover:text-violet-300"
            >
              Crear mis propios clips →
            </Link>
          </div>

          {/* Share buttons */}
          {shareUrl && <ShareButtons shareUrl={shareUrl} />}

          {/* Hashtags */}
          {clip.hashtags.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2">
              {clip.hashtags.map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-full border border-[#2a2a2a] bg-[#111] text-xs text-[#737373]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="text-center py-6 text-xs text-[#525252]">
        Generado con OpusClip · IA de video
      </footer>
    </div>
  );
}
