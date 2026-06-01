// Client-safe constants for music — no Node.js imports

export interface MusicTrack {
  id: number;
  title: string;
  duration: number;
  url: string;
  tags: string;
  mood?: string;
}

export interface MusicMood {
  id: string;
  label: string;
  emoji: string;
}

export const MUSIC_MOODS: MusicMood[] = [
  { id: "upbeat",    label: "ENERGÉTICO",  emoji: "⚡" },
  { id: "calm",      label: "RELAJADO",    emoji: "🌊" },
  { id: "dramatic",  label: "DRAMÁTICO",   emoji: "🎭" },
  { id: "happy",     label: "FELIZ",       emoji: "☀️" },
  { id: "corporate", label: "CORPORATIVO", emoji: "💼" },
];

export const CURATED_TRACKS: MusicTrack[] = [
  { id: 1, title: "Upbeat Corporate",  duration: 120, url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0b6b39710.mp3", tags: "upbeat corporate",  mood: "upbeat" },
  { id: 2, title: "Calm Piano",        duration: 180, url: "https://cdn.pixabay.com/download/audio/2022/04/27/audio_1e2e95f1c9.mp3", tags: "calm piano",        mood: "calm" },
  { id: 3, title: "Epic Dramatic",     duration:  90, url: "https://cdn.pixabay.com/download/audio/2021/08/08/audio_dc39bede17.mp3", tags: "dramatic epic",     mood: "dramatic" },
  { id: 4, title: "Happy Vibes",       duration: 150, url: "https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3", tags: "happy positive",    mood: "happy" },
  { id: 5, title: "Corporate Modern",  duration: 120, url: "https://cdn.pixabay.com/download/audio/2022/08/02/audio_884fe92c21.mp3", tags: "corporate modern",  mood: "corporate" },
];
