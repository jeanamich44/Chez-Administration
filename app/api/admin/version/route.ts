import { NextRequest, NextResponse } from "next/server";

/* ===================================================================== */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===================================================================== */

const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || "https://backend-app-eas7.onrender.com";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "c8b9f1d0a83e47229b12480ad2e08e6f";

/* ===================================================================== */

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const tgInitData = request.headers.get("x-telegram-init-data");

  if (!authHeader && !tgInitData) {
    return new Response(null, { status: 444 });
  }

  let renderData = { status: "unknown", commit: "unknown", commit_date: "", boot_time: "" };
  try {
    const headers = new Headers();
    headers.set("X-Internal-Secret", INTERNAL_SECRET);
    if (authHeader) headers.set("authorization", authHeader);

    const res = await fetch(`${BACKEND_URL}/api/admin/version`, {
      method: "GET",
      headers,
    });
    if (res.ok) {
      renderData = await res.json();
    }
  } catch {
    renderData = { status: "offline", commit: "unknown", commit_date: "", boot_time: "" };
  }

  return NextResponse.json({
    vercel: {
      status: "online",
      commit: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT || "unknown",
      commitDate: process.env.NEXT_PUBLIC_VERCEL_GIT_DATE || "",
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || ""
    },
    render: renderData
  });
}
