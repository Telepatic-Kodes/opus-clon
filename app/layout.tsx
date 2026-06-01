import type { Metadata } from "next";
import { Unbounded, DM_Mono, Outfit } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "700", "900"],
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["300", "400", "500"],
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AIAIAI — Convierte videos largos en clips virales",
  description:
    "AIAIAI usa IA para convertir tus videos largos en 10 clips cortos virales con un clic. Usado por más de 16M de creadores y empresas.",
  openGraph: {
    title: "AIAIAI — Convierte videos largos en clips virales",
    description: "Herramienta de repurposing de video con IA para creadores y marketers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${unbounded.variable} ${dmMono.variable} ${outfit.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
