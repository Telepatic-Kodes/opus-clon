"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import type { Clip } from "@/types";
import { SUPPORTED_LANGUAGES } from "@/lib/dubbing-constants";

interface DubbingPanelProps {
  clip: Clip;
  jobId: string;
}

interface DubApiResponse {
  url?: string;
  error?: string;
  demo?: boolean;
}

export default function DubbingPanel({ clip, jobId }: DubbingPanelProps) {
  const [selectedLang, setSelectedLang] = useState("en");
  const [isDubbing, setIsDubbing] = useState(false);
  const [dubbedUrl, setDubbedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const handleDub = async () => {
    setIsDubbing(true);
    setError(null);
    setIsDemo(false);
    setDubbedUrl(null);

    try {
      const res = await fetch(`/api/dub/${clip.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, targetLanguage: selectedLang }),
      });

      const data = (await res.json()) as DubApiResponse;

      if (data.demo) {
        setIsDemo(true);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error ?? "Error desconocido al doblar el clip.");
        return;
      }

      if (data.url) {
        setDubbedUrl(data.url);
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsDubbing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <h3
          className="text-sm font-semibold text-white tracking-widest uppercase"
          style={{ fontFamily: "DM Mono, monospace" }}
        >
          DOBLAJE CON IA
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-[#A8FF00]/10 border border-[#A8FF00]/30 text-[#A8FF00] text-xs font-semibold">
          ElevenLabs
        </span>
      </div>

      {/* Language grid */}
      <div className="grid grid-cols-3 gap-2">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const isActive = selectedLang === lang.code;
          return (
            <button
              key={lang.code}
              onClick={() => setSelectedLang(lang.code)}
              className={[
                "flex flex-col items-center gap-1 py-3 px-2 rounded-xl border text-xs font-semibold transition-all duration-150",
                isActive
                  ? "bg-[#A8FF00] border-[#A8FF00] text-[#0B0C10]"
                  : "bg-[#12131A] border-[#1E2030] text-[#737373] hover:border-[#A8FF00]/40 hover:text-white",
              ].join(" ")}
            >
              <span className="text-lg leading-none">{lang.flag}</span>
              <span className="tracking-wider">{lang.code.toUpperCase()}</span>
            </button>
          );
        })}
      </div>

      {/* Selected language label */}
      <p className="text-xs text-[#525252]">
        Idioma seleccionado:{" "}
        <span className="text-white font-medium">
          {SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang)?.label ?? selectedLang}
        </span>
      </p>

      {/* CTA button */}
      <button
        onClick={() => void handleDub()}
        disabled={isDubbing}
        className={[
          "w-full py-3 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isDubbing
            ? "bg-[#A8FF00]/20 text-[#A8FF00] border border-[#A8FF00]/30"
            : "bg-[#A8FF00] text-[#0B0C10] hover:bg-[#c6ff4d]",
        ].join(" ")}
        style={{ fontFamily: "Unbounded, sans-serif" }}
      >
        {isDubbing ? "DOBLANDO…" : "DOBLAR CLIP →"}
      </button>

      {/* Demo banner */}
      {isDemo && (
        <div className="rounded-xl border border-[#A8FF00]/30 bg-[#A8FF00]/5 p-4">
          <p className="text-sm text-[#A8FF00] font-medium mb-1">Función no configurada</p>
          <p className="text-xs text-[#737373]">
            Añade{" "}
            <code className="bg-[#12131A] border border-[#1E2030] px-1.5 py-0.5 rounded text-[#A8FF00] font-mono text-xs">
              ELEVENLABS_API_KEY
            </code>{" "}
            en{" "}
            <code className="bg-[#12131A] border border-[#1E2030] px-1.5 py-0.5 rounded text-white font-mono text-xs">
              .env.local
            </code>{" "}
            para activar esta función.
          </p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Dubbed video result */}
      {dubbedUrl && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#525252] font-medium uppercase tracking-widest">
            Vista previa doblada
          </p>
          <video
            src={dubbedUrl}
            controls
            className="w-full rounded-xl border border-[#1E2030] bg-[#0B0C10]"
            style={{ maxHeight: "240px" }}
          />
          <a
            href={dubbedUrl}
            download
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#1E2030] bg-[#12131A] text-sm font-medium text-[#737373] hover:text-white hover:border-[#A8FF00]/40 transition-all duration-150"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            Descargar clip doblado
          </a>
        </div>
      )}

      {/* Legal note */}
      <p className="text-xs text-[#525252] border-t border-[#1E2030] pt-4">
        🔒 Voz generada con IA. Revisa las políticas de las plataformas antes de publicar.
      </p>
    </div>
  );
}
