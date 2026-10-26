export const SESSION_COOKIE = "hours_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90;

export function authEnabled() {
  return Boolean(process.env.APP_PASSWORD);
}

export async function sessionToken() {
  const data = new TextEncoder().encode(`${process.env.APP_PASSWORD}:${process.env.AUTH_SECRET ?? "life-hours"}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function safeNextPath(next: string | null | undefined) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}
