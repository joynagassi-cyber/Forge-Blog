/**
 * Page d'accueil publique — redirige directement vers le blog.
 * L'éditeur est accessible séparément via /admin (lien discret dans footer).
 */
import { redirect } from "next/navigation";

export default function HomePage() {
  // Redirection automatique vers la version française du blog
  redirect("/fr");
}
