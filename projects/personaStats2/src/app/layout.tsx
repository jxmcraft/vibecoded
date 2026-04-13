import type { Metadata } from "next";
import localFont from "next/font/local";
import { Bebas_Neue, Geist, Geist_Mono, Permanent_Marker } from "next/font/google";

import { PhantomAppShell } from "@/components/providers/PhantomAppShell";

import "./globals.css";

/** Menu-style display face; file lives in `public/fonts/` (see PRD implementation status). */
const persona5Menu = localFont({
  src: "../../public/fonts/Persona5MenuFontPrototype-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-p5-menu",
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
});

const permanentMarker = Permanent_Marker({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-marker",
});

export const metadata: Metadata = {
  title: "Phantom Tracker",
  description: "Persona-style stats and habit tracker (MVP)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} ${permanentMarker.variable} ${persona5Menu.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ink text-paper">
        <PhantomAppShell>{children}</PhantomAppShell>
      </body>
    </html>
  );
}
