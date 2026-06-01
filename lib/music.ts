// Pixabay free music API — no auth required for some endpoints
export interface MusicTrack {
  id: number;
  title: string;
  duration: number;
  url: string; // audio file URL
  tags: string;
  mood?: string;
}

export const MUSIC_MOODS = [
  { id: "upbeat", label: "ENERGÉTICO", emoji: "⚡" },
  { id: "calm", label: "RELAJADO", emoji: "🌊" },
  { id: "dramatic", label: "DRAMÁTICO", emoji: "🎭" },
  { id: "happy", label: "FELIZ", emoji: "☀️" },
  { id: "corporate", label: "CORPORATIVO", emoji: "💼" },
];

// Curated royalty-free tracks (CC0 / Public Domain)
export const CURATED_TRACKS: MusicTrack[] = [
  {
    id: 1,
    title: "Upbeat Corporate",
    duration: 120,
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0b6b39710.mp3",
    tags: "upbeat corporate",
    mood: "upbeat",
  },
  {
    id: 2,
    title: "Calm Piano",
    duration: 180,
    url: "https://cdn.pixabay.com/download/audio/2022/04/27/audio_1e2e95f1c9.mp3",
    tags: "calm piano",
    mood: "calm",
  },
  {
    id: 3,
    title: "Epic Dramatic",
    duration: 90,
    url: "https://cdn.pixabay.com/download/audio/2021/08/08/audio_dc39bede17.mp3",
    tags: "dramatic epic",
    mood: "dramatic",
  },
  {
    id: 4,
    title: "Happy Vibes",
    duration: 150,
    url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3",
    tags: "happy positive",
    mood: "happy",
  },
  {
    id: 5,
    title: "Corporate Modern",
    duration: 120,
    url: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3",
    tags: "corporate modern",
    mood: "corporate",
  },
];

export async function mixMusicWithClip(
  clipPath: string,
  musicUrl: string,
  outputPath: string,
  volume = 0.15
): Promise<void> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);
  const FFMPEG = process.env.FFMPEG_PATH ?? "/opt/homebrew/bin/ffmpeg";

  // Download music to temp
  const fs = await import("fs");
  const tmpMusic = `/tmp/aiaiai_music_${Date.now()}.mp3`;

  const res = await fetch(musicUrl);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(tmpMusic, buf);

  try {
    await execAsync(
      `"${FFMPEG}" -i "${clipPath}" -i "${tmpMusic}" ` +
        `-filter_complex "[1:a]volume=${volume}[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]" ` +
        `-map 0:v -map "[aout]" -c:v copy -shortest "${outputPath}" -y`
    );
  } finally {
    try {
      fs.unlinkSync(tmpMusic);
    } catch {
      // ignore cleanup errors
    }
  }
}
