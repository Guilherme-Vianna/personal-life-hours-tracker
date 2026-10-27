import { cookies } from "next/headers";
import { WRITE_COOKIE, WRITE_MAX_AGE, writeToken } from "@/lib/auth";

export async function POST(request: Request) {
  const { pin } = (await request.json().catch(() => ({}))) as { pin?: string };
  if (!process.env.WRITE_PIN || pin !== process.env.WRITE_PIN) {
    // Slows down guessing a short numeric PIN.
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return Response.json({ error: "Senha incorreta" }, { status: 401 });
  }
  (await cookies()).set(WRITE_COOKIE, await writeToken(), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WRITE_MAX_AGE,
  });
  return new Response(null, { status: 204 });
}

export async function DELETE() {
  (await cookies()).delete(WRITE_COOKIE);
  return new Response(null, { status: 204 });
}
