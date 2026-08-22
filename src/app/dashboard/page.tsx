import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type RequestStatus =
  | "received"
  | "ai_review"
  | "in_progress"
  | "waiting_client"
  | "completed"
  | "cancelled";

type RequestPriority =
  | "low"
  | "normal"
  | "high"
  | "urgent";

const openStatuses: RequestStatus[] = [
  "received",
  "ai_review",
  "in_progress",
  "waiting_client",
];

const statusLabels: Record<
  RequestStatus,
  string
> = {
  received: "Recebida",
  ai_review: "Em análise",
  in_progress: "Em andamento",
  waiting_client:
    "Aguardando cliente",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const priorityLabels: Record<
  RequestPriority,
  string
> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data,
    error: authError,
  } = await supabase.auth.getClaims();

  const claims = data?.claims;

  if (authError || !claims?.sub) {
    redirect("/login");
  }

  const userId = String(claims.sub);

  const [
    profileResult,
    membershipResult,
  ] = await Promise.all([
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
    membershipResult.data
      ?.organization_id ?? null;

  const email =
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
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1).toLowerCase(),
    )
    .join(" ");

  const displayName =
    typeof profile?.full_name ===
      "string" &&
    profile.full_name.trim()
      ? profile.full_name.trim()
      : fallbackName || "bem-vindo";

  let activeClients = 0;
  let activeProjects = 0;
  let openConversations = 0;
  let pendingDeliveries = 0;
  let totalDeliveries = 0;

  let recentConversations: Array<{
    id: string;
    client_id: string;
    title: string;
    status: RequestStatus;
    priority: RequestPriority;
    updated_at: string;
  }> = [];

  let pendingApprovals: Array<{
    id: string;
    client_id: string;
    request_id: string;
    message: string | null;
    requested_at: string;
  }> = [];

  if (organizationId) {
    const [
      clientsResult,
      projectsResult,
      conversationsCountResult,
      pendingDeliveriesResult,
      totalDeliveriesResult,
      recentConversationsResult,
      pendingApprovalsResult,
    ] = await Promise.all([
      supabase
        .from("clients")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "organization_id",
          organizationId,
        )
        .eq("status", "active"),

      supabase
        .from("projects")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "organization_id",
          organizationId,
        )
        .eq("status", "active"),

      supabase
        .from("requests")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "organization_id",
          organizationId,
        )
        .in("status", openStatuses),

      supabase
        .from("approvals")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "organization_id",
          organizationId,
        )
        .eq("status", "pending"),

      supabase
        .from("approvals")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq(
          "organization_id",
          organizationId,
        ),

      supabase
        .from("requests")
        .select(
          "id, client_id, title, status, priority, updated_at",
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .in("status", openStatuses)
        .order("updated_at", {
          ascending: false,
        })
        .limit(5),

      supabase
        .from("approvals")
        .select(
          "id, client_id, request_id, message, requested_at",
        )
        .eq(
          "organization_id",
          organizationId,
        )
        .eq("status", "pending")
        .order("requested_at", {
          ascending: false,
        })
        .limit(5),
    ]);

    activeClients =
      clientsResult.count ?? 0;

    activeProjects =
      projectsResult.count ?? 0;

    openConversations =
      conversationsCountResult.count ?? 0;

    pendingDeliveries =
      pendingDeliveriesResult.count ?? 0;

    totalDeliveries =
      totalDeliveriesResult.count ?? 0;

    recentConversations =
      (recentConversationsResult.data ??
        []) as typeof recentConversations;

    pendingApprovals =
      (pendingApprovalsResult.data ??
        []) as typeof pendingApprovals;
  }

  const relatedClientIds = [
    ...new Set([
      ...recentConversations.map(
        (conversation) =>
          conversation.client_id,
      ),
      ...pendingApprovals.map(
        (approval) =>
          approval.client_id,
      ),
    ]),
  ];

  const relatedRequestIds = [
    ...new Set(
      pendingApprovals.map(
        (approval) =>
          approval.request_id,
      ),
    ),
  ];

  const [
    relatedClientsResult,
    approvalRequestsResult,
  ] = await Promise.all([
    relatedClientIds.length > 0
      ? supabase
          .from("clients")
          .select(
            "id, name, company_name",
          )
          .in("id", relatedClientIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    relatedRequestIds.length > 0
      ? supabase
          .from("requests")
          .select("id, title")
          .in(
            "id",
            relatedRequestIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  const clientsById = new Map(
    (
      relatedClientsResult.data ?? []
    ).map((client) => [
      client.id,
      client,
    ]),
  );

  const requestsById = new Map(
    (
      approvalRequestsResult.data ?? []
    ).map((request) => [
      request.id,
      request,
    ]),
  );

  const completedSteps =
    (organizationId ? 1 : 0) +
    (activeClients > 0 ? 1 : 0) +
    (totalDeliveries > 0 ? 1 : 0);

  const metrics = [
    {
      label: "CLIENTES ATIVOS",
      value: formatMetric(
        activeClients,
      ),
      href: "/dashboard/clientes",
    },
    {
      label: "PROJETOS EM CURSO",
      value: formatMetric(
        activeProjects,
      ),
      href: "/dashboard/projetos",
    },
    {
      label: "CONVERSAS ABERTAS",
      value: formatMetric(
        openConversations,
      ),
      href: "/dashboard/conversas",
    },
    {
      label: "ENTREGAS PENDENTES",
      value: formatMetric(
        pendingDeliveries,
      ),
      href: "/dashboard/entregas",
    },
  ];

  return (
    <div className="px-5 py-10 md:px-10 md:py-14">
      <section className="grid gap-8 border-b border-ink/20 pb-12 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
            VISÃO GERAL DA OPERAÇÃO
          </p>

          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.065em] md:text-7xl">
            Olá, {displayName}.

            <span className="block text-primary">
              {organizationId
                ? "Veja o que pede atenção."
                : "Vamos preparar seu espaço."}
            </span>
          </h1>
        </div>

        <p className="max-w-md text-sm leading-7 text-muted">
          {organizationId
            ? "Acompanhe clientes, conversas e entregas em uma única visão, priorizando o que precisa avançar agora."
            : "Antes de cadastrar clientes e projetos, apresente sua empresa para criarmos uma operação protegida no Alinora."}
        </p>
      </section>

      <section className="grid border-b border-ink/20 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(
          (metric, index) => (
            <Link
              key={metric.label}
              href={metric.href}
              className={[
                "group py-8 transition-colors hover:bg-ink/[0.025] sm:px-6 md:py-10",
                index < 3
                  ? "border-b border-ink/20 xl:border-r xl:border-b-0"
                  : "",
                index === 0
                  ? "sm:pl-0"
                  : "",
              ].join(" ")}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                {metric.label}
              </span>

              <strong className="mt-4 block text-4xl font-semibold tracking-[-0.06em] text-primary transition-transform group-hover:translate-x-1">
                {metric.value}
              </strong>
            </Link>
          ),
        )}
      </section>

      {!organizationId ||
      completedSteps < 3 ? (
        <section className="mt-10 border border-ink/20 bg-[#f7f6f0]">
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
              {String(
                completedSteps,
              ).padStart(2, "0")}{" "}
              / 03
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
      ) : (
        <div className="grid gap-8 py-10 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="border border-ink/20 bg-[#f7f6f0]">
            <header className="flex items-center justify-between border-b border-ink/20 px-6 py-5">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
                  FILA OPERACIONAL
                </span>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                  Conversas que pedem atenção
                </h2>
              </div>

              <Link
                href="/dashboard/conversas"
                className="text-xs text-primary hover:underline"
              >
                Ver todas
              </Link>
            </header>

            {recentConversations.length >
            0 ? (
              <div className="divide-y divide-ink/15">
                {recentConversations.map(
                  (conversation) => {
                    const client =
                      clientsById.get(
                        conversation.client_id,
                      );

                    return (
                      <Link
                        key={
                          conversation.id
                        }
                        href={`/dashboard/conversas/${conversation.id}`}
                        className="group grid gap-5 px-6 py-6 transition hover:bg-primary/[0.04] md:grid-cols-[1fr_auto] md:items-center"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-primary">
                              {
                                statusLabels[
                                  conversation.status
                                ]
                              }
                            </span>

                            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-muted">
                              {
                                priorityLabels[
                                  conversation.priority
                                ]
                              }
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-semibold tracking-[-0.035em]">
                            {
                              conversation.title
                            }
                          </h3>

                          <p className="mt-1 text-xs text-muted">
                            {client?.company_name ||
                              client?.name ||
                              "Cliente"}
                          </p>
                        </div>

                        <div className="flex items-center gap-5">
                          <span className="font-mono text-[8px] uppercase text-muted">
                            {formatDate(
                              conversation.updated_at,
                            )}
                          </span>

                          <span
                            aria-hidden="true"
                            className="text-primary transition-transform group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </div>
                      </Link>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-muted">
                  Nenhuma conversa aberta no
                  momento.
                </p>
              </div>
            )}
          </section>

          <aside className="border border-ink/20 bg-[#f7f6f0]">
            <header className="flex items-center justify-between border-b border-ink/20 px-6 py-5">
              <div>
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
                  DECISÕES PENDENTES
                </span>

                <h2 className="mt-2 text-xl font-semibold tracking-[-0.04em]">
                  Aguardando cliente
                </h2>
              </div>

              <Link
                href="/dashboard/entregas"
                className="text-xs text-primary hover:underline"
              >
                Ver todas
              </Link>
            </header>

            {pendingApprovals.length >
            0 ? (
              <div className="divide-y divide-ink/15">
                {pendingApprovals.map(
                  (approval) => {
                    const client =
                      clientsById.get(
                        approval.client_id,
                      );

                    const request =
                      requestsById.get(
                        approval.request_id,
                      );

                    return (
                      <Link
                        key={approval.id}
                        href="/dashboard/entregas"
                        className="group block px-6 py-6 transition hover:bg-primary/[0.04]"
                      >
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-primary">
                          AGUARDANDO APROVAÇÃO
                        </span>

                        <h3 className="mt-3 font-semibold tracking-[-0.03em]">
                          {request?.title ??
                            "Entrega"}
                        </h3>

                        <p className="mt-2 text-xs text-muted">
                          {client?.company_name ||
                            client?.name ||
                            "Cliente"}
                        </p>

                        <div className="mt-4 flex items-center justify-between gap-4">
                          <span className="font-mono text-[8px] uppercase text-muted">
                            {formatDate(
                              approval.requested_at,
                            )}
                          </span>

                          <span
                            aria-hidden="true"
                            className="text-primary transition-transform group-hover:translate-x-1"
                          >
                            →
                          </span>
                        </div>
                      </Link>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="px-6 py-14 text-center">
                <p className="text-sm text-muted">
                  Nenhuma entrega aguardando
                  aprovação.
                </p>
              </div>
            )}
          </aside>
        </div>
      )}

      {organizationId &&
      completedSteps >= 3 ? (
        <section className="grid border border-ink/20 bg-primary text-white md:grid-cols-[1fr_auto] md:items-center">
          <div className="p-7 md:p-9">
            <span className="font-mono text-[9px] uppercase tracking-[0.17em] text-white/65">
              OPERAÇÃO CONECTADA
            </span>

            <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.05em] md:text-4xl">
              Continue transformando contexto
              em decisões claras.
            </h2>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/20 p-7 md:border-t-0 md:border-l md:p-9">
            <Link
              href="/dashboard/conversas"
              className="min-h-11 border border-white/40 px-5 py-3 text-xs transition hover:bg-white hover:text-primary"
            >
              Abrir conversas
            </Link>

            <Link
              href="/dashboard/entregas"
              className="min-h-11 bg-white px-5 py-3 text-xs text-primary transition hover:bg-ink hover:text-white"
            >
              Ver entregas
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}