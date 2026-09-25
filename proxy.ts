import { NextRequest, NextResponse } from "next/server";

/* ===================================================================== */

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /* ===================================================================== */

  if (pathname.startsWith("/api/proxy")) {
    if (pathname === "/api/proxy/admin/login") {
      return NextResponse.next();
    }

    const authHeader = request.headers.get("authorization");
    if (pathname.startsWith("/api/proxy/admin") && authHeader && authHeader.startsWith("Bearer ")) {
      return NextResponse.next();
    }

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
