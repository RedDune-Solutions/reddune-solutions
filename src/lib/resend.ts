import "server-only";
import { Resend } from "resend";
import { serverEnv } from "@/lib/env";

let cached: Resend | null = null;

export function getResend(): Resend {
  if (!cached) {
    cached = new Resend(serverEnv.RESEND_API_KEY);
  }
  return cached;
}
