/**
 * Auth layout — no auth required for login page itself.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
