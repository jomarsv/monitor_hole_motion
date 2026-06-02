"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/components/auth/AuthProvider";

type ShellProps = {
  children: ReactNode;
};

export function Shell({ children }: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { profile, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!profile && pathname !== "/entrar") {
      router.replace("/entrar");
      return;
    }

    if (profile && pathname === "/entrar") {
      router.replace("/nova-analise");
    }
  }, [loading, pathname, profile, router]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
