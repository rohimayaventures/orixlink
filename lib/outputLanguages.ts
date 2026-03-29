export type ClinicalTier = "high" | "moderate" | "low";

export type LanguageEntry = {
  value: string;
  label: string;
  clinicalTier: ClinicalTier;
};

/** ISO-style codes as values; labels for the UI dropdown. */
export const LANGUAGES: LanguageEntry[] = [
  { value: "en", label: "English", clinicalTier: "high" },
  { value: "es", label: "Spanish (Español)", clinicalTier: "high" },
  { value: "fr", label: "French (Français)", clinicalTier: "high" },
  { value: "pt", label: "Portuguese (Português)", clinicalTier: "high" },
  { value: "zh", label: "Mandarin Chinese (中文)", clinicalTier: "high" },
  { value: "ar", label: "Arabic (العربية)", clinicalTier: "high" },
  { value: "hi", label: "Hindi (हिन्दी)", clinicalTier: "high" },
  { value: "vi", label: "Vietnamese (Tiếng Việt)", clinicalTier: "moderate" },
  { value: "tl", label: "Tagalog (Filipino)", clinicalTier: "moderate" },
  { value: "ht", label: "Haitian Creole (Kreyòl ayisyen)", clinicalTier: "low" },
  { value: "so", label: "Somali (Soomaali)", clinicalTier: "low" },
  { value: "am", label: "Amharic (አማርኛ)", clinicalTier: "low" },
];

export const TIER_COPY: Record<"moderate" | "low", string> = {
  moderate:
    "Medical terminology in this language may need confirmation from a qualified professional.",
  low: "Clinical wording in this language may be less precise. Use this assessment to prepare for care and always confirm urgency with a clinician or emergency services.",
};

/** Shown when urgency is ED-now and response language is low-tier (never rely on translation alone). */
export const EMERGENCY_ENGLISH_DUPLICATE =
  "Emergency (English): Call 911 (or your local emergency number) or go to the nearest emergency department now. Do not wait.";

export const DEFAULT_LANGUAGE_CODE = "en";

/** Full language name for the model (Claude context). */
export const LANGUAGE_PROMPT_NAMES: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  pt: "Portuguese",
  zh: "Mandarin Chinese",
  ar: "Arabic",
  hi: "Hindi",
  vi: "Vietnamese",
  tl: "Tagalog",
  ht: "Haitian Creole",
  so: "Somali",
  am: "Amharic",
};

const LEGACY_LANGUAGE_ALIASES: Record<string, string> = {
  English: "en",
  Español: "es",
  "中文": "zh",
  Français: "fr",
  Português: "pt",
  العربية: "ar",
};

export function getLanguageEntry(code: string): LanguageEntry | undefined {
  return LANGUAGES.find((l) => l.value === code);
}

export function getClinicalTier(code: string): ClinicalTier {
  return getLanguageEntry(code)?.clinicalTier ?? "high";
}

/** When true, show fixed English emergency text alongside model output (moderate + low response languages). */
export function shouldDuplicateEmergencyInstructionInEnglish(code: string): boolean {
  const t = getClinicalTier(code);
  return t === "moderate" || t === "low";
}

/**
 * Normalize stored `language` from session or API body to a known code.
 * Supports current ISO codes and legacy full-name values from older sessions.
 */
export function resolveLanguageCode(raw: string | undefined | null): string {
  if (raw == null || String(raw).trim() === "") return DEFAULT_LANGUAGE_CODE;
  const t = String(raw).trim();
  if (LANGUAGES.some((l) => l.value === t)) return t;
  const legacy = LEGACY_LANGUAGE_ALIASES[t];
  if (legacy) return legacy;
  const byLabel = LANGUAGES.find(
    (l) =>
      l.label.toLowerCase() === t.toLowerCase() ||
      l.label.toLowerCase().startsWith(t.toLowerCase() + " ")
  );
  return byLabel?.value ?? DEFAULT_LANGUAGE_CODE;
}

export function promptLanguageName(code: string): string {
  const c = resolveLanguageCode(code);
  return LANGUAGE_PROMPT_NAMES[c] ?? "English";
}
