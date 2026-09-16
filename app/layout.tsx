import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

// ----------------------------------------------------
export const metadata: Metadata = {
  title: "Chez Rheyy - Générateur de Documents",
  description: "Génération de documents officiels Telegram Mini App"
};

// ----------------------------------------------------
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

// ----------------------------------------------------
export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="dark">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body className="antialiased min-h-screen bg-[#070417] text-slate-100 flex flex-col">
        {children}
      </body>
    </html>
  );
}
