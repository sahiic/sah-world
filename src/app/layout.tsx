import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Serif } from "next/font/google";
import "./globals.css";
import FocusTimerFloatingWidget from "@/components/core/FocusTimerRoot";
import FocusSessionRuntime from "@/components/core/FocusSessionRuntime";
import MotionPreferences from "@/components/ui/MotionPreferences";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoSerif = Noto_Serif({
  subsets: ["latin", "latin-ext"],
  variable: "--font-noto-serif",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_SITE_URL || "https://sah-world.vercel.app",
);

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "SAH World | Niyetini hayata taşı",
    template: "%s | SAH World",
  },
  description:
    "Odaklanma, günlük, Kur’an yolculuğu ve manevi farkındalık için güvenli, sakin ve kişisel gelişim alanı.",
  keywords: [
    "günlük",
    "kuran",
    "hadis",
    "eisenhower",
    "şükür",
    "mescid",
    "zikirmatik",
    "kişisel gelişim",
  ],
  authors: [{ name: "SAH World" }],
  creator: "SAH World",
  applicationName: "SAH World",
  manifest: "/manifest.webmanifest",
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/favicon.ico",
  },
  openGraph: {
    title: "SAH World | Niyetini hayata taşı",
    description:
      "Odaklanma, günlük, Kur’an yolculuğu ve manevi farkındalık için güvenli kişisel alan.",
    type: "website",
    locale: "tr_TR",
    url: "/",
    siteName: "SAH World",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SAH World kişisel gelişim alanı",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SAH World | Niyetini hayata taşı",
    description:
      "Küçük ve istikrarlı adımları tek bir güvenli alanda biriktir.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#006950",
  colorScheme: "light dark",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "SAH World",
  url: siteUrl.href,
  applicationCategory: "EducationalApplication",
  operatingSystem: "Web",
  inLanguage: "tr",
  description:
    "Odaklanma, günlük, Kur'an yolculuğu ve manevi farkındalık için güvenli, sakin ve kişisel gelişim alanı.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
  author: { "@type": "Organization", name: "SAH World" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${inter.variable} ${jetbrains.variable} ${notoSerif.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased overflow-x-hidden">
        <MotionPreferences>
          {children}
          <FocusTimerFloatingWidget />
          <FocusSessionRuntime />
        </MotionPreferences>
      </body>
    </html>
  );
}
