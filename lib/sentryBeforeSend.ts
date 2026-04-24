import type { ErrorEvent, TransactionEvent } from "@sentry/core";

const ASSESS_API = "/api/assess";

function touchesAssessRoute(event: {
  request?: { url?: string };
  transaction?: string;
}): boolean {
  const url = event.request?.url;
  if (typeof url === "string" && url.includes(ASSESS_API)) return true;
  const tx = event.transaction;
  if (typeof tx === "string" && tx.includes("assess")) return true;
  return false;
}

function scrubAssessEvent(event: ErrorEvent | TransactionEvent): void {
  if (!touchesAssessRoute(event)) return;

  if (event.request) {
    delete event.request.data;
    delete event.request.query_string;
    delete event.request.cookies;
  }
  if (event.breadcrumbs) {
    for (const crumb of event.breadcrumbs) {
      const u = crumb.data && typeof crumb.data === "object" && "url" in crumb.data
        ? String((crumb.data as { url?: unknown }).url ?? "")
        : "";
      if (u.includes(ASSESS_API) || crumb.message?.includes(ASSESS_API)) {
        crumb.data = { url: ASSESS_API, note: "omitted" };
        crumb.message = "assess request (metadata omitted)";
      }
    }
  }
  if (event.extra) {
    for (const key of Object.keys(event.extra)) {
      if (/body|payload|message|input|content|raw/i.test(key)) {
        delete event.extra[key];
      }
    }
  }
}

export function beforeSendOrixlink(event: ErrorEvent): ErrorEvent | null {
  scrubAssessEvent(event);
  return event;
}

export function beforeSendTransactionOrixlink(
  event: TransactionEvent
): TransactionEvent | null {
  scrubAssessEvent(event);
  return event;
}
