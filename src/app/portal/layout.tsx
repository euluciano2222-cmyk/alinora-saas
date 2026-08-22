import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/dashboard/actions";
import { createClient } from "@/lib/supabase/server";

type PortalLayoutProps = {
  children: React.ReactNode;
};

function BrandMark() {
  return (
    <span
      className="grid h-7 w-7 grid-cols-2 gap-[2px]"
      aria-hidden="true"
    >
      <span className="bg-[#566547]" />
      <span className="border border-[#566547]" />
      <span className="border border-[#566547]" />
      <span className="bg-[#566547]" />
    </span>
  );
}

export default async function PortalLayout({
  children,
}: PortalLayoutProps) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/portal");
  }

  return (
    <div className="min-h-screen bg-[#e8e9e3] text-[#1f231b]">
      <header className="border-b border-[#1f231b]/20 bg-[#f7f6f0]">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-5 px-5 py-4 md:px-10">
          <div className="flex items-center gap-10">
            <Link
              href="/portal"
              className="flex items-center gap-3"
              aria-label="Página inicial do portal Alinora"
            >
              <BrandMark />

              <strong className="text-xl tracking-[-0.04em]">
                alinora
              </strong>
            </Link>

            <span className="hidden border-l border-[#1f231b]/20 pl-10 font-mono text-[9px] uppercase tracking-[0.18em] text-[#566547] sm:block">
              PORTAL DO CLIENTE
            </span>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden max-w-[240px] truncate text-xs text-[#62675d] md:block">
              {user.email}
            </span>

            <form action={signOut}>
              <button
                type="submit"
                className="min-h-10 border border-[#1f231b]/20 px-4 text-xs transition hover:bg-[#1f231b] hover:text-white"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-[#1f231b]/20 bg-[#f7f6f0]">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-[#62675d] sm:flex-row sm:items-center sm:justify-between md:px-10">
          <span>
            ALINORA © 2026
          </span>

          <span>
            Acesso protegido e isolado por cliente.
          </span>
        </div>
      </footer>
    </div>
  );
}