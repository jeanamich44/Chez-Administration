import { NextRequest, NextResponse } from "next/server";

/* ===================================================================== */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===================================================================== */

const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || "https://backend-app-eas7.onrender.com";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "c8b9f1d0a83e47229b12480ad2e08e6f";

/* ===================================================================== */

async function handle(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  let subPath = pathname.replace(/^\/api\/proxy\/?/, "");
  if (!subPath.startsWith("api/")) {
    subPath = `api/${subPath}`;
  }
  const targetUrl = `${BACKEND_URL}/${subPath}${request.nextUrl.search}`;

  let body: ArrayBuffer | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.arrayBuffer();
    } catch {
      body = undefined;
    }
  }

  const incomingHeaders = request.headers;
  const headers = new Headers();

  const contentType = incomingHeaders.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  const ua = incomingHeaders.get("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
  headers.set("user-agent", ua);

  if (INTERNAL_SECRET) {
    headers.set("X-Internal-Secret", INTERNAL_SECRET);
  }

  const tgInitData = incomingHeaders.get("x-telegram-init-data");
  const authHeader = incomingHeaders.get("authorization");
  const isLoginRoute = subPath === "api/admin/login";

  if (!isLoginRoute && !tgInitData && !authHeader) {
    return new Response(null, { status: 444 });
  }

  if (tgInitData) headers.set("x-telegram-init-data", tgInitData);
  if (authHeader) headers.set("authorization", authHeader);

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };
    if (body && request.method !== "GET" && request.method !== "HEAD") {
      fetchOptions.body = body;
    }

    const res = await fetch(targetUrl, fetchOptions);

    if (res.status === 444) {
      return new Response(null, { status: 444 });
    }

    const resHeaders = new Headers();
    const resContentType = res.headers.get("content-type");
    const resContentDisposition = res.headers.get("content-disposition");
    if (resContentType) resHeaders.set("content-type", resContentType);
    if (resContentDisposition) resHeaders.set("content-disposition", resContentDisposition);
    resHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    const resBody = await res.arrayBuffer();
    return new NextResponse(resBody, {
      status: res.status,
      headers: resHeaders,
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}

/* ===================================================================== */

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

export async function PUT(request: NextRequest) {
  return handle(request);
}

export async function DELETE(request: NextRequest) {
  return handle(request);
}
