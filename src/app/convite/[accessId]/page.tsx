import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ActivateInvitationForm from "./ActivateInvitationForm";

type InvitationPageProps = {
  params: Promise<{
    accessId: string;
  }>;
};

function BrandMark() {
  return (
    <span
      className="grid h-8 w-8 grid-cols-2 gap-[2px]"
      aria-hidden="true"
    >
      <span className="bg-[#566547]" />
      <span className="border border-[#566547]" />
      <span className="border border-[#566547]" />
      <span className="bg-[#566547]" />
    </span>
  );
}

export default async function InvitationPage({
  params,
}: InvitationPageProps) {
  const { accessId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/convite/${accessId}`,
      )}`,
    );
  }

  const { data: existingAccess } =
    await supabase
      .from("client_access")
      .select("id, status")
      .eq("id", accessId)
      .eq("user_id", user.id)
      .maybeSingle();

  if (
    existingAccess?.status === "active"
  ) {
    redirect("/portal");
  }

  return (
    <main className="min-h-screen bg-[#e8e9e3] p-4 text-[#1f231b] md:p-8">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-6xl border border-[#1f231b]/20 bg-[#f7f6f0] md:min-h-[calc(100vh-4rem)] lg:grid-cols-[0.82fr_1.18fr]">
        <section className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-[#566547] p-8 text-[#f7f6f0] md:p-12 lg:min-h-full">
          <div
            className="absolute inset-0 opacity-[0.08]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize:
                "48px 48px",
            }}
          />

          <header className="relative flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Página inicial da Alinora"
            >
              <BrandMark />

              <strong className="text-xl tracking-[-0.04em]">
                alinora
              </strong>
            </Link>

            <span className="font-mono text-[9px] uppercase tracking-[0.2em]">
              PORTAL DO CLIENTE
            </span>
          </header>

          <div className="relative my-14">
            <span className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#f7f6f0]/70">
              CONVITE PROTEGIDO
            </span>

            <h1 className="mt-6 max-w-lg text-5xl font-semibold leading-[0.92] tracking-[-0.065em] md:text-7xl">
              Clareza também é compartilhar.
            </h1>

            <p className="mt-8 max-w-md text-sm leading-7 text-[#f7f6f0]/75">
              Acesse conversas, arquivos e
              entregas vinculadas ao seu
              relacionamento com a equipe.
            </p>
          </div>

          <footer className="relative border-t border-white/20 pt-6">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
                ACESSO ISOLADO
              </span>

              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
                DADOS PROTEGIDOS
              </span>

              <span className="font-mono text-[9px] uppercase tracking-[0.14em]">
                CONTEXTO CONECTADO
              </span>
            </div>
          </footer>
        </section>

        <section className="flex items-center px-7 py-12 md:px-14 lg:px-20">
          <div className="w-full max-w-xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#566547]">
              01 / ATIVAR ACESSO
            </span>

            <h2 className="mt-6 text-4xl font-semibold leading-none tracking-[-0.055em] md:text-6xl">
              Você recebeu um convite.
            </h2>

            <p className="mt-6 max-w-lg text-sm leading-7 text-[#62675d]">
              Para proteger os dados, o
              convite somente poderá ser
              ativado pela conta com o mesmo
              endereço de e-mail informado
              pela equipe.
            </p>

            <div className="mt-8 border-y border-[#1f231b]/20 py-6">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#62675d]">
                CONTA AUTENTICADA
              </span>

              <strong className="mt-3 block break-all text-lg font-medium">
                {user.email ??
                  "E-mail não identificado"}
              </strong>
            </div>

            <ActivateInvitationForm
              accessId={accessId}
            />

            <div className="mt-8 border-t border-[#1f231b]/15 pt-6">
              <p className="text-xs leading-6 text-[#62675d]">
                Caso o endereço acima não
                seja o mesmo que recebeu o
                convite, saia desta conta e
                entre novamente utilizando o
                e-mail correto.
              </p>
            </div>

            <Link
              href="/"
              className="mt-8 inline-flex text-xs text-[#566547] underline-offset-4 hover:underline"
            >
              Voltar para o início
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}