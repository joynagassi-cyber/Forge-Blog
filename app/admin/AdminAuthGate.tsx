import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Server-side auth guard for the admin area.
 * Reads the Supabase session from cookies on the server (section 11, 14.5).
 * Redirects to /en with ?admin=login so the client can show a sign-in flow.
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
    redirect("/en?admin=login");
  }

  return <>{children}</>;
}
