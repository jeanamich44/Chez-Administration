import { notFound } from "next/navigation";
import SecretAdminPage from "./SecretAdminContent";

/* ===================================================================== */

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ===================================================================== */

const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || "https://backend-app-eas7.onrender.com";
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "c8b9f1d0a83e47229b12480ad2e08e6f";

/* ===================================================================== */

export default async function DynamicSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug || !slug.trim()) {
    notFound();
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/admin/verify-slug?slug=${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: {
        "X-Internal-Secret": INTERNAL_SECRET,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      notFound();
    }
  } catch {
    notFound();
  }

  return <SecretAdminPage />;
}
