import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===================================================================== */

const API_BASE = (process.env.API_URL || "https://api.chezrheyy.xyz").replace(/\/$/, "");
const RELAY_SECRET = "tg_relay_sec_9f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c";

/* ===================================================================== */

async function handle(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const subPath = resolved.path ? resolved.path.join("/") : "";
  const targetUrl = `${API_BASE}/${subPath}${request.nextUrl.search}`;

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

  headers.set("X-Telegram-Relay", RELAY_SECRET);
  headers.set("X-Auth-Role", "TELEGRAM_RELAY");
  headers.set("X-User-Email", "telegram@chezrheyy.xyz");

  const tgInitData = incomingHeaders.get("x-telegram-init-data");
  if (tgInitData) headers.set("x-telegram-init-data", tgInitData);

  try {
    const res = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
    });

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
    return NextResponse.json(
      { detail: "Erreur de connexion au serveur backend" },
      { status: 502 }
    );
  }
}

/* ===================================================================== */

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handle(request, context);
}
