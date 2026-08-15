import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

const setupSteps = [
  {
    number: "01",
    title: "Apresente sua operação",
    description:
      "Defina as informações que dão identidade ao seu espaço.",
    href: "/dashboard/configuracoes",
  },
  {
    number: "02",
    title: "Cadastre o primeiro cliente",
    description:
      "Reúna contatos, contexto e projetos em um único lugar.",
    href: "/dashboard/clientes",
  },
  {
    number: "03",
    title: "Conduza a primeira entrega",
    description:
      "Transforme arquivos e aprovações em uma experiência clara.",
    href: "/dashboard/entregas",
  },
];

function formatMetric(value: number) {
  return String(value).padStart(2, "0");
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const userId = String(claims.sub);

  const [profileResult, membershipResult] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", userId)
        .maybeSingle(),

      supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle(),
    ]);

  const profile = profileResult.data;

  const organizationId =
    membershipResult.data?.organization_id ?? null;

  const email: string =
    typeof profile?.email === "string"
      ? profile.email
      : typeof claims.email === "string"
        ? claims.email
        : "usuario@alinora.com";

  const fallbackName = email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map(
      (part: string) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase(),
    )
    .join(" ");

  const displayName =
    typeof profile?.full_name === "string" &&
    profile.full_name.trim()
      ? profile.full_name.trim()
      : fallbackName || "bem-vindo";

  let activeClients = 0;
  let activeProjects = 0;
  let pendingDeliveries = 0;

  if (organizationId) {
    const [
      clientsResult,
      projectsResult,
      deliveriesResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("organization_id", organizationId)
        .eq("status", "active"),

      supabase
        .from("projects")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("organization_id", organizationId)
        .eq("status", "active"),

      supabase
        .from("approvals")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("organization_id", organizationId)
        .eq("status", "pending"),
    ]);

    activeClients = clientsResult.count ?? 0;
    activeProjects = projectsResult.count ?? 0;
    pendingDeliveries = deliveriesResult.count ?? 0;
  }

  const completedSteps =
    (organizationId ? 1 : 0) +
    (activeClients > 0 ? 1 : 0) +
    (pendingDeliveries > 0 ? 1 : 0);

  const metrics = [
    {
      label: "CLIENTES ATIVOS",
      value: formatMetric(activeClients),
      href: "/dashboard/clientes",
    },
    {
      label: "PROJETOS EM CURSO",
      value: formatMetric(activeProjects),
      href: "/dashboard/projetos",
    },
    {
      label: "ENTREGAS PENDENTES",
      value: formatMetric(pendingDeliveries),
      href: "/dashboard/entregas",
    },
  ];

  return (
    <div className="px-5 py-10 md:px-10 md:py-14">
      <section className="grid gap-8 border-b border-ink/20 pb-12 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            SUA OPERAÇÃO COMEÇA AQUI
          </p>

          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.065em] md:text-7xl">
            Olá, {displayName}.

            <span className="block text-primary">
              {organizationId
                ? "Sua operação está ativa."
                : "Vamos preparar seu espaço."}
            </span>
          </h1>
        </div>

        <p className="max-w-md text-sm leading-7 text-muted">
          {organizationId
            ? "Sua estrutura está conectada. Clientes, projetos e entregas agora podem fazer parte de uma operação clara e segura."
            : "Antes de cadastrar clientes e projetos, apresente sua empresa para criarmos uma operação protegida no Alinora."}
        </p>
      </section>

      <section className="grid border-b border-ink/20 sm:grid-cols-3">
        {metrics.map((metric, index) => (
          <Link
            key={metric.label}
            href={metric.href}
            className={[
              "group px-0 py-8 transition-colors hover:bg-ink/[0.025] sm:px-6 md:py-10",
              index < 2
                ? "border-b border-ink/20 sm:border-r sm:border-b-0"
                : "",
              index === 0 ? "sm:pl-0" : "",
            ].join(" ")}
          >
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              {metric.label}
            </span>

            <strong className="mt-4 block text-4xl font-semibold tracking-[-0.06em] text-primary transition-transform group-hover:translate-x-1">
              {metric.value}
            </strong>
          </Link>
        ))}
      </section>

      <div className="grid gap-8 py-10 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-ink/20 bg-[#f7f6f0]">
          <header className="flex items-center justify-between border-b border-ink/20 px-6 py-5">
            <div>
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
                PRIMEIROS PASSOS
              </span>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                Prepare sua operação
              </h2>
            </div>

            <span className="font-mono text-[10px] text-muted">
              {String(completedSteps).padStart(2, "0")} /
              03
            </span>
          </header>

          <div>
            {setupSteps.map((step) => (
              <Link
                key={step.number}
                href={step.href}
                className="group grid gap-5 border-b border-ink/15 px-6 py-7 transition-colors last:border-b-0 hover:bg-primary/[0.04] md:grid-cols-[45px_1fr_auto] md:items-center"
              >
                <span className="font-mono text-[10px] text-primary">
                  {step.number}
                </span>

                <div>
                  <h3 className="font-semibold tracking-[-0.02em]">
                    {step.title}
                  </h3>

                  <p className="mt-2 max-w-md text-xs leading-6 text-muted">
                    {step.description}
                  </p>
                </div>

                <span
                  aria-hidden="true"
                  className="hidden text-lg text-primary transition-transform group-hover:translate-x-1 md:block"
                >
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="flex min-h-[390px] flex-col justify-between bg-primary p-7 text-white md:p-9">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/65">
              ESTRUTURA ALINORA
            </span>

            <h2 className="mt-5 max-w-md text-4xl font-semibold leading-[0.98] tracking-[-0.055em] md:text-5xl">
              Clareza antes da complexidade.
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/70">
              Cada recurso será conectado ao seu fluxo real,
              mantendo uma experiência simples para você e segura
              para seus clientes.
            </p>
          </div>

          <div className="mt-12 border-t border-white/25 pt-5">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-white/70">
                Fundação protegida
              </span>

              <span className="font-mono text-[10px]">
                {organizationId
                  ? "ATIVA"
                  : "AGUARDANDO CONFIGURAÇÃO"}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}