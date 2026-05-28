import type { Metadata } from "next";
import { PwaServiceWorkerRegistration } from "@/components/pwa-service-worker-registration";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "SGTR Agricultor",
  title: "SGTR Agricultor",
  description: "Boletim público para agricultores do Maranhão, consumindo apenas boletins publicados pelo SGTR GOES-R Ambiental.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SGTR Agricultor",
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
