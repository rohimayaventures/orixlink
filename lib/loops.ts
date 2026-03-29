import { LoopsClient } from "loops";

if (!process.env.LOOPS_API_KEY) {
  console.warn(
    "LOOPS_API_KEY is not set -- Loops marketing emails will not work"
  );
}

export const loops: LoopsClient | null = process.env.LOOPS_API_KEY
  ? new LoopsClient(process.env.LOOPS_API_KEY)
  : null;
