import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_MAX_AGE, sessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { password } = (await request.json().catch(() => ({}))) as { password?: string };
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return Response.json({ error: "Senha incorreta" }, { status: 401 });
  }
  (await cookies()).set(SESSION_COOKIE, await sessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return new Response(null, { status: 204 });
}

export async function DELETE() {
  (await cookies()).delete(SESSION_COOKIE);
  return new Response(null, { status: 204 });
}
