import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chez Administration",
  description: "Mini App Telegram",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script src="https://telegram.org/js/telegram-web-app.js" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased selection:bg-primary/30 selection:text-primary`}>
        {children}
      </body>
    </html>
  );
}
