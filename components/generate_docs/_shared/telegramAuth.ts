/* ===================================================================== */

export function getTelegramInitData(): string {
  if (typeof window === "undefined") return "";
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.initData) return tg.initData;
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("tgWebAppData") || searchParams.get("initData") || searchParams.get("init_data") || "";
  } catch {
    return "";
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const initData = getTelegramInitData();
  const headers: Record<string, string> = { ...extraHeaders };
  if (initData) {
    headers["x-telegram-init-data"] = initData;
  }
  return headers;
}
