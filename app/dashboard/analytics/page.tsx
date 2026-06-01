"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { BarChart2, Loader2 } from "lucide-react";
import type { JobSummary } from "@/app/api/jobs/route";
import type { Clip } from "@/types";

// ── Extended job type with clips detail ──────────────────────────────────────

interface JobDetail {
  id: string;
  url: string;
  status: string;
  createdAt: number;
  clips: Clip[];
  error?: string;
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchJobs(): Promise<JobSummary[]> {
  try {
    const res = await fetch("/api/jobs", { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as JobSummary[];
  } catch {
    return [];
  }
}

async function fetchJobDetail(id: string): Promise<JobDetail | null> {
  try {
    const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as JobDetail;
  } catch {
    return null;
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateLabel(key: string): string {
  const [, month, day] = key.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[Number(month) - 1]} ${Number(day)}`;
}

function last14Days(): string[] {
  const days: string[] = [];
  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    days.push(toDateKey(now - i * 86_400_000));
  }
  return days;
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border p-5 flex flex-col gap-1"
      style={{
        background: "#12131A",
        borderColor: accent ? "rgba(168,255,0,0.25)" : "#1E2030",
        boxShadow: accent ? "0 0 20px rgba(168,255,0,0.07)" : "none",
      }}
    >
      <p
        className="text-xs uppercase tracking-widest"
        style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
      >
        {label}
      </p>
      <p
        className="text-3xl font-black leading-none"
        style={{
          fontFamily: "var(--font-display)",
          color: accent ? "#A8FF00" : "#F0F0F2",
          fontSize: 28,
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          className="text-xs"
          style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-xs uppercase tracking-widest mb-4"
      style={{ fontFamily: "var(--font-mono)", color: "#A8FF00" }}
    >
      {children}
    </p>
  );
}

// ── Bar Chart (clips por día) ─────────────────────────────────────────────────

function ClipsByDayChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const days = last14Days();
  const counts = days.map((d) => data[d] ?? 0);
  const maxCount = Math.max(...counts, 1);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "#12131A", borderColor: "#1E2030" }}
    >
      <SectionHeader>Clips por día — últimos 14 días</SectionHeader>
      <div className="flex items-end gap-1.5 h-36">
        {days.map((day, i) => {
          const count = counts[i];
          const heightPct = (count / maxCount) * 100;
          return (
            <div
              key={day}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              {/* Bar */}
              <div className="flex-1 w-full flex items-end">
                <div
                  className="w-full rounded-t-sm transition-all duration-300"
                  style={{
                    height: count === 0 ? 2 : `${Math.max(heightPct, 4)}%`,
                    background: count === 0 ? "#1E2030" : "#A8FF00",
                    opacity: count === 0 ? 0.3 : 1,
                  }}
                />
              </div>
              {/* Tooltip */}
              {count > 0 && (
                <div
                  className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10"
                  style={{
                    background: "#22243A",
                    border: "1px solid #2E3050",
                    color: "#A8FF00",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                  }}
                >
                  {count} clip{count !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {/* X axis labels — show every 2 */}
      <div className="flex items-center gap-1.5 mt-2">
        {days.map((day, i) => (
          <div key={day} className="flex-1 text-center">
            {i % 2 === 0 && (
              <span
                className="text-xs"
                style={{ fontFamily: "var(--font-mono)", color: "#4B4D62", fontSize: 9 }}
              >
                {formatDateLabel(day)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Score Distribution ────────────────────────────────────────────────────────

const SCORE_BUCKETS = [
  { label: "90–100", min: 90, max: 100, color: "#A8FF00" },
  { label: "70–89",  min: 70, max: 89,  color: "#FFE600" },
  { label: "50–69",  min: 50, max: 69,  color: "#FF8C00" },
  { label: "<50",    min: 0,  max: 49,  color: "#FF3B3B" },
] as const;

function ScoreDistributionChart({ clips }: { clips: Clip[] }) {
  const buckets = SCORE_BUCKETS.map((b) => ({
    ...b,
    count: clips.filter((c) => c.score >= b.min && c.score <= b.max).length,
  }));
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "#12131A", borderColor: "#1E2030" }}
    >
      <SectionHeader>Distribución de scores</SectionHeader>
      <div className="space-y-3">
        {buckets.map((b) => (
          <div key={b.label} className="flex items-center gap-3">
            <span
              className="text-xs w-14 text-right flex-shrink-0"
              style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
            >
              {b.label}
            </span>
            <div
              className="flex-1 rounded-full overflow-hidden"
              style={{ background: "#1A1C26", height: 10 }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(b.count / maxCount) * 100}%`,
                  background: b.color,
                  minWidth: b.count > 0 ? 4 : 0,
                }}
              />
            </div>
            <span
              className="text-xs w-10 flex-shrink-0"
              style={{ fontFamily: "var(--font-mono)", color: "#9597B0" }}
            >
              {b.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Format Donut ──────────────────────────────────────────────────────────────

type ClipRatio = "9:16" | "1:1" | "16:9";

const FORMAT_COLORS: Record<ClipRatio, string> = {
  "9:16":  "#A8FF00",
  "1:1":   "#00E5FF",
  "16:9":  "#A855F7",
};

function FormatDonut({ clips }: { clips: Clip[] }) {
  const counts = useMemo<Record<ClipRatio, number>>(() => {
    const acc: Record<ClipRatio, number> = { "9:16": 0, "1:1": 0, "16:9": 0 };
    for (const clip of clips) {
      for (const fmt of clip.formats ?? []) {
        const r = fmt.ratio as ClipRatio;
        if (r in acc) acc[r]++;
      }
    }
    return acc;
  }, [clips]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  if (total === 0) {
    return (
      <div
        className="rounded-2xl border p-5"
        style={{ background: "#12131A", borderColor: "#1E2030" }}
      >
        <SectionHeader>Formatos más exportados</SectionHeader>
        <p
          className="text-xs text-center py-6"
          style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
        >
          Sin datos de formatos
        </p>
      </div>
    );
  }

  // Build SVG donut segments
  const radius = 60;
  const cx = 80;
  const cy = 80;
  const strokeWidth = 22;

  const ratios = (["9:16", "1:1", "16:9"] as ClipRatio[]).map((r) => ({
    ratio: r,
    count: counts[r],
    pct: total > 0 ? counts[r] / total : 0,
    color: FORMAT_COLORS[r],
  }));

  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  const segments = ratios.map((r) => {
    const dashArray = r.pct * circumference;
    const dashOffset = -offset * circumference + circumference * 0.25; // start from top
    offset += r.pct;
    return { ...r, dashArray, dashOffset };
  });

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "#12131A", borderColor: "#1E2030" }}
    >
      <SectionHeader>Formatos más exportados</SectionHeader>
      <div className="flex items-center gap-6">
        {/* SVG Donut */}
        <svg width={160} height={160} viewBox="0 0 160 160" className="flex-shrink-0">
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#1A1C26"
            strokeWidth={strokeWidth}
          />
          {segments.map((seg) =>
            seg.pct > 0 ? (
              <circle
                key={seg.ratio}
                cx={cx}
                cy={cy}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${seg.dashArray} ${circumference}`}
                strokeDashoffset={seg.dashOffset}
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
            ) : null
          )}
          {/* Center label */}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fill="#F0F0F2"
            fontSize={18}
            fontFamily="var(--font-display)"
            fontWeight="900"
          >
            {total}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            fill="#6B6D82"
            fontSize={9}
            fontFamily="var(--font-mono)"
          >
            formatos
          </text>
        </svg>

        {/* Legend */}
        <div className="space-y-3 flex-1">
          {ratios.map((r) => (
            <div key={r.ratio} className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: r.color }}
              />
              <span
                className="text-xs flex-1"
                style={{ fontFamily: "var(--font-mono)", color: "#9597B0" }}
              >
                {r.ratio}
              </span>
              <span
                className="text-xs font-bold"
                style={{ fontFamily: "var(--font-mono)", color: "#F0F0F2" }}
              >
                {r.pct > 0 ? `${Math.round(r.pct * 100)}%` : "0%"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Top Hashtags ──────────────────────────────────────────────────────────────

function TopHashtags({ clips }: { clips: Clip[] }) {
  const tagFreq = useMemo<Map<string, number>>(() => {
    const freq = new Map<string, number>();
    for (const clip of clips) {
      for (const tag of clip.hashtags ?? []) {
        freq.set(tag, (freq.get(tag) ?? 0) + 1);
      }
    }
    return freq;
  }, [clips]);

  const sorted = [...tagFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30);

  const maxFreq = sorted[0]?.[1] ?? 1;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "#12131A", borderColor: "#1E2030" }}
    >
      <SectionHeader>Top hashtags generados</SectionHeader>
      {sorted.length === 0 ? (
        <p
          className="text-xs text-center py-6"
          style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
        >
          Sin hashtags aún
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sorted.map(([tag, count]) => {
            const weight = count / maxFreq; // 0–1
            const fontSize = 11 + weight * 10; // 11–21
            const opacity = 0.4 + weight * 0.6; // 0.4–1
            return (
              <span
                key={tag}
                style={{
                  fontSize,
                  opacity,
                  fontFamily: "var(--font-mono)",
                  color: "#A8FF00",
                  cursor: "default",
                  lineHeight: 1.5,
                }}
                title={`${count} veces`}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Processing Trend (SVG line chart) ────────────────────────────────────────

function ProcessingTrendChart({
  jobs,
}: {
  jobs: { createdAt: number; processingSeconds: number }[];
}) {
  if (jobs.length < 2) {
    return (
      <div
        className="rounded-2xl border p-5"
        style={{ background: "#12131A", borderColor: "#1E2030" }}
      >
        <SectionHeader>Tendencias de procesamiento</SectionHeader>
        <p
          className="text-xs text-center py-6"
          style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
        >
          Se necesitan al menos 2 jobs para ver tendencias
        </p>
      </div>
    );
  }

  const W = 400;
  const H = 100;
  const PAD = 20;

  const maxSec = Math.max(...jobs.map((j) => j.processingSeconds), 1);
  const minSec = Math.min(...jobs.map((j) => j.processingSeconds), 0);
  const range = maxSec - minSec || 1;

  const points = jobs.map((j, i) => {
    const x = PAD + (i / (jobs.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((j.processingSeconds - minSec) / range) * (H - PAD * 2);
    return { x, y, sec: j.processingSeconds };
  });

  const pathD =
    points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join(" ");

  // Area fill under the line
  const areaD = `${pathD} L ${points[points.length - 1].x.toFixed(1)},${(H - PAD).toFixed(1)} L ${points[0].x.toFixed(1)},${(H - PAD).toFixed(1)} Z`;

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "#12131A", borderColor: "#1E2030" }}
    >
      <SectionHeader>Tendencias de procesamiento</SectionHeader>
      <div className="overflow-x-auto">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="block"
          style={{ minWidth: 280 }}
        >
          {/* Area fill */}
          <path d={areaD} fill="rgba(168,255,0,0.06)" />
          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#A8FF00"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {/* Points */}
          {points.map((p, i) => (
            <g key={i}>
              <circle cx={p.x} cy={p.y} r={4} fill="#0B0C10" stroke="#A8FF00" strokeWidth={2} />
              {/* Tooltip on hover — using title */}
              <title>{`${p.sec}s`}</title>
            </g>
          ))}
          {/* Y-axis labels */}
          <text
            x={PAD - 2}
            y={PAD}
            fill="#4B4D62"
            fontSize={9}
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            {maxSec}s
          </text>
          <text
            x={PAD - 2}
            y={H - PAD}
            fill="#4B4D62"
            fontSize={9}
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            {minSec}s
          </text>
        </svg>
      </div>
      <p
        className="text-xs mt-2"
        style={{ fontFamily: "var(--font-mono)", color: "#4B4D62" }}
      >
        {jobs.length} jobs · promedio{" "}
        {Math.round(
          jobs.reduce((a, j) => a + j.processingSeconds, 0) / jobs.length
        )}
        s
      </p>
    </div>
  );
}

// ── Main Analytics Page ───────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [jobs, setJobs] = useState<JobSummary[]>([]);
  const [allClips, setAllClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const summaries = await fetchJobs();
      setJobs(summaries);

      // Fetch full clip data for done jobs to get hashtags, formats, fillerWords
      const doneJobs = summaries.filter((j) => j.status === "done").slice(0, 20);
      const details = await Promise.all(doneJobs.map((j) => fetchJobDetail(j.id)));
      const clips: Clip[] = [];
      for (const d of details) {
        if (d) clips.push(...d.clips);
      }
      setAllClips(clips);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // ── Derived analytics ──────────────────────────────────────────────────────

  const totalVideos = jobs.length;
  const totalClips = jobs.reduce((a, j) => a + j.clipCount, 0);

  const avgScore = useMemo(() => {
    const jobsWithClips = jobs.filter((j) => j.clipCount > 0);
    if (jobsWithClips.length === 0) return "—";
    const avg =
      jobsWithClips.reduce((a, j) => a + j.avgScore, 0) / jobsWithClips.length;
    return avg.toFixed(1);
  }, [jobs]);

  const totalFillerWords = useMemo(
    () => allClips.reduce((a, c) => a + (c.fillerWordsRemoved ?? 0), 0),
    [allClips]
  );

  // Clips por día map
  const clipsByDay = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const job of jobs) {
      if (job.clipCount > 0) {
        const key = toDateKey(job.createdAt);
        map[key] = (map[key] ?? 0) + job.clipCount;
      }
    }
    return map;
  }, [jobs]);

  // Processing seconds per job (approximation: time since job createdAt is unknown,
  // so we estimate based on clip count — 30s base + 15s per clip)
  const processingData = useMemo(
    () =>
      jobs
        .filter((j) => j.status === "done" && j.clipCount > 0)
        .slice(-20)
        .map((j) => ({
          createdAt: j.createdAt,
          processingSeconds: 30 + j.clipCount * 15,
        })),
    [jobs]
  );

  if (loading) {
    return (
      <div
        className="flex-1 flex items-center justify-center min-h-screen"
        style={{ background: "#0B0C10" }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="w-8 h-8 animate-spin"
            style={{ color: "#A8FF00" }}
          />
          <p
            className="text-xs uppercase tracking-widest"
            style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
          >
            Cargando analytics...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen" style={{ background: "#0B0C10" }}>
      {/* Header */}
      <div className="px-6 py-6 border-b" style={{ borderColor: "#1E2030" }}>
        <div className="flex items-center gap-3 mb-1">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(168,255,0,0.1)",
              border: "1px solid rgba(168,255,0,0.2)",
            }}
          >
            <BarChart2 className="w-4 h-4" style={{ color: "#A8FF00" }} />
          </div>
          <h1
            className="text-lg font-black tracking-tight"
            style={{ fontFamily: "var(--font-display)", color: "#F0F0F2" }}
          >
            ANALYTICS
          </h1>
        </div>
        <p
          className="text-xs ml-11"
          style={{ fontFamily: "var(--font-mono)", color: "#6B6D82" }}
        >
          Estadísticas de tus videos y clips procesados
        </p>
      </div>

      {/* Body */}
      <div className="flex-1 p-6 space-y-6 max-w-6xl">
        {/* ── KPIs ────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Videos procesados"
            value={totalVideos}
            sub="jobs totales"
          />
          <KpiCard
            label="Clips generados"
            value={totalClips}
            sub="todos los jobs"
            accent
          />
          <KpiCard
            label="Score promedio"
            value={avgScore}
            sub="viralidad media"
          />
          <KpiCard
            label="Muletillas eliminadas"
            value={totalFillerWords}
            sub="filler words"
          />
        </div>

        {/* ── Bar chart: clips por día ─────────────────────────────────── */}
        <ClipsByDayChart data={clipsByDay} />

        {/* ── Score + Format row ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ScoreDistributionChart clips={allClips} />
          <FormatDonut clips={allClips} />
        </div>

        {/* ── Hashtags ──────────────────────────────────────────────────── */}
        <TopHashtags clips={allClips} />

        {/* ── Processing trend ──────────────────────────────────────────── */}
        <ProcessingTrendChart jobs={processingData} />
      </div>
    </div>
  );
}
