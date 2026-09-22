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

  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  const referer = (request.headers.get("referer") || "").toLowerCase();
  const searchParams = request.nextUrl.searchParams;

  const isTelegramUserAgent = ua.includes("telegram");
  const isTelegramReferer = referer.includes("telegram.org") || referer.includes("t.me");
  const hasTelegramParams =
    searchParams.has("tgWebAppPlatform") ||
    searchParams.has("tgWebAppVersion") ||
    searchParams.has("tgWebAppData") ||
    searchParams.has("tgWebAppStartParam");

  const isTelegramClient = isTelegramUserAgent || isTelegramReferer || hasTelegramParams;

  if (!isTelegramClient) {
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
