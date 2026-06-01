import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpusClip — Convierte videos largos en clips virales",
  description:
    "OpusClip usa IA para convertir tus videos largos en 10 clips cortos virales con un clic. Usado por más de 16M de creadores y empresas.",
  openGraph: {
    title: "OpusClip — Convierte videos largos en clips virales",
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
    <html lang="en" className={jakartaSans.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
