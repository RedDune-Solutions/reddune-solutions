import "server-only";

// Server-side verification of a Cloudflare Turnstile token.
//
// When TURNSTILE_SECRET_KEY is not set the check is skipped (returns true), so
// the site keeps working before the keys are provisioned. Once the secret is
// set, a missing/invalid token is rejected.

const SECRET = process.env.TURNSTILE_SECRET_KEY;
const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(
  token: string | null,
  ip?: string
): Promise<boolean> {
  if (!SECRET) return true; // Not configured yet — do not block.
  if (!token) return false;

  try {
    const form = new URLSearchParams();
    form.append("secret", SECRET);
    form.append("response", token);
    if (ip && ip !== "unknown") form.append("remoteip", ip);

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      cache: "no-store",
    });

    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (e) {
    console.error("Turnstile verification error:", e);
    return false;
  }
}
