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

  return NextResponse.next();
}

export const middleware = proxy;

/* ===================================================================== */

export const config = {
  matcher: [
    "/api/proxy/:path*",
  ],
};
