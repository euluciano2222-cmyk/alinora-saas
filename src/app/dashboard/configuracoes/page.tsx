import { revalidatePath } from "next/cache";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type ConfiguracoesPageProps = {
  searchParams: Promise<{
    erro?: string;
  }>;
};

function createSlug(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const base = normalized || "espaco";

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

async function createOrganization(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const { data, error: authError } =
    await supabase.auth.getClaims();

  const claims = data?.claims;

  if (authError || !claims?.sub) {
    redirect("/login");
  }

  const userId = claims.sub;

  const organizationName = String(
    formData.get("organizationName") ?? "",
  ).trim();

  if (
    organizationName.length < 2 ||
    organizationName.length > 100
  ) {
    redirect(
      `/dashboard/configuracoes?erro=${encodeURIComponent(
        "O nome precisa ter entre 2 e 100 caracteres.",
      )}`,
    );
  }

  const { data: existingMembership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (existingMembership?.organization_id) {
    redirect("/dashboard");
  }

  const { error: insertError } = await supabase
    .from("organizations")
    .insert({
      name: organizationName,
      slug: createSlug(organizationName),
      created_by: userId,
    });

  if (insertError) {
    console.error("Falha ao criar organização:", insertError.code);

    redirect(
      `/dashboard/configuracoes?erro=${encodeURIComponent(
        "Não foi possível criar o espaço. Tente novamente.",
      )}`,
    );
  }

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

export default async function ConfiguracoesPage({
  searchParams,
}: ConfiguracoesPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select(
      "role, organization_id, organizations(id, name, slug)",
    )
    .eq("user_id", claims.sub)
    .limit(1)
    .maybeSingle();

  const organizationRelation = membership?.organizations;

  const organization = Array.isArray(organizationRelation)
    ? organizationRelation[0]
    : organizationRelation;

  if (organization) {
    return (
      <div className="px-5 py-10 md:px-10 md:py-14">
        <header className="border-b border-ink/20 pb-10">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            CONFIGURAÇÕES
          </span>

          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.065em] md:text-7xl">
            Sua operação está
            <span className="block text-primary">protegida.</span>
          </h1>
        </header>

        <section className="mt-10 max-w-3xl border border-ink/20 bg-[#f7f6f0]">
          <header className="border-b border-ink/20 px-6 py-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
              ESPAÇO ATUAL
            </span>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              {organization.name}
            </h2>
          </header>

          <dl className="grid sm:grid-cols-2">
            <div className="border-b border-ink/15 px-6 py-6 sm:border-r sm:border-b-0">
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                IDENTIFICADOR
              </dt>

              <dd className="mt-3 text-sm">
                {organization.slug}
              </dd>
            </div>

            <div className="px-6 py-6">
              <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                SEU NÍVEL DE ACESSO
              </dt>

              <dd className="mt-3 text-sm capitalize">
                {membership?.role ?? "owner"}
              </dd>
            </div>
          </dl>
        </section>

        <Link
          href="/dashboard/clientes"
          className="mt-8 inline-flex min-h-12 items-center bg-primary px-6 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
        >
          Cadastrar primeiro cliente
          <span className="ml-8" aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 md:px-10 md:py-14">
      <header className="grid gap-8 border-b border-ink/20 pb-12 xl:grid-cols-[1fr_0.65fr] xl:items-end">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
            CONFIGURAÇÃO INICIAL
          </span>

          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.065em] md:text-7xl">
            Dê identidade
            <span className="block text-primary">
              à sua operação.
            </span>
          </h1>
        </div>

        <p className="max-w-md text-sm leading-7 text-muted">
          Crie o espaço seguro que reunirá seus clientes,
          projetos, conversas, arquivos e entregas.
        </p>
      </header>

      <div className="grid gap-8 py-10 xl:grid-cols-[1fr_0.75fr]">
        <form
          action={createOrganization}
          className="border border-ink/20 bg-[#f7f6f0]"
        >
          <header className="border-b border-ink/20 px-6 py-5">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
              01 / OPERAÇÃO
            </span>

            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
              Como seu espaço será chamado?
            </h2>
          </header>

          <div className="p-6">
            <label
              htmlFor="organizationName"
              className="text-xs font-medium"
            >
              Nome da empresa ou operação
            </label>

            <input
              id="organizationName"
              name="organizationName"
              type="text"
              required
              minLength={2}
              maxLength={100}
              autoComplete="organization"
              placeholder="Ex.: Oliveira Studio"
              className="mt-3 min-h-14 w-full border border-ink/25 bg-transparent px-4 text-base outline-none transition-colors placeholder:text-muted/60 focus:border-primary"
            />

            {params.erro ? (
              <p
                role="alert"
                className="mt-4 border-l-2 border-red-700 pl-3 text-sm text-red-800"
              >
                {params.erro}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-6 flex min-h-12 w-full items-center justify-between bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Criar espaço protegido
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </form>

        <aside className="flex min-h-[360px] flex-col justify-between bg-primary p-7 text-white">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/65">
              SEGURANÇA POR PADRÃO
            </span>

            <h2 className="mt-5 text-4xl font-semibold leading-none tracking-[-0.055em]">
              Seus dados começam isolados.
            </h2>

            <p className="mt-6 text-sm leading-7 text-white/70">
              Cada operação recebe seu próprio espaço. As políticas
              RLS impedem que usuários de outras organizações
              acessem seus clientes e projetos.
            </p>
          </div>

          <span className="border-t border-white/25 pt-5 font-mono text-[10px]">
            ACESSO AUTENTICADO
          </span>
        </aside>
      </div>
    </div>
  );
}