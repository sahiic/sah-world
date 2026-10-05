import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Odaklanma",
  description:
    "Niyetini berraklaştır, sakin bir çalışma ritmi kur ve gayretini görünür kıl.",
};

export const viewport: Viewport = {
  themeColor: "#0f1923",
  colorScheme: "dark",
};

export default function FocusLayout({ children }: { children: React.ReactNode }) {
  return children;
}

