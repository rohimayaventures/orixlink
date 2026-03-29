/** Parse URGENCY_LEVEL from OrixLink assessment text (matches frontend parser). */
export function parseUrgencyFromAssessmentText(text: string): string | null {
  if (text.includes("EMERGENCY_DEPARTMENT_NOW")) return "EMERGENCY_DEPARTMENT_NOW";
  if (text.includes("URGENT_CARE")) return "URGENT_CARE";
  if (text.includes("CONTACT_DOCTOR_TODAY")) return "CONTACT_DOCTOR_TODAY";
  if (text.includes("MONITOR_AT_HOME")) return "MONITOR_AT_HOME";
  return null;
}
