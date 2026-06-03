"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { isRoleAtLeast } from "@/lib/types/hierarchy";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/nova-analise", label: "Nova análise" },
  { href: "/analises", label: "Histórico" },
  { href: "/agentes", label: "Agentes" },
  { href: "/biblioteca", label: "Biblioteca" },
  { href: "/auditoria", label: "Auditoria" },
  { href: "/usuarios", label: "Usuários" },
  { href: "/configuracoes", label: "Conta" }
];

export function Header() {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-cortex-line bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <Image
            src="/cortexma-mark.svg"
            alt=""
            width={42}
            height={42}
            priority
            className="h-10 w-10 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cortex-forest">
              CortexMA
            </p>
            <p className="truncate text-lg font-bold text-cortex-ink">
              Maranhão Estratégico IA
            </p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2">
          {links.map((link) => {
            if ((link.href === "/usuarios" || link.href === "/biblioteca" || link.href === "/configuracoes") && !profile) {
              return null;
            }

            if (link.href === "/auditoria" && !profile) {
              return null;
            }

            if (link.href === "/usuarios" && profile?.role === "viewer") {
              return null;
            }

            if (link.href === "/auditoria" && (!profile || !isRoleAtLeast(profile.role, "manager"))) {
              return null;
            }

            if (link.href === "/configuracoes" && !profile) {
              return null;
            }

            const isActive =
              pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "border-cortex-forest bg-cortex-forest text-white"
                    : "border-cortex-line bg-white text-cortex-ink hover:border-cortex-leaf hover:text-cortex-forest"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}

          {profile ? (
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cortex-line bg-white px-3 py-2 text-sm font-semibold text-cortex-ink transition hover:border-cortex-river hover:text-cortex-river"
            >
              {profile.displayName}
              <span aria-hidden="true">•</span>
              Sair
            </button>
          ) : (
            <Link
              href="/entrar"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-cortex-forest bg-cortex-forest px-3 py-2 text-sm font-semibold text-white transition hover:bg-cortex-leaf"
            >
              Entrar
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
