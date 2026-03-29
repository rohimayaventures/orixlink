const ANON_USED_KEY = "orixlink_anon_used";
const LAST_SESSION_KEY = "orixlink_last_session";

export type AnonSessionPayload = {
  role: string;
  context: string;
  language: string;
  patientAge?: string;
  symptoms?: string;
  assistantResponse?: string;
  messages?: { role: string; content: string }[];
  urgencyLevel?: string | null;
};

export function hasUsedAnonAssessment(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ANON_USED_KEY) === "true";
}

export function markAnonAssessmentUsed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ANON_USED_KEY, "true");
}

export function getAnonSessionData(): AnonSessionPayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(LAST_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AnonSessionPayload;
  } catch {
    return null;
  }
}

export function setAnonSessionData(data: AnonSessionPayload): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(LAST_SESSION_KEY, JSON.stringify(data));
}

export function clearAnonSessionData(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(LAST_SESSION_KEY);
}
