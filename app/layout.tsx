import type { Metadata } from "next";
import { PwaServiceWorkerRegistration } from "@/components/pwa-service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "Holy Motion",
  title: "Holy Motion Assistive Monitor",
  description: "PWA para monitoramento assistivo com sensor BLE Holy-Motion.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Holy Motion",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body suppressHydrationWarning>
        <PwaServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
