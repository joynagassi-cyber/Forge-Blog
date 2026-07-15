import { redirect } from "next/navigation";

/** Root redirects via middleware; this is a safety net. */
export default function RootPage() {
  redirect("/en");
}
