import { Resend } from "resend";

// Validated at startup in lib/env.ts

export const resend = new Resend(process.env.RESEND_API_KEY!);
