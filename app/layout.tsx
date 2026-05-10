import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Holy Motion Assistive Monitor",
  description: "PWA para monitoramento assistivo com sensor BLE Holy-Motion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
