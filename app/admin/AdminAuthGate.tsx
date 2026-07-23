import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side auth guard for the admin area.
 * Redirects to /auth/login (no locale prefix) if no session.
 */
export default async function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  // If Supabase is not configured → demo mode (no auth gate)
  const supabase = await createClient();
  if (!supabase) {
    return <>{children}</>;
  }

  // Verify session via API
  const { data, error } = await supabase.auth.getSession();

  if (error || !data?.session) {
    redirect("/auth/login?redirect=/admin");
  }

  return <>{children}</>;
}
