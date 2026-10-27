export const SESSION_COOKIE = "hours_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90;
export const WRITE_COOKIE = "hours_write";
export const WRITE_MAX_AGE = 60 * 10;
export const WRITE_LOCKED_CODE = "write_locked";

export function authEnabled() {
  return Boolean(process.env.APP_PASSWORD);
}

export function writeLockEnabled() {
  return Boolean(process.env.WRITE_PIN);
}

async function sha256(text: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sessionToken() {
  return sha256(`${process.env.APP_PASSWORD}:${process.env.AUTH_SECRET ?? "life-hours"}`);
}

export async function writeToken() {
  return sha256(`write:${process.env.WRITE_PIN}:${process.env.AUTH_SECRET ?? "life-hours"}`);
}

export function safeNextPath(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
