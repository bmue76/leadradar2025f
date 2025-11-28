// app/layout.tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";

import "./globals.css";

export const metadata: Metadata = {
  title: "LeadRadar – Admin Prototyp",
  description: "LeadRadar – SaaS-Lösung zur digitalen Leaderfassung auf Messen.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-slate-100 text-slate-900 antialiased">
        {/* Obere Brand-Leiste */}
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                {/* Logo */}
                <Image
                  src="/leadradar-logo.png"
                  alt="LeadRadar Logo"
                  width={120}
                  height={30}
                  priority
                />
                {/* Fallback für Screenreader */}
                <span className="sr-only">LeadRadar</span>
              </Link>
              <span className="text-xs text-slate-600">
                Admin – Prototyp
              </span>
            </div>

            <nav className="flex items-center gap-4 text-sm text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Start
              </Link>
              <Link href="/admin" className="hover:text-slate-900">
                Admin
              </Link>
            </nav>
          </div>
        </header>

        {/* Haupt-Container */}
        <div className="mx-auto max-w-6xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
