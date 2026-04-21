import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Is Takibi",
  description: "Supabase destekli is takibi ve proje panosu.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
