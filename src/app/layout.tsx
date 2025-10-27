import "./globals.css";
import { Analytics } from "@vercel/analytics/react";

export const metadata = {
  title: "Kofa-3",
  description: "Agentic Search · News · Vote",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-neutral-950 text-neutral-100">
        <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
            <h1 className="text-lg font-semibold">Kofa-3</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/" className="hover:underline">Home</a>
              <a href="/search" className="hover:underline">Search</a>
              <a href="/news" className="hover:underline">News</a>
              <a href="/vote" className="hover:underline">Vote</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4">{children}</main>
        <Analytics />
      </body>
    </html>
  );
}