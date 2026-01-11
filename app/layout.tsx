import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VPN Share",
  description: "VPN Profile Sharing System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased text-right rtl">
        {children}
      </body>
    </html>
  );
}
