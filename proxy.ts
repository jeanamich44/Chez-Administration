import { NextRequest, NextResponse } from "next/server";

/* ===================================================================== */

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  /* ===================================================================== */

  if (pathname.startsWith("/api/admin") || pathname.startsWith("/api/proxy/admin")) {
    if (pathname === "/api/admin/login" || pathname === "/api/proxy/admin/login") {
      return NextResponse.next();
    }

    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return NextResponse.next();
    }

    const tgInitData = request.headers.get("x-telegram-init-data");
    if (tgInitData && tgInitData.trim()) {
      return NextResponse.next();
    }

    return new NextResponse(null, { status: 404 });
  }

  /* ===================================================================== */

  if (pathname.startsWith("/api/proxy")) {
    const qInitData = request.nextUrl.searchParams.get("initData") || request.nextUrl.searchParams.get("init_data");
    const qAuth = request.nextUrl.searchParams.get("auth") || request.nextUrl.searchParams.get("token");
    const authHeader = request.headers.get("authorization");
    const tgInitData = request.headers.get("x-telegram-init-data");

    if (
      (!tgInitData || !tgInitData.trim()) &&
      (!qInitData || !qInitData.trim()) &&
      (!authHeader || !authHeader.trim()) &&
      (!qAuth || !qAuth.trim())
    ) {
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
    "/api/admin/:path*",
  ],
};
