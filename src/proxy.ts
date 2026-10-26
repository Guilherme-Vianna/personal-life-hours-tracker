import { NextResponse, type NextRequest } from "next/server";
import { authEnabled, SESSION_COOKIE, sessionToken } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  if (!authEnabled()) return NextResponse.next();
  if (request.cookies.get(SESSION_COOKIE)?.value === (await sessionToken())) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const login = new URL("/entrar", request.url);
  login.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!entrar|api/auth|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
