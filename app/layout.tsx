import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpusClip — Turn long videos into viral shorts",
  description:
    "OpusClip uses AI to repurpose your long videos into 10 viral short clips in one click. Used by 16M+ creators and businesses.",
  openGraph: {
    title: "OpusClip — Turn long videos into viral shorts",
    description: "AI-powered video repurposing tool for creators and marketers.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
