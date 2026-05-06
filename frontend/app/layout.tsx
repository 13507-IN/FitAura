import type { Metadata } from "next";
import { Manrope, Sora } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body"
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  title: "FitAura - AI Personal Stylist",
  description: "Upload your photo and get your best look."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${sora.variable}`}>
        <div className="app-shell">
          <header className="site-header">
            <div className="site-header__inner">
              <Link href="/" className="site-brand">
                FitAura
              </Link>
              <nav className="site-nav">
                <Link href="/upload">Upload</Link>
                <Link href="/wardrobe">Wardrobe</Link>
                <Link href="/result">Result</Link>
              </nav>
            </div>
          </header>

          <div className="app-content">{children}</div>

          <footer className="site-footer">
            <div className="site-footer__inner">
              <p>Copyright {currentYear} FitAura. AI personal styling platform.</p>
              <div className="site-footer__links">
                <Link href="/">Home</Link>
                <Link href="/upload">Generate</Link>
                <Link href="/wardrobe">Wardrobe</Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
