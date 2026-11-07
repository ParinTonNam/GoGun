import type { Metadata, Viewport } from "next";
import { kanit } from "@/lib/fonts";
import "./globals.css";
import "./design-system.css";
import "./auth-v2.css";
import "./desktop-gate.css";
import "./mobile-usability.css";
import "./home-v2.css";
import { AppFrame } from "@/components/app-frame";

export const metadata: Metadata = {
  title: "Maew Tiew | แมวเที่ยว",
  description: "Happy Cats, Easy Trips",
};

export const viewport: Viewport = {
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col"><AppFrame>{children}</AppFrame></body>
    </html>
  );
}
