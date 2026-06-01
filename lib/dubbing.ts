// ElevenLabs Speech-to-Speech dubbing
// Env var: ELEVENLABS_API_KEY

export interface DubbingJob {
  clipId: string;
  sourceLanguage: string;
  targetLanguage: string;
  voiceId: string;
  status: "pending" | "processing" | "done" | "error";
  outputUrl?: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: "en", label: "ENGLISH", flag: "🇺🇸" },
  { code: "pt", label: "PORTUGUÊS", flag: "🇧🇷" },
  { code: "fr", label: "FRANÇAIS", flag: "🇫🇷" },
  { code: "de", label: "DEUTSCH", flag: "🇩🇪" },
  { code: "it", label: "ITALIANO", flag: "🇮🇹" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
];

export const DEFAULT_VOICES: Record<string, string> = {
  en: "21m00Tcm4TlvDq8ikWAM", // Rachel
  pt: "AZnzlk1XvdvUeBnXmlld", // Domi
  fr: "EXAVITQu4vr4xnSDxMaL", // Bella
  de: "ErXwobaYiN019PkySvjV", // Antoni
  it: "MF3mGyEYCl7XYWbV9V6O", // Elli
  ja: "pNInz6obpgDQGcFmaJgB", // Adam
};

export async function dubClipAudio(
  audioPath: string,
  targetLanguage: string,
  apiKey: string
): Promise<Buffer> {
  const voiceId = DEFAULT_VOICES[targetLanguage] ?? DEFAULT_VOICES.en;

  // Read the audio file
  const fs = await import("fs");
  const audioBuffer = fs.readFileSync(audioPath);
  const audioBlob = new Blob([audioBuffer], { type: "audio/mpeg" });

  const formData = new FormData();
  formData.append("audio", audioBlob, "audio.mp3");
  formData.append("model_id", "eleven_multilingual_v2");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/speech-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
