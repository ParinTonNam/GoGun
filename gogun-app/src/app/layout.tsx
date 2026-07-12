import type { Metadata } from "next";
import { kanit } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "GoGun",
  description: "ไปกัน GOGUN",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${kanit.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
