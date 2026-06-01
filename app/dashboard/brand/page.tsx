"use client";

import { useState, useEffect, useCallback } from "react";
import { Palette, Trash2, CheckCircle, Loader2 } from "lucide-react";
import type { BrandKit } from "@/lib/brand-kit";

// ── Types ────────────────────────────────────────────────────────────────────

type WatermarkPosition = BrandKit["watermarkPosition"];

interface FormState {
  name: string;
  primaryColor: string;
  textColor: string;
  watermarkText: string;
  watermarkPosition: WatermarkPosition;
  watermarkSize: number;
  introText: string;
}

const DEFAULT_FORM: FormState = {
  name: "",
  primaryColor: "#A8FF00",
  textColor: "#FFFFFF",
  watermarkText: "",
  watermarkPosition: "bottom-right",
  watermarkSize: 18,
  introText: "",
};

const POSITIONS: { value: WatermarkPosition; label: string }[] = [
  { value: "top-left", label: "Arriba izquierda" },
  { value: "top-right", label: "Arriba derecha" },
  { value: "bottom-left", label: "Abajo izquierda" },
  { value: "bottom-right", label: "Abajo derecha" },
];

// ── Watermark preview position helpers ───────────────────────────────────────

function positionStyle(pos: WatermarkPosition): React.CSSProperties {
  const base: React.CSSProperties = { position: "absolute", padding: "6px 10px" };
  if (pos === "top-left")    return { ...base, top: 12, left: 12 };
  if (pos === "top-right")   return { ...base, top: 12, right: 12 };
  if (pos === "bottom-left") return { ...base, bottom: 12, left: 12 };
  return { ...base, bottom: 12, right: 12 };
}

// ── Kit Card ─────────────────────────────────────────────────────────────────

function KitCard({
  kit,
  onDelete,
}: {
  kit: BrandKit;
  onDelete: (id: string) => void;
}) {
  const pos = positionStyle(kit.watermarkPosition);

  return (
    <div
      className="rounded-2xl border p-4 flex flex-col gap-3"
      style={{ background: "#12131A", borderColor: "#1E2030" }}
    >
      {/* Preview thumbnail */}
      <div
        className="relative rounded-xl overflow-hidden"
        style={{
          background: "#111",
          aspectRatio: "9/16",
          maxHeight: 180,
        }}
      >
        {/* Simulated video frame */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#fff" strokeWidth="1.5" />
            <polygon points="10,8 16,12 10,16" fill="#fff" />
          </svg>
        </div>
        {/* Kit primary color bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: kit.primaryColor }}
        />
        {/* Watermark preview */}
        {kit.watermarkText && (
          <div
            style={{
              ...pos,
              color: kit.textColor,
              fontSize: Math.min(kit.watermarkSize * 0.55, 14),
              fontFamily: "var(--font-mono)",
              background: "rgba(0,0,0,0.35)",
              borderRadius: 4,
              whiteSpace: "nowrap",
            }}
          >
            {kit.watermarkText}
          </div>
        )}
      </div>

      {/* Kit info */}
      <div>
        <p
          className="text-sm font-semibold truncate"
          style={{ fontFamily: "var(--font-display)", color: "#F0F0F2", fontSize: 11 }}
        >
          {kit.name}
        </p>
        {kit.watermarkText && (
          <p
            className="text-xs mt-0.5 truncate"
            style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
          >
            {kit.watermarkText} · {kit.watermarkPosition}
          </p>
        )}
      </div>

      {/* Color swatches */}
      <div className="flex items-center gap-2">
        <div
          className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0"
          style={{ background: kit.primaryColor }}
          title={`Primary: ${kit.primaryColor}`}
        />
        <div
          className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0"
          style={{ background: kit.textColor }}
          title={`Text: ${kit.textColor}`}
        />
        <span
          className="text-xs ml-auto"
          style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
        >
          {kit.watermarkSize}px
        </span>
      </div>

      {/* Actions */}
      <button
        onClick={() => onDelete(kit.id)}
        className="flex items-center gap-2 justify-center px-3 py-2 rounded-lg text-xs transition-colors"
        style={{
          fontFamily: "var(--font-mono)",
          color: "#FF3B3B",
          background: "rgba(255,59,59,0.08)",
          border: "1px solid rgba(255,59,59,0.2)",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,59,0.18)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,59,59,0.08)"; }}
      >
        <Trash2 className="w-3.5 h-3.5" />
        ELIMINAR
      </button>
    </div>
  );
}

// ── Input helpers ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label
      className="block text-xs mb-1.5 uppercase tracking-widest"
      style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
    >
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
      style={{
        background: "#0B0C10",
        border: "1px solid #1E2030",
        color: "#F0F0F2",
        fontFamily: "var(--font-mono)",
      }}
      onFocus={(e) => { e.currentTarget.style.borderColor = "#A8FF00"; }}
      onBlur={(e) => { e.currentTarget.style.borderColor = "#1E2030"; }}
    />
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg"
        style={{ background: "#0B0C10", border: "1px solid #1E2030" }}
      >
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer flex-shrink-0"
          style={{ border: "none", background: "transparent", padding: 0 }}
        />
        <span
          className="text-sm"
          style={{ fontFamily: "var(--font-mono)", color: "#9597B0" }}
        >
          {value.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

// ── Live Preview ──────────────────────────────────────────────────────────────

function LivePreview({ form }: { form: FormState }) {
  const pos = positionStyle(form.watermarkPosition);

  return (
    <div className="sticky top-6">
      <p
        className="text-xs uppercase tracking-widest mb-3"
        style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
      >
        Preview en vivo
      </p>
      <div
        className="relative rounded-2xl overflow-hidden mx-auto"
        style={{
          background: "#111",
          aspectRatio: "9/16",
          maxWidth: 220,
          border: `1px solid ${form.primaryColor}33`,
        }}
      >
        {/* Fake content */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 opacity-25"
          style={{ color: "#fff" }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
            <polygon points="10,8 16,12 10,16" fill="currentColor" />
          </svg>
          <div
            className="w-20 h-1.5 rounded-full"
            style={{ background: form.primaryColor }}
          />
          <div className="w-16 h-1 rounded-full bg-white/30" />
          <div className="w-12 h-1 rounded-full bg-white/20" />
        </div>

        {/* Primary color accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ background: form.primaryColor }}
        />

        {/* Watermark */}
        {form.watermarkText && (
          <div
            style={{
              ...pos,
              color: form.textColor,
              fontSize: Math.min(form.watermarkSize * 0.6, 16),
              fontFamily: "var(--font-mono)",
              background: "rgba(0,0,0,0.35)",
              borderRadius: 4,
              whiteSpace: "nowrap",
              maxWidth: "calc(100% - 24px)",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {form.watermarkText}
          </div>
        )}

        {/* Intro text overlay */}
        {form.introText && (
          <div
            className="absolute inset-0 flex items-center justify-center p-4 opacity-70"
            style={{
              color: form.textColor,
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              textAlign: "center",
              background: "rgba(0,0,0,0.4)",
              pointerEvents: "none",
            }}
          >
            {form.introText}
          </div>
        )}
      </div>

      {/* Color info */}
      <div className="mt-4 flex items-center gap-3 justify-center">
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: form.primaryColor }}
          />
          <span
            className="text-xs"
            style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
          >
            {form.primaryColor}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-full border border-white/20"
            style={{ background: form.textColor }}
          />
          <span
            className="text-xs"
            style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
          >
            {form.textColor}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BrandPage() {
  const [kits, setKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);

  const loadKits = useCallback(async () => {
    try {
      const res = await fetch("/api/brand", { cache: "no-store" });
      if (res.ok) setKits((await res.json()) as BrandKit[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadKits();
  }, [loadKits]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const kit = (await res.json()) as BrandKit;
        setKits((prev) => [kit, ...prev]);
        setForm(DEFAULT_FORM);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/brand?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setKits((prev) => prev.filter((k) => k.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#0B0C10" }}>
      {/* Header */}
      <div
        className="px-6 py-6 border-b"
        style={{ borderColor: "#1E2030" }}
      >
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(168,255,0,0.1)", border: "1px solid rgba(168,255,0,0.2)" }}
          >
            <Palette className="w-4 h-4" style={{ color: "#A8FF00" }} />
          </div>
          <h1
            className="text-lg font-black tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "#F0F0F2" }}
          >
            BRAND KIT
          </h1>
        </div>
        <p
          className="text-xs ml-11"
          style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
        >
          Configura tu marca visual para aplicar a clips exportados
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl">
          {/* ── Editor form ─────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            <div
              className="rounded-2xl p-5 border"
              style={{ background: "#12131A", borderColor: "#1E2030" }}
            >
              <p
                className="text-xs uppercase tracking-widest mb-5"
                style={{ fontFamily: "var(--font-mono)", color: "#A8FF00" }}
              >
                Nuevo kit
              </p>

              {/* Name */}
              <div className="mb-4">
                <Label>Nombre del kit</Label>
                <TextInput
                  value={form.name}
                  onChange={(v) => setField("name", v)}
                  placeholder="Mi marca personal"
                />
              </div>

              {/* Colors row */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <ColorField
                  label="Color primario"
                  value={form.primaryColor}
                  onChange={(v) => setField("primaryColor", v)}
                />
                <ColorField
                  label="Color del texto"
                  value={form.textColor}
                  onChange={(v) => setField("textColor", v)}
                />
              </div>

              {/* Watermark text */}
              <div className="mb-4">
                <Label>Texto del watermark</Label>
                <TextInput
                  value={form.watermarkText}
                  onChange={(v) => setField("watermarkText", v)}
                  placeholder="@miusuario"
                />
              </div>

              {/* Position + Size */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Posición</Label>
                  <select
                    value={form.watermarkPosition}
                    onChange={(e) => setField("watermarkPosition", e.target.value as WatermarkPosition)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
                    style={{
                      background: "#0B0C10",
                      border: "1px solid #1E2030",
                      color: "#F0F0F2",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {POSITIONS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Tamaño ({form.watermarkSize}px)</Label>
                  <input
                    type="range"
                    min={12}
                    max={36}
                    value={form.watermarkSize}
                    onChange={(e) => setField("watermarkSize", Number(e.target.value))}
                    className="w-full mt-2 accent-[#A8FF00]"
                    style={{ accentColor: "#A8FF00" }}
                  />
                  <div
                    className="flex justify-between text-xs mt-1"
                    style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
                  >
                    <span>12px</span>
                    <span>36px</span>
                  </div>
                </div>
              </div>

              {/* Intro text */}
              <div className="mb-5">
                <Label>Texto de intro (opcional)</Label>
                <TextInput
                  value={form.introText}
                  onChange={(v) => setField("introText", v)}
                  placeholder="¡Bienvenido a mi canal!"
                />
              </div>

              {/* Save button */}
              <button
                onClick={() => void handleSave()}
                disabled={saving || !form.name.trim()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  fontFamily: "var(--font-display)",
                  background: saved ? "#22c55e" : "#A8FF00",
                  color: "#0B0C10",
                  boxShadow: saved
                    ? "0 0 24px rgba(34,197,94,0.3)"
                    : "0 0 24px rgba(168,255,0,0.25)",
                  fontSize: 11,
                }}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saved ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Palette className="w-4 h-4" />
                )}
                {saved ? "¡KIT GUARDADO!" : "GUARDAR KIT"}
              </button>
            </div>

            {/* ── Saved kits list ─────────────────────────────────────── */}
            <div>
              <p
                className="text-xs uppercase tracking-widest mb-4"
                style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
              >
                Kits guardados ({kits.length})
              </p>

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border animate-pulse"
                      style={{
                        background: "#12131A",
                        borderColor: "#1E2030",
                        height: 220,
                      }}
                    />
                  ))}
                </div>
              ) : kits.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-12 rounded-2xl border"
                  style={{ background: "#12131A", borderColor: "#1E2030" }}
                >
                  <Palette className="w-8 h-8 mb-3 opacity-20" style={{ color: "#A8FF00" }} />
                  <p
                    className="text-xs"
                    style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
                  >
                    Aún no tienes brand kits guardados
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {kits.map((kit) => (
                    <KitCard key={kit.id} kit={kit} onDelete={(id) => void handleDelete(id)} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Live preview ─────────────────────────────────────────────── */}
          <div className="hidden lg:block">
            <LivePreview form={form} />
          </div>
        </div>
      </div>
    </div>
  );
}
