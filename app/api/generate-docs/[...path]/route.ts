import { NextRequest, NextResponse } from "next/server";

// ----------------------------------------------------
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ----------------------------------------------------
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "8975205210:AAGJk1d4QZaiQ8ZLTAC08blsj63yfbyD7WI";
const BACKEND_URL = (process.env.API_URL || "https://api.chezrheyy.xyz").replace(/\/$/, "");

// ----------------------------------------------------
async function handleProxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolved = await params;
  const subPath = resolved.path ? resolved.path.join("/") : "";
  const targetUrl = `${BACKEND_URL}/generate-docs/${subPath}${request.nextUrl.search}`;

  const forwardHeaders: Record<string, string> = {
    "accept": request.headers.get("accept") || "*/*"
  };

  const contentType = request.headers.get("content-type");
  if (contentType) {
    forwardHeaders["content-type"] = contentType;
  }

  const tgInitData = request.headers.get("x-telegram-init-data");
  if (tgInitData) {
    forwardHeaders["x-telegram-init-data"] = tgInitData;
  }

  let body: BodyInit | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    try {
      body = await request.text();
    } catch {
      body = undefined;
    }
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: forwardHeaders,
      body: body
    });

    const responseHeaders = new Headers();
    const contentTypeRes = upstreamResponse.headers.get("content-type");
    if (contentTypeRes) {
      responseHeaders.set("content-type", contentTypeRes);
    }
    const contentDisposition = upstreamResponse.headers.get("content-disposition");
    if (contentDisposition) {
      responseHeaders.set("content-disposition", contentDisposition);
    }

    const resBuffer = await upstreamResponse.arrayBuffer();

    const sendToTelegram = request.headers.get("x-send-to-telegram");
    const tgUserId = request.headers.get("x-telegram-user-id");

    if (sendToTelegram === "true" && tgUserId && contentTypeRes?.includes("application/pdf")) {
      try {
        const formData = new FormData();
        const blob = new Blob([resBuffer], { type: "application/pdf" });
        formData.append("chat_id", tgUserId);
        formData.append("document", blob, "document_officiel.pdf");
        formData.append("caption", "Voici votre document généré avec succès.");

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`, {
          method: "POST",
          body: formData
        });
      } catch {}
    }

    return new NextResponse(resBuffer, {
      status: upstreamResponse.status,
      headers: responseHeaders
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Erreur de communication avec le serveur backend", details: err?.message },
      { status: 502 }
    );
  }
}

// ----------------------------------------------------
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, context);
}
