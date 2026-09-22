import { NextRequest, NextResponse } from "next/server";

/* ===================================================================== */

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /* ===================================================================== */

  if (pathname.startsWith("/api/proxy")) {
    const tgInitData = request.headers.get("x-telegram-init-data");
    if (!tgInitData || !tgInitData.trim()) {
      return new NextResponse(null, { status: 404 });
    }
    return NextResponse.next();
  }

  /* ===================================================================== */

  const searchParams = request.nextUrl.searchParams;
  const hasTelegramInit =
    request.headers.get("x-telegram-init-data") ||
    searchParams.has("tgWebAppData") ||
    searchParams.has("initData") ||
    searchParams.has("tgWebAppPlatform");

  if (!hasTelegramInit) {
    return new NextResponse(null, { status: 404 });
  }

  /* ===================================================================== */

  return NextResponse.next();
}

export const middleware = proxy;

/* ===================================================================== */

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
