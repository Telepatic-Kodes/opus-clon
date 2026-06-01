/**
 * Main video processing orchestrator.
 * Pipeline: download → transcribe → identify viral moments → cut clips
 */

import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

import ffmpeg from "fluent-ffmpeg";
import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";
import { updateJob, updateJobStatus } from "@/lib/jobs-store";
import type { Clip, ClipFormat, ViralMoment } from "@/types";

const execAsync = promisify(exec);

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const FFMPEG_PATH = process.env.FFMPEG_PATH ?? "/opt/homebrew/bin/ffmpeg";
const YTDLP_PATH = process.env.YTDLP_PATH ?? "/opt/homebrew/bin/yt-dlp";
const PUBLIC_CLIPS_DIR = path.join(process.cwd(), "public", "clips");

ffmpeg.setFfmpegPath(FFMPEG_PATH);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface WhisperSegment {
  start: number;
  end: number;
  text: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function tmpDir(jobId: string): string {
  return path.join("/tmp", "opus_clon", jobId);
}

export function clipsDir(jobId: string): string {
  return path.join(tmpDir(jobId), "clips");
}

export function publicJobDir(jobId: string): string {
  return path.join(PUBLIC_CLIPS_DIR, jobId);
}

export function findVideoFile(jobId: string): string {
  const dir = tmpDir(jobId);
  // yt-dlp may produce video.mp4, video.webm, video.mkv, etc.
  const entries = fs
    .readdirSync(dir)
    .filter((name) => name.startsWith("video."))
    .map((name) => path.join(dir, name));

  if (entries.length === 0) {
    throw new Error(`No video file found in ${dir}`);
  }
  // Prefer mp4 if multiple exist
  const mp4 = entries.find((f) => f.endsWith(".mp4"));
  return mp4 ?? entries[0];
}

// ---------------------------------------------------------------------------
// Step 1 — Download
// ---------------------------------------------------------------------------

export async function downloadVideo(url: string, jobId: string): Promise<string> {
  const dir = tmpDir(jobId);
  fs.mkdirSync(dir, { recursive: true });

  const outputTemplate = path.join(dir, "video.%(ext)s");
  const cmd =
    `"${YTDLP_PATH}" -f "best[ext=mp4]/best" ` +
    `--no-playlist ` +
    `-o "${outputTemplate}" ` +
    `"${url}"`;

  await updateJobStatus(jobId, "downloading", 5, "Downloading video…");

  await execAsync(cmd, { maxBuffer: 100 * 1024 * 1024 });

  await updateJobStatus(jobId, "downloading", 20, "Download complete");

  return findVideoFile(jobId);
}

// ---------------------------------------------------------------------------
// Step 2 — Transcribe
// ---------------------------------------------------------------------------

export async function transcribeVideo(
  videoPath: string,
  jobId: string
): Promise<{ text: string; segments: WhisperSegment[] }> {
  await updateJobStatus(jobId, "transcribing", 25, "Extracting audio…");

  const audioPath = path.join(tmpDir(jobId), "audio.mp3");

  // Extract audio track to mp3 using FFmpeg
  await new Promise<void>((resolve, reject) => {
    ffmpeg(videoPath)
      .noVideo()
      .audioCodec("libmp3lame")
      .audioBitrate(128)
      .output(audioPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });

  await updateJobStatus(jobId, "transcribing", 35, "Transcribing audio with Whisper…");

  const audioStream = fs.createReadStream(audioPath);

  // verbose_json gives us segment-level timestamps
  const transcription = await openai.audio.transcriptions.create({
    file: audioStream,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  // Save full JSON for debugging
  const transcriptJsonPath = path.join(tmpDir(jobId), "transcript.json");
  fs.writeFileSync(transcriptJsonPath, JSON.stringify(transcription, null, 2), "utf-8");

  await updateJobStatus(jobId, "transcribing", 50, "Transcription complete");

  const raw = transcription as unknown as { text: string; segments?: WhisperSegment[] };

  return {
    text: raw.text,
    segments: raw.segments ?? [],
  };
}

// ---------------------------------------------------------------------------
// Step 3 — Identify viral moments
// ---------------------------------------------------------------------------

const VIRAL_MOMENTS_PROMPT = `You are an expert short-form video editor specializing in viral content.
Analyze the transcript below and identify the 5-8 most engaging, viral-worthy moments.

RULES:
- Each clip MUST be between 15 and 90 seconds long (end - start >= 15 and end - start <= 90).
- Timestamps must be in SECONDS as floating-point numbers.
- Return ONLY a valid JSON array with no markdown, no explanation, no code fences.
- Each element must have EXACTLY these fields:
  {
    "start": <float>,
    "end": <float>,
    "title": <string>,
    "reason": <string>,
    "score": <integer 0-100>,
    "hook": <string>,
    "emotionScore": <integer 0-100>,
    "hashtags": <array of 5-7 strings>
  }
- "score" represents virality potential (0 = low, 100 = extremely viral).
- "hook" is a short description of the opening hook technique used in the clip (e.g., "Rhetorical question that creates curiosity", "Surprising statistic reveal", "Bold controversial statement").
- "emotionScore" represents the emotional energy/intensity of the moment (0 = calm/dry, 100 = extremely emotional/energetic).
- "hashtags" must be an array of 5-7 relevant hashtags for that specific clip, WITHOUT the # symbol (e.g., ["marketing", "viral", "tips", "entrepreneurship", "mindset"]).
- Prioritize: surprising insights, emotional peaks, strong opinions, story climaxes, quotable statements.
- Do NOT overlap clips. Sort by start time ascending.

TRANSCRIPT:
`;

export async function identifyViralMoments(
  transcript: string,
  jobId: string
): Promise<ViralMoment[]> {
  await updateJobStatus(jobId, "analyzing", 55, "Identifying viral moments with GPT-4o…");

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: VIRAL_MOMENTS_PROMPT + transcript,
      },
    ],
    temperature: 0.4,
    max_tokens: 2048,
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";

  let moments: ViralMoment[];
  try {
    moments = JSON.parse(raw) as ViralMoment[];
  } catch {
    // Attempt to extract JSON array from the response even if there is extra text
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("GPT-4o returned invalid JSON for viral moments");
    moments = JSON.parse(match[0]) as ViralMoment[];
  }

  // Validate and clamp moments, filling in defaults for new fields
  const valid = moments.map(m => ({
    ...m,
    hook: m.hook ?? "",
    emotionScore: m.emotionScore ?? 50,
    hashtags: Array.isArray(m.hashtags) ? m.hashtags : [],
  })).filter(
    (m) =>
      typeof m.start === "number" &&
      typeof m.end === "number" &&
      m.end - m.start >= 15 &&
      m.end - m.start <= 90
  );

  await updateJobStatus(jobId, "analyzing", 65, `Found ${valid.length} viral moments`);

  return valid;
}

// ---------------------------------------------------------------------------
// Step 4 — VTT generation
// ---------------------------------------------------------------------------

function toVttTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  // toFixed(3) gives "SS.mmm"; pad integer part to 2 digits
  const ss = s.toFixed(3).padStart(6, "0");
  return `${hh}:${mm}:${ss}`;
}

function generateVtt(
  segments: WhisperSegment[],
  clipStart: number,
  clipEnd: number
): string {
  const duration = clipEnd - clipStart;

  const relevant = segments.filter(
    (seg) => seg.end > clipStart && seg.start < clipEnd
  );

  let vtt = "WEBVTT\n\n";

  relevant.forEach((seg, idx) => {
    const start = Math.max(0, seg.start - clipStart);
    const end = Math.min(duration, seg.end - clipStart);
    vtt += `${idx + 1}\n`;
    vtt += `${toVttTime(start)} --> ${toVttTime(end)}\n`;
    vtt += `${seg.text.trim()}\n\n`;
  });

  return vtt;
}

// ---------------------------------------------------------------------------
// Step 4 — Reframe clips
// ---------------------------------------------------------------------------

export function reframeClip(
  inputPath: string,
  outputPath: string,
  ratio: "9:16" | "1:1" | "16:9"
): Promise<void> {
  return new Promise((resolve, reject) => {
    let cmd = ffmpeg(inputPath);

    if (ratio === "9:16") {
      cmd = cmd.outputOptions([
        "-vf",
        "scale=-2:1280,crop=720:1280",
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-preset",
        "fast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
      ]);
    } else if (ratio === "1:1") {
      cmd = cmd.outputOptions([
        "-vf",
        "crop=ih:ih:(iw-ih)/2:0,scale=1080:1080",
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-preset",
        "fast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
      ]);
    } else {
      // 16:9 — scale to 1280x720, no crop needed for landscape input
      cmd = cmd.outputOptions([
        "-vf",
        "scale=1280:720",
        "-c:v",
        "libx264",
        "-crf",
        "23",
        "-preset",
        "fast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
      ]);
    }

    cmd
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });
}

// ---------------------------------------------------------------------------
// Step 4 — Extract thumbnail
// ---------------------------------------------------------------------------

export async function extractThumbnail(
  clipPath: string,
  clipId: string,
  jobId: string,
  durationSecs: number
): Promise<string> {
  const pubJobDir = publicJobDir(jobId);
  const thumbPath = path.join(pubJobDir, `${clipId}_thumb.jpg`);
  const midpoint = durationSecs / 2;

  await new Promise<void>((resolve) => {
    ffmpeg(clipPath)
      .setStartTime(midpoint)
      .frames(1)
      .outputOptions(["-q:v 2"])
      .output(thumbPath)
      .on("end", () => resolve())
      .on("error", () => resolve()) // don't fail the whole pipeline for a thumbnail
      .run();
  });

  return fs.existsSync(thumbPath) ? `/clips/${jobId}/${clipId}_thumb.jpg` : "";
}

// ---------------------------------------------------------------------------
// Step 4 — Remove filler words from segments
// ---------------------------------------------------------------------------

const FILLER_WORDS = [
  "um", "uh", "eh", "ah", "er", "like", "you know", "i mean",
  "basically", "literally", "actually", "so", "well", "right", "okay",
  "o sea", "este", "bueno", "pues", "como que", "o sea que",
];

function removeFillersFromSegments(
  segments: WhisperSegment[],
  clipStart: number,
  clipEnd: number
): { cleanSegments: WhisperSegment[]; fillerCount: number } {
  const relevant = segments.filter(s => s.end > clipStart && s.start < clipEnd);
  let fillerCount = 0;
  const cleanSegments = relevant.filter(seg => {
    const text = seg.text.trim().toLowerCase().replace(/[.,!?]/g, "");
    const isFiller = FILLER_WORDS.some(
      f => text === f || text === f + " " || text.split(" ").every(w => FILLER_WORDS.includes(w))
    );
    if (isFiller) { fillerCount++; return false; }
    return true;
  });
  return { cleanSegments, fillerCount };
}

// ---------------------------------------------------------------------------
// Step 4 — Cut clips (base helper)
// ---------------------------------------------------------------------------

export function cutClip(
  videoPath: string,
  start: number,
  end: number,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .setStartTime(start)
      .setDuration(end - start)
      .outputOptions(["-c copy"])
      .output(outputPath)
      .on("end", () => resolve())
      .on("error", (err: Error) => reject(err))
      .run();
  });
}

export async function cutClips(
  videoPath: string,
  moments: ViralMoment[],
  segments: WhisperSegment[],
  jobId: string
): Promise<Clip[]> {
  await updateJobStatus(jobId, "cutting", 70, "Cutting clips…");

  const tmpClipsDir = clipsDir(jobId);
  const pubJobDir = publicJobDir(jobId);

  fs.mkdirSync(tmpClipsDir, { recursive: true });
  fs.mkdirSync(pubJobDir, { recursive: true });

  const clips: Clip[] = [];
  const total = moments.length;

  for (let i = 0; i < total; i++) {
    const moment = moments[i];
    const clipId = uuidv4();

    // 1. Cut base clip (16:9, stream copy — fast)
    const baseTmpPath = path.join(tmpClipsDir, `${clipId}_base.mp4`);
    await cutClip(videoPath, moment.start, moment.end, baseTmpPath);

    // 2. Generate and save WebVTT captions
    const vttString = generateVtt(segments, moment.start, moment.end);
    const vttPubPath = path.join(pubJobDir, `${clipId}.vtt`);
    fs.writeFileSync(vttPubPath, vttString, "utf-8");

    // 3. Produce the 3 format variants
    const formatDefs: Array<{ ratio: "9:16" | "1:1" | "16:9"; label: string; suffix: string }> = [
      { ratio: "9:16", label: "TikTok / Reels", suffix: "9x16" },
      { ratio: "1:1",  label: "Instagram",       suffix: "1x1"  },
      { ratio: "16:9", label: "YouTube / LinkedIn", suffix: "16x9" },
    ];

    const formats: ClipFormat[] = [];

    for (const def of formatDefs) {
      const tmpOut = path.join(tmpClipsDir, `${clipId}_${def.suffix}.mp4`);
      await reframeClip(baseTmpPath, tmpOut, def.ratio);

      const pubFileName = `${clipId}_${def.suffix}.mp4`;
      const pubOut = path.join(pubJobDir, pubFileName);
      fs.copyFileSync(tmpOut, pubOut);

      formats.push({
        ratio: def.ratio,
        label: def.label,
        videoUrl: `/clips/${jobId}/${pubFileName}`,
      });
    }

    // 4. Remove filler words and extract clean transcript for this clip
    const clipDuration = moment.end - moment.start;
    const { cleanSegments, fillerCount } = removeFillersFromSegments(segments, moment.start, moment.end);
    const clipTranscript = cleanSegments.map((seg) => seg.text.trim()).join(" ");

    // 5. Extract thumbnail from the base clip
    const thumbnailUrl = await extractThumbnail(baseTmpPath, clipId, jobId, clipDuration);

    const progress = 70 + Math.round(((i + 1) / total) * 25);
    await updateJobStatus(
      jobId,
      "cutting",
      progress,
      `Cut clip ${i + 1} of ${total}`
    );

    // The default videoUrl uses the 16:9 format for backward compatibility
    const defaultFormat = formats.find((f) => f.ratio === "16:9");

    clips.push({
      id: clipId,
      title: moment.title,
      start: moment.start,
      end: moment.end,
      duration: Math.round(clipDuration * 10) / 10,
      transcript: clipTranscript,
      reason: moment.reason,
      score: moment.score,
      videoUrl: defaultFormat?.videoUrl ?? `/clips/${jobId}/${clipId}_16x9.mp4`,
      thumbnailUrl,
      captionsUrl: `/clips/${jobId}/${clipId}.vtt`,
      formats,
      hook: moment.hook,
      emotionScore: moment.emotionScore,
      hashtags: moment.hashtags.map(t => t.startsWith("#") ? t : `#${t}`),
      fillerWordsRemoved: fillerCount,
    });
  }

  return clips;
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export async function processVideo(jobId: string, url: string): Promise<void> {
  try {
    // 1. Download
    const videoPath = await downloadVideo(url, jobId);

    // 2. Transcribe — now returns { text, segments }
    const { text: transcript, segments } = await transcribeVideo(videoPath, jobId);

    // 3. Identify viral moments
    const moments = await identifyViralMoments(transcript, jobId);

    // 4. Cut clips (pass segments for VTT + transcript extraction)
    const clips = await cutClips(videoPath, moments, segments, jobId);

    // Done
    updateJob(jobId, {
      status: "done",
      progress: 100,
      message: `Done — ${clips.length} clips ready`,
      clips,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    updateJob(jobId, {
      status: "error",
      message: "Processing failed",
      error: message,
    });
  }
}
