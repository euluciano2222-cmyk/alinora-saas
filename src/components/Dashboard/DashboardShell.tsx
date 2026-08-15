"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { signOut } from "@/app/dashboard/actions";

type DashboardShellProps = {
  children: ReactNode;
  displayName: string;
  email: string;
  organizationName: string | null;
};

const navigation = [
  {
    label: "Visão geral",
    number: "01",
    href: "/dashboard",
  },
  {
    label: "Projetos",
    number: "02",
    href: "/dashboard/projetos",
  },
  {
    label: "Conversas",
    number: "03",
    href: "/dashboard/conversas",
  },
  {
    label: "Arquivos",
    number: "04",
    href: "/dashboard/arquivos",
  },
  {
    label: "Entregas",
    number: "05",
    href: "/dashboard/entregas",
  },
  {
    label: "Clientes",
    number: "06",
    href: "/dashboard/clientes",
  },
];

function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="grid size-8 grid-cols-2 gap-[3px]"
    >
      <span className="bg-primary" />
      <span className="border border-primary" />
      <span className="border border-primary" />
      <span className="bg-primary" />
    </span>
  );
}

export default function DashboardShell({
  children,
  displayName,
  email,
  organizationName,
}: DashboardShellProps) {
  const pathname = usePathname();

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activeItem =
    navigation.find((item) =>
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname.startsWith(item.href),
    ) ?? navigation[0];

  return (
    <main className="min-h-screen bg-[#e7e8e2] text-ink">
      <div className="mx-auto grid min-h-screen max-w-[1680px] lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-ink/20 bg-[#dfe1da] lg:flex lg:flex-col">
          <Link
            href="/dashboard"
            className="flex min-h-24 items-center gap-3 border-b border-ink/20 px-8"
            aria-label="Ir para a visão geral"
          >
            <BrandMark />

            <span className="text-xl font-semibold tracking-[-0.055em]">
              alinora
            </span>
          </Link>

          <nav
            className="flex flex-1 flex-col gap-1 px-4 py-8"
            aria-label="Navegação principal"
          >
            {navigation.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "flex min-h-12 items-center justify-between px-4 text-sm transition-colors",
                    active
                      ? "bg-primary font-medium text-white"
                      : "text-muted hover:bg-ink/5 hover:text-ink",
                  ].join(" ")}
                >
                  {item.label}

                  <span className="font-mono text-[10px]">
                    {item.number}
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-ink/20 p-4">
            <Link
              href="/dashboard/configuracoes"
              className="mb-2 block border border-ink/20 px-4 py-3 transition-colors hover:border-ink hover:bg-ink/5"
            >
              <span className="block text-xs font-medium">
                {organizationName ?? "Configurar operação"}
              </span>

              <span className="mt-1 block text-[10px] text-muted">
                Configurações do espaço
              </span>
            </Link>

            <div className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#d9ad82] text-xs font-semibold">
                {initials || "AL"}
              </span>

              <div className="min-w-0">
                <strong className="block truncate text-xs">
                  {displayName || "Conta Alinora"}
                </strong>

                <span className="block truncate text-[10px] text-muted">
                  {email}
                </span>
              </div>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="mt-2 flex min-h-11 w-full items-center justify-between border border-ink/20 px-4 text-xs transition-colors hover:border-ink hover:bg-ink hover:text-white"
              >
                Sair da conta
                <span aria-hidden="true">↗</span>
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex min-h-24 items-center justify-between border-b border-ink/20 px-5 md:px-10">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 lg:hidden"
              aria-label="Ir para a visão geral"
            >
              <BrandMark />

              <span className="text-lg font-semibold tracking-[-0.05em]">
                alinora
              </span>
            </Link>

            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-primary lg:block">
              {activeItem.label}
            </span>

            <div className="flex items-center gap-3">
              <span className="hidden text-xs text-muted sm:block">
                {organizationName ?? "Espaço protegido"}
              </span>

              <span className="grid size-9 place-items-center rounded-full bg-[#d9ad82] text-xs font-semibold">
                {initials || "AL"}
              </span>

              <form action={signOut} className="lg:hidden">
                <button
                  type="submit"
                  className="border border-ink/20 px-3 py-2 text-xs"
                >
                  Sair
                </button>
              </form>
            </div>
          </header>

          <nav
            className="flex overflow-x-auto border-b border-ink/20 bg-[#dfe1da] lg:hidden"
            aria-label="Navegação móvel"
          >
            {navigation.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "shrink-0 border-r border-ink/15 px-5 py-4 text-xs",
                    active
                      ? "bg-primary text-white"
                      : "text-muted",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {children}
        </section>
      </div>
    </main>
  );
}