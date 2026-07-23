import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;

  // Allow access to /admin/login without session
  if (!sessionToken) {
    redirect("/admin/login");
  }

  return <>{children}</>;
}
