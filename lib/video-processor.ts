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
import type { Clip, ViralMoment } from "@/types";

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
// Helpers
// ---------------------------------------------------------------------------

function tmpDir(jobId: string): string {
  return path.join("/tmp", "opus_clon", jobId);
}

function clipsDir(jobId: string): string {
  return path.join(tmpDir(jobId), "clips");
}

function publicJobDir(jobId: string): string {
  return path.join(PUBLIC_CLIPS_DIR, jobId);
}

function findVideoFile(jobId: string): string {
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
): Promise<string> {
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

  // verbose_json gives us word-level timestamps when available
  const transcription = await openai.audio.transcriptions.create({
    file: audioStream,
    model: "whisper-1",
    response_format: "verbose_json",
  });

  await updateJobStatus(jobId, "transcribing", 50, "Transcription complete");

  // verbose_json returns an object with a `text` field
  return (transcription as { text: string }).text;
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
- Each element must have exactly these fields:
  { "start": <float>, "end": <float>, "title": <string>, "reason": <string>, "score": <integer 0-100> }
- "score" represents virality potential (0 = low, 100 = extremely viral).
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

  // Validate and clamp moments
  const valid = moments.filter(
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
// Step 4 — Cut clips
// ---------------------------------------------------------------------------

function cutClip(
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
    const tmpClipPath = path.join(tmpClipsDir, `${clipId}.mp4`);
    const pubClipPath = path.join(pubJobDir, `${clipId}.mp4`);

    await cutClip(videoPath, moment.start, moment.end, tmpClipPath);

    // Copy to public/clips/<jobId>/<id>.mp4 so Next.js serves it as static
    fs.copyFileSync(tmpClipPath, pubClipPath);

    const progress = 70 + Math.round(((i + 1) / total) * 25);
    await updateJobStatus(
      jobId,
      "cutting",
      progress,
      `Cut clip ${i + 1} of ${total}`
    );

    clips.push({
      id: clipId,
      title: moment.title,
      start: moment.start,
      end: moment.end,
      duration: Math.round((moment.end - moment.start) * 10) / 10,
      transcript: "",   // could be sliced from verbose_json segments in a future iteration
      reason: moment.reason,
      score: moment.score,
      videoUrl: `/clips/${jobId}/${clipId}.mp4`,
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

    // 2. Transcribe
    const transcript = await transcribeVideo(videoPath, jobId);

    // 3. Identify viral moments
    const moments = await identifyViralMoments(transcript, jobId);

    // 4. Cut clips
    const clips = await cutClips(videoPath, moments, jobId);

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
