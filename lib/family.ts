import { randomUUID } from "crypto";

export const FAMILY_MAX_MEMBERS = 6;

/** 8-char uppercase code for family invites (not globally guaranteed unique without DB check). */
export function generateInviteCode(): string {
  return randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

export function normalizeInviteEmail(email: string): string {
  return email.trim().toLowerCase();
}
