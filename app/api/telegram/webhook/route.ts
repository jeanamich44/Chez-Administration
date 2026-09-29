import { NextRequest, NextResponse } from "next/server";

/* ===================================================================== */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===================================================================== */

const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || "https://backend-app-eas7.onrender.com";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "c8b9f1d0a83e47229b12480ad2e08e6f";

/* ===================================================================== */

export async function POST(request: NextRequest) {
  const incomingSecretToken = request.headers.get("x-telegram-bot-api-secret-token");

  if (!incomingSecretToken || incomingSecretToken !== INTERNAL_SECRET) {
    return new Response(null, { status: 444 });
  }

  try {
    const rawBody = await request.text();
    const targetUrl = `${BACKEND_URL}/api/telegram/webhook`;

    const headers = new Headers();
    headers.set("content-type", "application/json");
    headers.set("user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
    headers.set("X-Internal-Secret", INTERNAL_SECRET);
    headers.set("X-Telegram-Bot-Api-Secret-Token", incomingSecretToken);

    const res = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: rawBody,
    });

    const resBody = await res.arrayBuffer();
    const resHeaders = new Headers();
    const resContentType = res.headers.get("content-type") || "application/json";
    resHeaders.set("content-type", resContentType);
    resHeaders.set("Cache-Control", "no-store, no-cache, must-revalidate, private");

    return new NextResponse(resBody, {
      status: res.status,
      headers: resHeaders,
    });
  } catch {
    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "content-type": "application/json" }
    });
  }
}

/* ===================================================================== */

export async function GET() {
  return new Response(null, { status: 444 });
}
