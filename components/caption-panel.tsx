"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Clip } from "@/types";

interface CaptionPanelProps {
  clip: Clip;
}

// ── VTT helpers ────────────────────────────────────────────────────────────────

interface ParsedLine {
  id: string;
  time: string;
  text: string;
}

function parseVtt(text: string): ParsedLine[] {
  const blocks = text.split("\n\n").filter((b) => b.trim() && !b.startsWith("WEBVTT"));
  return blocks
    .map((block, i) => {
      const lines = block.trim().split("\n");
      const timeLine = lines.find((l) => l.includes("-->")) ?? "";
      const textLines = lines.filter(
        (l) => !l.includes("-->") && !/^\d+$/.test(l.trim())
      );
      return { id: String(i), time: timeLine, text: textLines.join(" ") };
    })
    .filter((b) => b.time);
}

function buildVtt(lines: ParsedLine[]): string {
  const blocks = lines.map((l, i) => `${i + 1}\n${l.time}\n${l.text}`);
  return `WEBVTT\n\n${blocks.join("\n\n")}\n`;
}

function vttToSrt(vttText: string): string {
  return vttText
    .replace("WEBVTT\n\n", "")
    .replace(/(\d{2}:\d{2}:\d{2})\.(\d{3})/g, "$1,$2");
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function CharBadge({ count }: { count: number }) {
  let colorClass = "bg-green-500/10 text-green-400 border-green-500/30";
  if (count > 280) colorClass = "bg-red-500/10 text-red-400 border-red-500/30";
  else if (count > 150)
    colorClass = "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border text-xs font-semibold ${colorClass}`}
    >
      {count} chars
    </span>
  );
}

function ProgressBar({
  value,
  color,
}: {
  value: number;
  color: "violet" | "cyan";
}) {
  const barClass =
    color === "violet"
      ? "bg-violet-500"
      : "bg-gradient-to-r from-blue-500 to-cyan-400";

  return (
    <div className="w-full h-2 rounded-full bg-[#1a1a1a] overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${barClass}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────────

const NOTE_MAX_CHARS = 1000;

// ── Main component ─────────────────────────────────────────────────────────────

export default function CaptionPanel({ clip }: CaptionPanelProps) {
  const caption = `${clip.title}\n\n${clip.hashtags.join(" ")}`;
  const [copied, setCopied] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // ── Personal notes (persisted in localStorage) ──────────────────────────────
  const noteKey = `opus_clip_note_${clip.id}`;
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem(noteKey);
    if (saved !== null) setNote(saved);
  }, [noteKey]);

  const handleNoteChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value.slice(0, NOTE_MAX_CHARS);
      setNote(value);
      localStorage.setItem(noteKey, value);
    },
    [noteKey]
  );

  // ── Caption copy ─────────────────────────────────────────────────────────────
  const handleCopyCaption = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API not available
    }
  }, [caption]);

  const handleCopyTag = useCallback(async (tag: string) => {
    try {
      await navigator.clipboard.writeText(tag);
      setActiveTag(tag);
      setTimeout(() => setActiveTag(null), 500);
    } catch {
      // Clipboard API not available
    }
  }, []);

  // ── Subtitle editor state ────────────────────────────────────────────────────
  const [editorOpen, setEditorOpen] = useState(false);
  const [vttContent, setVttContent] = useState<string>("");
  const [parsedLines, setParsedLines] = useState<ParsedLine[]>([]);
  const [originalLines, setOriginalLines] = useState<ParsedLine[]>([]);
  const [loadingVtt, setLoadingVtt] = useState(false);
  const [savingVtt, setSavingVtt] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const editorFetchedRef = useRef(false);

  // Fetch VTT when editor is first opened
  useEffect(() => {
    if (!editorOpen || editorFetchedRef.current || !clip.captionsUrl) return;
    editorFetchedRef.current = true;

    setLoadingVtt(true);
    fetch(clip.captionsUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch VTT");
        return res.text();
      })
      .then((text) => {
        setVttContent(text);
        const lines = parseVtt(text);
        setParsedLines(lines);
        setOriginalLines(lines.map((l) => ({ ...l })));
      })
      .catch(() => {
        // VTT fetch failed — editor stays empty
      })
      .finally(() => setLoadingVtt(false));
  }, [editorOpen, clip.captionsUrl]);

  // Feature 4: Live preview — update the video's TextTrack cues while editing
  const updateLivePreview = useCallback(
    (editedLine: ParsedLine) => {
      if (typeof document === "undefined") return;
      const vid = document.querySelector<HTMLVideoElement>(
        `video[data-clip-id="${clip.id}"]`
      );
      if (!vid?.textTracks[0]) return;
      const cues = Array.from(vid.textTracks[0].cues ?? []) as VTTCue[];
      const cue = cues[parseInt(editedLine.id, 10)];
      if (cue) cue.text = editedLine.text;
    },
    [clip.id]
  );

  const handleLineChange = useCallback(
    (id: string, newText: string) => {
      setParsedLines((prev) => {
        const updated = prev.map((l) =>
          l.id === id ? { ...l, text: newText } : l
        );
        const editedLine = updated.find((l) => l.id === id);
        if (editedLine) updateLivePreview(editedLine);
        return updated;
      });
      setSaveStatus("idle");
    },
    [updateLivePreview]
  );

  const handleSave = useCallback(async () => {
    if (!clip.captionsUrl) return;
    setSavingVtt(true);
    setSaveStatus("idle");
    try {
      const res = await fetch("/api/captions/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captionsUrl: clip.captionsUrl,
          lines: parsedLines.map(({ time, text }) => ({ time, text })),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      // Update internal vttContent so downloads reflect saved state
      setVttContent(buildVtt(parsedLines));
      setOriginalLines(parsedLines.map((l) => ({ ...l })));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2500);
    } catch {
      setSaveStatus("error");
    } finally {
      setSavingVtt(false);
    }
  }, [clip.captionsUrl, parsedLines]);

  const handleRestore = useCallback(() => {
    setParsedLines(originalLines.map((l) => ({ ...l })));
    setSaveStatus("idle");
    // Restore live preview for all cues
    if (typeof document === "undefined") return;
    const vid = document.querySelector<HTMLVideoElement>(
      `video[data-clip-id="${clip.id}"]`
    );
    if (!vid?.textTracks[0]) return;
    const cues = Array.from(vid.textTracks[0].cues ?? []) as VTTCue[];
    originalLines.forEach((line, i) => {
      const cue = cues[i];
      if (cue) cue.text = line.text;
    });
  }, [originalLines, clip.id]);

  // ── Export helpers ───────────────────────────────────────────────────────────

  const downloadBlob = useCallback(
    (content: string, filename: string, mimeType: string) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
    []
  );

  const downloadSrt = useCallback(() => {
    const safeName = clip.title.replace(/\s+/g, "_");
    downloadBlob(vttToSrt(vttContent), `${safeName}.srt`, "text/plain");
  }, [vttContent, clip.title, downloadBlob]);

  const downloadTxt = useCallback(() => {
    const text = parsedLines.map((l) => l.text).join("\n");
    const safeName = clip.title.replace(/\s+/g, "_");
    downloadBlob(text, `${safeName}.txt`, "text/plain");
  }, [parsedLines, clip.title, downloadBlob]);

  // ────────────────────────────────────────────────────────────────────────────
  const charCount = caption.length;
  const hasHook = clip.hook && clip.hook.trim().length > 0;
  const hasCaptions = Boolean(clip.captionsUrl);
  const isDirty =
    parsedLines.some(
      (l, i) => l.text !== (originalLines[i]?.text ?? l.text)
    );

  return (
    <div className="flex flex-col gap-6">
      {/* A. Caption lista para copiar */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Caption</h3>
          <CharBadge count={charCount} />
        </div>

        <textarea
          readOnly
          value={caption}
          rows={5}
          className="w-full resize-none rounded-xl border border-[#262626] bg-[#0d0d0d]
                     text-[#a3a3a3] text-sm leading-relaxed p-3
                     focus:outline-none focus:border-[#404040] transition-colors"
        />

        <button
          onClick={() => void handleCopyCaption()}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200
            ${
              copied
                ? "bg-green-500/10 border-green-500/40 text-green-400"
                : "bg-[#111] border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040]"
            }`}
        >
          {copied ? "✓ Copiado" : "📋 Copiar caption"}
        </button>
      </section>

      {/* B. Hook del clip */}
      {hasHook && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              🎣 Hook detectado
            </span>
            <span className="px-2 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 text-xs font-semibold">
              IA
            </span>
          </div>
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-lg p-3">
            <p className="text-[#d1d5db] text-sm italic leading-relaxed">
              {clip.hook}
            </p>
          </div>
        </section>
      )}

      {/* C. Hashtags individuales */}
      {clip.hashtags.length > 0 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-white">
            Hashtags{" "}
            <span className="text-[#525252] font-normal">
              ({clip.hashtags.length})
            </span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {clip.hashtags.map((tag) => {
              const isActive = activeTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => void handleCopyTag(tag)}
                  className={`px-3 py-1 rounded-full border text-xs font-medium transition-all duration-150
                    ${
                      isActive
                        ? "bg-violet-500/15 border-violet-500/60 text-violet-300"
                        : "bg-[#1a1a1a] border-[#262626] text-[#a3a3a3] hover:text-white hover:border-[#404040]"
                    }`}
                  title={`Copiar ${tag}`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* D. Métricas del clip */}
      <section className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-white">Métricas</h3>

        {/* Virality score */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#737373]">Score de viralidad</span>
            <span className="text-xs font-semibold text-violet-400">
              {clip.score}/100
            </span>
          </div>
          <ProgressBar value={clip.score} color="violet" />
        </div>

        {/* Emotion score */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#737373]">Energía emocional</span>
            <span className="text-xs font-semibold text-cyan-400">
              {clip.emotionScore}/100
            </span>
          </div>
          <ProgressBar value={clip.emotionScore} color="cyan" />
        </div>

        {/* Filler words badge */}
        {clip.fillerWordsRemoved > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 self-start">
            <span className="text-green-400 text-xs font-semibold">
              ✓ {clip.fillerWordsRemoved} muletilla
              {clip.fillerWordsRemoved !== 1 ? "s" : ""} eliminada
              {clip.fillerWordsRemoved !== 1 ? "s" : ""}
            </span>
          </div>
        )}
      </section>

      {/* E. Editor de subtítulos */}
      {hasCaptions && (
        <section className="flex flex-col gap-3">
          {/* Header row: toggle + export buttons */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              onClick={() => setEditorOpen((v) => !v)}
              className={`flex items-center gap-1.5 text-sm font-semibold transition-colors duration-150
                ${editorOpen ? "text-white" : "text-[#a3a3a3] hover:text-white"}`}
            >
              <span>{editorOpen ? "▾" : "▸"}</span>
              <span>✏️ Editar subtítulos</span>
            </button>

            {/* Export buttons — visible whenever VTT is loaded */}
            {vttContent && (
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadSrt}
                  className="px-2.5 py-1 rounded-lg border border-[#262626] bg-[#111] text-[#a3a3a3]
                             text-xs font-medium hover:text-white hover:border-[#404040] transition-all duration-150"
                  title="Descargar como SRT"
                >
                  ⬇ SRT
                </button>
                <button
                  onClick={downloadTxt}
                  className="px-2.5 py-1 rounded-lg border border-[#262626] bg-[#111] text-[#a3a3a3]
                             text-xs font-medium hover:text-white hover:border-[#404040] transition-all duration-150"
                  title="Descargar solo texto"
                >
                  ⬇ TXT
                </button>
              </div>
            )}
          </div>

          {/* Expanded editor */}
          {editorOpen && (
            <div className="flex flex-col gap-3">
              {loadingVtt ? (
                <p className="text-xs text-[#525252] py-2">Cargando subtítulos…</p>
              ) : parsedLines.length === 0 ? (
                <p className="text-xs text-[#525252] py-2">No se encontraron subtítulos.</p>
              ) : (
                <>
                  <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {parsedLines.map((line) => (
                      <div
                        key={line.id}
                        className="flex items-start gap-2"
                      >
                        {/* Timestamp — read-only */}
                        <span className="shrink-0 pt-2 text-xs font-mono text-[#525252] select-all">
                          {line.time.split(" --> ")[0]}
                        </span>

                        {/* Editable text */}
                        <input
                          type="text"
                          value={line.text}
                          onChange={(e) =>
                            handleLineChange(line.id, e.target.value)
                          }
                          className="flex-1 bg-[#0d0d0d] border border-[#262626] rounded-lg px-2.5 py-1.5
                                     text-xs text-[#d1d5db] focus:outline-none focus:border-violet-500/50
                                     transition-colors placeholder:text-[#404040]"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => void handleSave()}
                      disabled={savingVtt || !isDirty}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold
                                 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed
                        ${
                          saveStatus === "saved"
                            ? "bg-green-500/10 border-green-500/40 text-green-400"
                            : saveStatus === "error"
                            ? "bg-red-500/10 border-red-500/40 text-red-400"
                            : "bg-violet-500/10 border-violet-500/30 text-violet-400 hover:bg-violet-500/15"
                        }`}
                    >
                      {savingVtt
                        ? "Guardando…"
                        : saveStatus === "saved"
                        ? "✓ Guardado"
                        : saveStatus === "error"
                        ? "✗ Error"
                        : "💾 Guardar cambios"}
                    </button>

                    <button
                      onClick={handleRestore}
                      disabled={!isDirty}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#262626]
                                 bg-[#111] text-[#a3a3a3] text-xs font-semibold hover:text-white
                                 hover:border-[#404040] transition-all duration-150
                                 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ↩ Restaurar original
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* F. Notas personales */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-white">📝 Notas</h3>
        <div className="relative">
          <textarea
            value={note}
            onChange={handleNoteChange}
            rows={3}
            placeholder="Escribe aquí tus ideas para este clip..."
            className="w-full bg-[#0d0d0d] border border-[#262626] rounded-xl p-3 text-sm text-[#a3a3a3]
                       resize-none focus:outline-none focus:border-violet-500/50 transition-colors
                       placeholder:text-[#404040]"
          />
          <span
            className={`absolute bottom-2 right-3 text-xs select-none
              ${note.length >= NOTE_MAX_CHARS
                ? "text-red-400"
                : note.length >= NOTE_MAX_CHARS * 0.8
                ? "text-yellow-500/70"
                : "text-[#404040]"
              }`}
          >
            {note.length}/{NOTE_MAX_CHARS}
          </span>
        </div>
      </section>
    </div>
  );
}
