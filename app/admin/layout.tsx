/** No auth check — middleware handles it. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
