import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, SESSION_COOKIE, sessionToken, WRITE_COOKIE, WRITE_LOCKED_CODE, writeLockEnabled, writeToken } from "@/lib/auth";

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export async function proxy(request: NextRequest) {
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (authEnabled() && request.cookies.get(SESSION_COOKIE)?.value !== (await sessionToken())) {
    if (isApi) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const login = new URL("/entrar", request.url);
    login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
  }

  if (isApi && writeLockEnabled() && !READ_METHODS.has(request.method) && request.cookies.get(WRITE_COOKIE)?.value !== (await writeToken())) {
    return NextResponse.json({ error: "Digite a senha para alterar dados", code: WRITE_LOCKED_CODE }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!entrar|api/auth|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
