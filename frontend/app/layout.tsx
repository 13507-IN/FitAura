import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitAura - AI Personal Stylist",
  description: "Upload your photo and get your best look."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
