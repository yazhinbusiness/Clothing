import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oh Must — Precision is Personal",
  description:
    "Made-to-order corporate womenswear, tailored to you. Precision is personal.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/*
          Loaded as a plain stylesheet link instead of next/font/google.
          next/font bakes the font fetch into the build itself, so if that
          request is ever blocked (proxy, firewall, offline), the whole
          build fails. A <link> just degrades to the fallback font stack
          in globals.css if it can't load — it never breaks the build.
        */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-bg)] text-[var(--color-text)]">
        {children}
      </body>
    </html>
  );
}
