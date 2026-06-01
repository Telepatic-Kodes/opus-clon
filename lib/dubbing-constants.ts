// Client-safe constants for dubbing — no Node.js imports

export interface SupportedLanguage {
  code: string;
  label: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "ENGLISH",    flag: "🇺🇸" },
  { code: "pt", label: "PORTUGUÊS",  flag: "🇧🇷" },
  { code: "fr", label: "FRANÇAIS",   flag: "🇫🇷" },
  { code: "de", label: "DEUTSCH",    flag: "🇩🇪" },
  { code: "it", label: "ITALIANO",   flag: "🇮🇹" },
  { code: "ja", label: "日本語",      flag: "🇯🇵" },
];
