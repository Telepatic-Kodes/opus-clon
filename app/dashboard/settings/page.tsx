"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  FileVideo,
  Captions,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Types ────────────────────────────────────────────────────────────────────

type AIModel = "gpt-4o" | "gpt-4o-mini";
type SubtitleLang = "es" | "en" | "auto";
type ApiStatus = "idle" | "loading" | "ok" | "error";

interface Formats {
  tiktok: boolean;
  instagram: boolean;
  youtube: boolean;
}

interface Settings {
  model: AIModel;
  clipCount: number;
  minDuration: number;
  maxDuration: number;
  formats: Formats;
  subtitlesEnabled: boolean;
  subtitleLang: SubtitleLang;
  removeFiller: boolean;
}

const DEFAULTS: Settings = {
  model: "gpt-4o",
  clipCount: 8,
  minDuration: 15,
  maxDuration: 90,
  formats: { tiktok: true, instagram: true, youtube: true },
  subtitlesEnabled: true,
  subtitleLang: "auto",
  removeFiller: true,
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#111] border border-[#262626] rounded-2xl p-6"
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-sm font-semibold text-[#a3a3a3] uppercase tracking-wider">
          {title}
        </h2>
      </div>
      <div className="space-y-5">{children}</div>
    </motion.div>
  );
}

// ─── Slider ───────────────────────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#d4d4d4]">{label}</span>
        <span className="text-sm font-semibold text-white tabular-nums">
          {value}
          {unit ?? ""}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-[#262626] cursor-pointer accent-violet-500"
      />
      <div className="flex justify-between text-[10px] text-[#525252]">
        <span>
          {min}
          {unit ?? ""}
        </span>
        <span>
          {max}
          {unit ?? ""}
        </span>
      </div>
    </div>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-[#d4d4d4]">{label}</p>
        {description && (
          <p className="text-xs text-[#525252] mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none",
          checked ? "bg-violet-600" : "bg-[#333]"
        )}
        style={{ height: "22px", width: "40px" }}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-[18px]" : "translate-x-0"
          )}
        />
      </button>
    </div>
  );
}

// ─── Settings page ────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [mounted, setMounted] = useState(false);

  // API status
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [apiError, setApiError] = useState<string>("");

  // Storage stats
  const [jobCount, setJobCount] = useState<number | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setSettings({
      model: getStorage<AIModel>("opus_settings_model", DEFAULTS.model),
      clipCount: getStorage<number>("opus_settings_clip_count", DEFAULTS.clipCount),
      minDuration: getStorage<number>("opus_settings_min_duration", DEFAULTS.minDuration),
      maxDuration: getStorage<number>("opus_settings_max_duration", DEFAULTS.maxDuration),
      formats: getStorage<Formats>("opus_settings_formats", DEFAULTS.formats),
      subtitlesEnabled: getStorage<boolean>(
        "opus_settings_subtitles",
        DEFAULTS.subtitlesEnabled
      ),
      subtitleLang: getStorage<SubtitleLang>(
        "opus_settings_subtitle_lang",
        DEFAULTS.subtitleLang
      ),
      removeFiller: getStorage<boolean>(
        "opus_settings_remove_filler",
        DEFAULTS.removeFiller
      ),
    });
    setMounted(true);
  }, []);

  // Persist every change
  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      // Persist individual keys
      const storageKeys: Record<keyof Settings, string> = {
        model: "opus_settings_model",
        clipCount: "opus_settings_clip_count",
        minDuration: "opus_settings_min_duration",
        maxDuration: "opus_settings_max_duration",
        formats: "opus_settings_formats",
        subtitlesEnabled: "opus_settings_subtitles",
        subtitleLang: "opus_settings_subtitle_lang",
        removeFiller: "opus_settings_remove_filler",
      };
      setStorage(storageKeys[key], value);
      return next;
    });
  }

  // Load job count
  const loadJobCount = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs", { cache: "no-store" });
      if (!res.ok) { setJobCount(0); return; }
      const data = await res.json() as unknown[];
      setJobCount(data.length);
    } catch {
      setJobCount(0);
    }
  }, []);

  useEffect(() => {
    void loadJobCount();
  }, [loadJobCount]);

  // Health check
  async function checkApi() {
    setApiStatus("loading");
    setApiError("");
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = await res.json() as { ok: boolean; error?: string };
      if (data.ok) {
        setApiStatus("ok");
      } else {
        setApiStatus("error");
        setApiError(data.error ?? "Error desconocido");
      }
    } catch {
      setApiStatus("error");
      setApiError("No se pudo conectar con el servidor");
    }
  }

  // Clear jobs
  async function handleClearAll() {
    if (!clearConfirm) {
      setClearConfirm(true);
      setTimeout(() => setClearConfirm(false), 4000);
      return;
    }
    try {
      await fetch("/api/jobs/all", { method: "DELETE" });
      void loadJobCount();
    } catch {
      // Endpoint may not exist yet
      alert("Esta función estará disponible pronto.");
    }
    setClearConfirm(false);
  }

  if (!mounted) {
    // Skeleton while loading settings from localStorage
    return (
      <div className="flex-1 flex flex-col p-6 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-48 rounded-2xl bg-[#111] border border-[#262626] animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Page header */}
      <div className="px-6 py-6 border-b border-[#1f1f1f]">
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-[#737373] mt-0.5">
          Configura el comportamiento de la IA y los clips generados
        </p>
      </div>

      <div className="flex-1 p-6 space-y-4 max-w-2xl">
        {/* ─── A. Configuración de IA ─────────────────────────────────────── */}
        <Section
          icon={<Cpu className="w-4 h-4 text-violet-400" />}
          title="Configuración de IA"
        >
          {/* Model select */}
          <div className="space-y-2">
            <label className="text-sm text-[#d4d4d4]">Modelo de análisis</label>
            <select
              value={settings.model}
              onChange={(e) => update("model", e.target.value as AIModel)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#333] text-sm text-white outline-none hover:border-[#444] focus:border-violet-500/50 transition-colors cursor-pointer"
            >
              <option value="gpt-4o">gpt-4o — Recomendado (mayor calidad)</option>
              <option value="gpt-4o-mini">gpt-4o-mini — Más rápido y económico</option>
            </select>
          </div>

          <SliderRow
            label="Número de clips por video"
            value={settings.clipCount}
            min={5}
            max={12}
            onChange={(v) => update("clipCount", v)}
          />

          <SliderRow
            label="Duración mínima del clip"
            value={settings.minDuration}
            min={10}
            max={30}
            unit="s"
            onChange={(v) => update("minDuration", v)}
          />

          <SliderRow
            label="Duración máxima del clip"
            value={settings.maxDuration}
            min={60}
            max={120}
            unit="s"
            onChange={(v) => update("maxDuration", v)}
          />
        </Section>

        {/* ─── B. Formatos de exportación ─────────────────────────────────── */}
        <Section
          icon={<FileVideo className="w-4 h-4 text-violet-400" />}
          title="Formatos de exportación"
        >
          {(
            [
              { key: "tiktok" as const, label: "TikTok / Reels", ratio: "9:16" },
              { key: "instagram" as const, label: "Instagram Post", ratio: "1:1" },
              { key: "youtube" as const, label: "YouTube / LinkedIn", ratio: "16:9" },
            ] satisfies { key: keyof Formats; label: string; ratio: string }[]
          ).map(({ key, label, ratio }) => (
            <label
              key={key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={settings.formats[key]}
                onChange={(e) =>
                  update("formats", { ...settings.formats, [key]: e.target.checked })
                }
                className="w-4 h-4 rounded accent-violet-500 cursor-pointer"
              />
              <span className="text-sm text-[#d4d4d4] group-hover:text-white transition-colors flex-1">
                {label}
              </span>
              <span className="text-xs text-[#525252] font-mono">{ratio}</span>
            </label>
          ))}
        </Section>

        {/* ─── C. Subtítulos ──────────────────────────────────────────────── */}
        <Section
          icon={<Captions className="w-4 h-4 text-violet-400" />}
          title="Subtítulos"
        >
          <Toggle
            label="Activar subtítulos por defecto"
            description="Genera subtítulos para todos los clips automáticamente"
            checked={settings.subtitlesEnabled}
            onChange={(v) => update("subtitlesEnabled", v)}
          />

          {settings.subtitlesEnabled && (
            <div className="space-y-2">
              <label className="text-sm text-[#d4d4d4]">Idioma de subtítulos</label>
              <select
                value={settings.subtitleLang}
                onChange={(e) =>
                  update("subtitleLang", e.target.value as SubtitleLang)
                }
                className="w-full px-3 py-2.5 rounded-xl bg-[#0d0d0d] border border-[#333] text-sm text-white outline-none hover:border-[#444] focus:border-violet-500/50 transition-colors cursor-pointer"
              >
                <option value="auto">Auto-detect</option>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
          )}

          <Toggle
            label="Eliminar muletillas automáticamente"
            description='Quita "ehh", "umm", "o sea", etc.'
            checked={settings.removeFiller}
            onChange={(v) => update("removeFiller", v)}
          />
        </Section>

        {/* ─── D. API Status ──────────────────────────────────────────────── */}
        <Section
          icon={<RefreshCw className="w-4 h-4 text-violet-400" />}
          title="API Status"
        >
          <div className="flex items-center justify-between gap-4">
            {/* Status indicator */}
            <div className="flex items-center gap-2.5">
              {apiStatus === "idle" && (
                <>
                  <div className="w-2 h-2 rounded-full bg-[#525252]" />
                  <span className="text-sm text-[#737373]">Sin verificar</span>
                </>
              )}
              {apiStatus === "loading" && (
                <>
                  <Loader2 className="w-4 h-4 text-[#a3a3a3] animate-spin" />
                  <span className="text-sm text-[#a3a3a3]">Verificando…</span>
                </>
              )}
              {apiStatus === "ok" && (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">
                    API configurada y activa
                  </span>
                </>
              )}
              {apiStatus === "error" && (
                <>
                  <XCircle className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-sm text-red-400">Sin API key</p>
                    {apiError && (
                      <p className="text-xs text-[#737373] mt-0.5">{apiError}</p>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Test button */}
            <button
              onClick={() => void checkApi()}
              disabled={apiStatus === "loading"}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1a1a1a] border border-[#333] hover:border-[#444] hover:bg-[#222] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {apiStatus === "loading" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              Probar conexión
            </button>
          </div>
        </Section>

        {/* ─── E. Almacenamiento ──────────────────────────────────────────── */}
        <Section
          icon={<HardDrive className="w-4 h-4 text-violet-400" />}
          title="Almacenamiento"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#0d0d0d] border border-[#262626] px-4 py-3">
              <p className="text-2xl font-bold text-white">
                {jobCount === null ? "—" : jobCount}
              </p>
              <p className="text-xs text-[#737373] mt-0.5">Jobs en la base de datos</p>
            </div>
            <div className="rounded-xl bg-[#0d0d0d] border border-[#262626] px-4 py-3">
              <p className="text-2xl font-bold text-white">N/A</p>
              <p className="text-xs text-[#737373] mt-0.5">Espacio usado en disco</p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => void handleClearAll()}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all border",
                clearConfirm
                  ? "bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20"
                  : "bg-[#1a1a1a] border-[#333] text-[#a3a3a3] hover:border-[#444] hover:text-white"
              )}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {clearConfirm ? "¿Confirmar? Haz clic de nuevo" : "Limpiar todo"}
            </button>
            {clearConfirm && (
              <button
                onClick={() => setClearConfirm(false)}
                className="text-xs text-[#525252] hover:text-[#a3a3a3] transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
