"use client";

import { useState, useRef } from "react";
import { Play, Pause, Music2, Download } from "lucide-react";
import type { Clip } from "@/types";
import { CURATED_TRACKS, MUSIC_MOODS, type MusicTrack } from "@/lib/music-constants";

interface MusicPanelProps {
  clip: Clip;
  jobId: string;
}

interface MusicApiResponse {
  url?: string;
  error?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MusicPanel({ clip, jobId }: MusicPanelProps) {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [playingTrackId, setPlayingTrackId] = useState<number | null>(null);
  const [volume, setVolume] = useState(0.15);
  const [isMixing, setIsMixing] = useState(false);
  const [mixedUrl, setMixedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filteredTracks = selectedMood
    ? CURATED_TRACKS.filter((t) => t.mood === selectedMood)
    : CURATED_TRACKS;

  const handlePlayPause = (track: MusicTrack) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
      return;
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(track.url);
    audioRef.current = audio;

    audio.addEventListener("ended", () => setPlayingTrackId(null));
    audio.play().catch(() => setPlayingTrackId(null));
    setPlayingTrackId(track.id);
  };

  const handleApplyMusic = async () => {
    if (!selectedTrack) return;

    setIsMixing(true);
    setError(null);
    setMixedUrl(null);

    try {
      const res = await fetch("/api/music/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clipId: clip.id,
          jobId,
          musicUrl: selectedTrack.url,
          volume,
        }),
      });

      const data = (await res.json()) as MusicApiResponse;

      if (!res.ok || data.error) {
        setError(data.error ?? "Error al añadir música al clip.");
        return;
      }

      if (data.url) {
        setMixedUrl(data.url);
      }
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setIsMixing(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3
          className="text-sm font-semibold text-white tracking-widest uppercase"
          style={{ fontFamily: "DM Mono, monospace" }}
        >
          MÚSICA LIBRE DE COPYRIGHT
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-[#A8FF00]/10 border border-[#A8FF00]/30 text-[#A8FF00] text-xs font-semibold">
          CC0
        </span>
      </div>

      {/* Mood filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedMood(null)}
          className={[
            "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
            selectedMood === null
              ? "bg-[#A8FF00] border-[#A8FF00] text-[#0B0C10]"
              : "bg-[#12131A] border-[#1E2030] text-[#737373] hover:text-white hover:border-[#A8FF00]/40",
          ].join(" ")}
        >
          TODOS
        </button>
        {MUSIC_MOODS.map((mood) => (
          <button
            key={mood.id}
            onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
            className={[
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150",
              selectedMood === mood.id
                ? "bg-[#A8FF00] border-[#A8FF00] text-[#0B0C10]"
                : "bg-[#12131A] border-[#1E2030] text-[#737373] hover:text-white hover:border-[#A8FF00]/40",
            ].join(" ")}
          >
            <span>{mood.emoji}</span>
            <span>{mood.label}</span>
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="flex flex-col gap-2">
        {filteredTracks.map((track) => {
          const isSelected = selectedTrack?.id === track.id;
          const isPlaying = playingTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => setSelectedTrack(track)}
              className={[
                "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150",
                isSelected
                  ? "bg-[#A8FF00]/5 border-[#A8FF00]/40"
                  : "bg-[#12131A] border-[#1E2030] hover:border-[#A8FF00]/20 hover:bg-[#1a1b24]",
              ].join(" ")}
            >
              {/* Play/Pause button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayPause(track);
                }}
                className={[
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150",
                  isPlaying
                    ? "bg-[#A8FF00] text-[#0B0C10]"
                    : "bg-[#1E2030] text-[#737373] hover:text-white hover:bg-[#2a2b38]",
                ].join(" ")}
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? (
                  <Pause className="w-3.5 h-3.5" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
              </button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p
                  className={[
                    "text-sm font-medium truncate",
                    isSelected ? "text-white" : "text-[#a3a3a3]",
                  ].join(" ")}
                >
                  {track.title}
                </p>
                <p className="text-xs text-[#525252]">{track.tags}</p>
              </div>

              {/* Duration */}
              <span className="text-xs text-[#525252] flex-shrink-0 font-mono">
                {formatDuration(track.duration)}
              </span>

              {/* Selection indicator */}
              {isSelected && (
                <Music2 className="w-4 h-4 text-[#A8FF00] flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Volume slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs text-[#737373]" htmlFor="music-volume">
            Volumen de música
          </label>
          <span className="text-xs font-mono text-[#A8FF00]">
            {Math.round(volume * 100)}%
          </span>
        </div>
        <input
          id="music-volume"
          type="range"
          min={0.05}
          max={0.3}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #A8FF00 ${((volume - 0.05) / 0.25) * 100}%, #1E2030 ${((volume - 0.05) / 0.25) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-xs text-[#525252]">
          <span>5%</span>
          <span>30%</span>
        </div>
      </div>

      {/* Apply music button */}
      <button
        onClick={() => void handleApplyMusic()}
        disabled={isMixing || !selectedTrack}
        className={[
          "w-full py-3 rounded-xl text-sm font-semibold tracking-widest uppercase transition-all duration-200",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          isMixing
            ? "bg-[#A8FF00]/20 text-[#A8FF00] border border-[#A8FF00]/30"
            : !selectedTrack
            ? "bg-[#12131A] border border-[#1E2030] text-[#525252]"
            : "bg-[#A8FF00] text-[#0B0C10] hover:bg-[#c6ff4d]",
        ].join(" ")}
        style={{ fontFamily: "Unbounded, sans-serif" }}
      >
        {isMixing
          ? "PROCESANDO…"
          : !selectedTrack
          ? "SELECCIONA UNA PISTA"
          : "AÑADIR MÚSICA →"}
      </button>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Mixed video preview */}
      {mixedUrl && (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-[#525252] font-medium uppercase tracking-widest">
            Vista previa con música
          </p>
          <video
            src={mixedUrl}
            controls
            className="w-full rounded-xl border border-[#1E2030] bg-[#0B0C10]"
            style={{ maxHeight: "240px" }}
          />
          <a
            href={mixedUrl}
            download
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[#1E2030] bg-[#12131A] text-sm font-medium text-[#737373] hover:text-white hover:border-[#A8FF00]/40 transition-all duration-150"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            Descargar clip con música
          </a>
        </div>
      )}

      {/* Legal note */}
      <p className="text-xs text-[#525252] border-t border-[#1E2030] pt-4">
        Todas las pistas son CC0 - libres de copyright
      </p>
    </div>
  );
}
