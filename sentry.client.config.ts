import * as Sentry from "@sentry/nextjs";
import {
  beforeSendOrixlink,
  beforeSendTransactionOrixlink,
} from "@/lib/sentryBeforeSend";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
  environment: process.env.NODE_ENV,
  sampleRate: 1.0,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend: beforeSendOrixlink,
  beforeSendTransaction: beforeSendTransactionOrixlink,
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
