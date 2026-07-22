import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side auth guard for the admin area.
 * Reads the Supabase session from raw cookies (Cloudflare Workers compatible).
 * Redirects to /auth/login with ?redirect=/admin if no session.
 */
export default async function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  // Read cookie header directly — works on any runtime including Edge
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll?.() ?? [];

  // Look for Supabase access token in cookies
  const accessToken = allCookies.find(
    (c) => c.name.includes("sb-__access_token")
  )?.value;

  if (!accessToken) {
    redirect("/auth/login?redirect=/admin");
  }

  // Try to verify the token via Supabase API
  const supabase = await createClient();
  if (!supabase) {
    return <>{children}</>;
  }

  // Use the access token to verify session
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    redirect("/auth/login?redirect=/admin");
  }

  return <>{children}</>;
}
