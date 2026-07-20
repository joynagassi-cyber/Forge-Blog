import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side auth guard for the admin area.
 * Reads the Supabase session from cookies on the server (section 11, 14.5).
 * Redirects to /auth/login with ?redirect=/admin if no session.
 */
export default async function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // No Supabase configured → demo mode (show without auth)
  if (!supabase) {
    return <>{children}</>;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth/login?redirect=/admin");
  }

  return <>{children}</>;
}
