import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===================================================================== */

const API_BASE = "https://api.chezrheyy.xyz";
const RELAY_SECRET = "tg_relay_sec_9f8a2b3c4d5e6f7a8b9c0d1e2f3a4b5c";
const API_SECRET = "c8b9f1d0a83e47229b12480ad2e08e6f";

/* ===================================================================== */

async function handle(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const subPath = pathname.replace(/^\/api\/proxy\/?/, "");
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

  const ua = incomingHeaders.get("user-agent") || "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
  headers.set("user-agent", ua);

  headers.set("X-API-Secret", API_SECRET);
  headers.set("X-Telegram-Relay", RELAY_SECRET);
  headers.set("X-Auth-Role", "TELEGRAM_RELAY");
  headers.set("X-User-Email", "telegram@chezrheyy.xyz");

  const tgInitData = incomingHeaders.get("x-telegram-init-data");
  if (tgInitData) headers.set("x-telegram-init-data", tgInitData);

  try {
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
    };
    if (body && request.method !== "GET" && request.method !== "HEAD") {
      fetchOptions.body = body;
    }

    const res = await fetch(targetUrl, fetchOptions);

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
  } catch (err: any) {
    console.error("[PROXY_ERROR]", targetUrl, err?.message || err);
    return NextResponse.json(
      { detail: err?.message || "Erreur de connexion au serveur backend" },
      { status: 502 }
    );
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

