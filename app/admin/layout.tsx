import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Check if we're already on the login page — allow access without session
  const requestHeaders = await import("next/headers").then((m) => m.headers());
  const pathname = requestHeaders.get("x-middleware-request-pathname") ?? "";

  if (!pathname.startsWith("/admin/login")) {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("admin_session")?.value;

    if (!sessionToken) {
      redirect("/admin/login");
    }
  }

  return <>{children}</>;
}
