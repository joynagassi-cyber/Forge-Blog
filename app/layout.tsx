import type { Metadata } from "next";
import { Geist_Mono, Inter, Source_Serif_4 } from "next/font/google";
import { cookies } from "next/headers";
import { LOCALE_COOKIE, type Locale } from "@/lib/locale/resolve";
import "./globals.css";
import { PostHogProvider } from "@/components/shared/PostHogProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Forge-Blog",
    template: "%s · Forge-Blog",
  },
  description:
    "Sciences de l'apprentissage — Articles sur la mémoire, le SOC et la cognition, par les équipes de NainoForge et SCYForge.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon.svg",
    shortcut: "/icons/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  const lang: Locale = localeCookie === "fr" ? "fr" : "en";

  return (
    <html
      lang={lang}
      data-theme="light"
      className={`${inter.variable} ${sourceSerif.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--text-primary)]">
        <PostHogProvider />
        {children}
      </body>
    </html>
  );
}
