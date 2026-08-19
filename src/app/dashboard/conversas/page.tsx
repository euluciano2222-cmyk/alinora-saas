import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ConversationForm from "./ConversationForm";
import styles from "./conversas.module.css";

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

type ConversationFilter =
  | "all"
  | "open"
  | "waiting_client"
  | "completed"
  | "urgent";

type ClientRecord = {
  id: string;
  name: string;
  company: string | null;
  status: string;
};

type ProjectRecord = {
  id: string;
  client_id: string;
  name: string;
  status: string;
};

type ConversationRecord = {
  id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  original_message: string;
  status: RequestStatus;
  priority: RequestPriority;
  source: string;
  created_at: string;
  updated_at: string;
};

type ConversationsPageProps = {
  searchParams: Promise<{
    status?: string | string[];
  }>;
};

const statusLabels: Record<RequestStatus, string> = {
  received: "Recebida",
  ai_review: "Em análise",
  in_progress: "Em andamento",
  waiting_client: "Aguardando cliente",
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

const statusClassNames: Record<
  RequestStatus,
  string
> = {
  received: "statusReceived",
  ai_review: "statusReview",
  in_progress: "statusProgress",
  waiting_client: "statusWaiting",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

const priorityClassNames: Record<
  RequestPriority,
  string
> = {
  low: "priorityLow",
  normal: "priorityNormal",
  high: "priorityHigh",
  urgent: "priorityUrgent",
};

const allowedFilters: ConversationFilter[] = [
  "all",
  "open",
  "waiting_client",
  "completed",
  "urgent",
];

const filters: Array<{
  value: ConversationFilter;
  label: string;
}> = [
  {
    value: "all",
    label: "Todas",
  },
  {
    value: "open",
    label: "Em aberto",
  },
  {
    value: "waiting_client",
    label: "Aguardando",
  },
  {
    value: "completed",
    label: "Concluídas",
  },
  {
    value: "urgent",
    label: "Urgentes",
  },
];

function formatNumber(value: number) {
  return String(value).padStart(2, "0");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getExcerpt(message: string) {
  const normalizedMessage = message.replace(
    /\s+/g,
    " ",
  );

  if (normalizedMessage.length <= 150) {
    return normalizedMessage;
  }

  return `${normalizedMessage.slice(0, 147)}…`;
}

export default async function ConversationsPage({
  searchParams,
}: ConversationsPageProps) {
  const supabase = await createClient();
  const params = await searchParams;

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    redirect("/dashboard/configuracoes");
  }

  const organizationId =
    membership.organization_id;

  const [
    clientsResult,
    projectsResult,
    conversationsResult,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, company:company_name, status",
      )
      .eq("organization_id", organizationId)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("projects")
      .select("id, client_id, name, status")
      .eq("organization_id", organizationId)
      .order("name", {
        ascending: true,
      }),

    supabase
      .from("requests")
      .select(
        `
          id,
          client_id,
          project_id,
          title,
          original_message,
          status,
          priority,
          source,
          created_at,
          updated_at
        `,
      )
      .eq("organization_id", organizationId)
      .order("updated_at", {
        ascending: false,
      }),
  ]);

  const clients =
    (clientsResult.data ?? []) as ClientRecord[];

  const projects =
    (projectsResult.data ?? []) as ProjectRecord[];

  const conversations =
    (conversationsResult.data ??
      []) as ConversationRecord[];

  const loadError = Boolean(
    clientsResult.error ||
      projectsResult.error ||
      conversationsResult.error,
  );

  const activeClients = clients
    .filter(
      (client) => client.status === "active",
    )
    .map((client) => ({
      id: client.id,
      name: client.name,
      company: client.company,
    }));

  const availableProjects = projects
    .filter(
      (project) =>
        project.status !== "archived",
    )
    .map((project) => ({
      id: project.id,
      clientId: project.client_id,
      name: project.name,
    }));

  const clientsById = new Map(
    clients.map((client) => [
      client.id,
      client,
    ]),
  );

  const projectsById = new Map(
    projects.map((project) => [
      project.id,
      project,
    ]),
  );

  const requestedFilter = Array.isArray(
    params.status,
  )
    ? params.status[0]
    : params.status;

  const currentFilter = allowedFilters.includes(
    requestedFilter as ConversationFilter,
  )
    ? (requestedFilter as ConversationFilter)
    : "all";

  const openConversations =
    conversations.filter(
      (conversation) =>
        conversation.status !== "completed" &&
        conversation.status !== "cancelled",
    );

  const waitingConversations =
    conversations.filter(
      (conversation) =>
        conversation.status ===
        "waiting_client",
    );

  const urgentConversations =
    conversations.filter(
      (conversation) =>
        conversation.priority === "urgent" &&
        conversation.status !== "completed" &&
        conversation.status !== "cancelled",
    );

  const completedConversations =
    conversations.filter(
      (conversation) =>
        conversation.status === "completed",
    );

  const filteredConversations =
    conversations.filter((conversation) => {
      if (currentFilter === "all") {
        return true;
      }

      if (currentFilter === "open") {
        return (
          conversation.status !== "completed" &&
          conversation.status !== "cancelled"
        );
      }

      if (currentFilter === "urgent") {
        return (
          conversation.priority === "urgent" &&
          conversation.status !== "completed" &&
          conversation.status !== "cancelled"
        );
      }

      return (
        conversation.status === currentFilter
      );
    });

  return (
    <main className={styles.page}>
      <header className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <span className={styles.eyebrow}>
            Conversas / Contexto centralizado
          </span>

          <h1>
            Nenhuma decisão
            <br />
            <span>fica perdida.</span>
          </h1>
        </div>

        <p className={styles.headerDescription}>
          Transforme mensagens em históricos claros,
          conectados aos clientes e projetos que dão
          sentido a cada decisão.
        </p>
      </header>

      <section
        className={styles.statsGrid}
        aria-label="Resumo das conversas"
      >
        <article className={styles.statCard}>
          <span>Total de conversas</span>
          <strong>
            {formatNumber(conversations.length)}
          </strong>
        </article>

        <article className={styles.statCard}>
          <span>Em aberto</span>
          <strong>
            {formatNumber(
              openConversations.length,
            )}
          </strong>
        </article>

        <article className={styles.statCard}>
          <span>Aguardando cliente</span>
          <strong>
            {formatNumber(
              waitingConversations.length,
            )}
          </strong>
        </article>

        <article className={styles.statCard}>
          <span>Prioridade urgente</span>
          <strong>
            {formatNumber(
              urgentConversations.length,
            )}
          </strong>
        </article>
      </section>

      {loadError ? (
        <p
          className={styles.errorMessage}
          role="alert"
        >
          Não foi possível carregar todos os dados das
          conversas. Atualize a página e tente novamente.
        </p>
      ) : null}

      <ConversationForm
        clients={activeClients}
        projects={availableProjects}
      />

      <section className={styles.conversationsSection}>
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.eyebrow}>
              Histórico operacional
            </span>

            <h2>Conversas da organização</h2>
          </div>

          <nav
            className={styles.filters}
            aria-label="Filtrar conversas"
          >
            {filters.map((filter) => {
              const isActive =
                currentFilter === filter.value;

              return (
                <Link
                  key={filter.value}
                  href={
                    filter.value === "all"
                      ? "/dashboard/conversas"
                      : `/dashboard/conversas?status=${filter.value}`
                  }
                  className={`${
                    styles.filterLink
                  } ${
                    isActive
                      ? styles.activeFilter
                      : ""
                  }`}
                  aria-current={
                    isActive
                      ? "page"
                      : undefined
                  }
                >
                  {filter.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {filteredConversations.length > 0 ? (
          <div className={styles.conversationList}>
            {filteredConversations.map(
              (conversation, index) => {
                const client = clientsById.get(
                  conversation.client_id,
                );

                const project =
                  conversation.project_id
                    ? projectsById.get(
                        conversation.project_id,
                      )
                    : null;

                return (
                  <Link
                    key={conversation.id}
                    href={`/dashboard/conversas/${conversation.id}`}
                    className={
                      styles.conversationCard
                    }
                  >
                    <div
                      className={
                        styles.conversationIndex
                      }
                    >
                      {formatNumber(index + 1)}
                    </div>

                    <div
                      className={
                        styles.conversationMain
                      }
                    >
                      <div
                        className={
                          styles.conversationMeta
                        }
                      >
                        <span>
                          {client?.company ||
                            client?.name ||
                            "Cliente não encontrado"}
                        </span>

                        {project ? (
                          <>
                            <span
                              aria-hidden="true"
                            >
                              /
                            </span>

                            <span>
                              {project.name}
                            </span>
                          </>
                        ) : null}
                      </div>

                      <h3>{conversation.title}</h3>

                      <p>
                        {getExcerpt(
                          conversation.original_message,
                        )}
                      </p>
                    </div>

                    <div
                      className={
                        styles.conversationState
                      }
                    >
                      <span
                        className={`${
                          styles.priorityBadge
                        } ${
                          styles[
                            priorityClassNames[
                              conversation.priority
                            ]
                          ]
                        }`}
                      >
                        {
                          priorityLabels[
                            conversation.priority
                          ]
                        }
                      </span>

                      <span
                        className={`${
                          styles.statusBadge
                        } ${
                          styles[
                            statusClassNames[
                              conversation.status
                            ]
                          ]
                        }`}
                      >
                        {
                          statusLabels[
                            conversation.status
                          ]
                        }
                      </span>
                    </div>

                    <div
                      className={
                        styles.conversationDate
                      }
                    >
                      <span>Atualizada</span>

                      <strong>
                        {formatDate(
                          conversation.updated_at,
                        )}
                      </strong>
                    </div>

                    <span
                      className={
                        styles.conversationArrow
                      }
                      aria-hidden="true"
                    >
                      →
                    </span>
                  </Link>
                );
              },
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div>
              <span>00 / Conversas</span>

              <h3>
                {currentFilter === "all"
                  ? "O próximo diálogo começa aqui."
                  : "Nenhuma conversa neste filtro."}
              </h3>

              <p>
                {currentFilter === "all"
                  ? "Use o formulário acima para registrar a primeira conversa da organização."
                  : "Escolha outro filtro ou atualize o estado de uma conversa existente."}
              </p>
            </div>
          </div>
        )}

        <footer className={styles.sectionFooter}>
          <span>
            {formatNumber(
              filteredConversations.length,
            )}{" "}
            exibidas
          </span>

          <span>
            {formatNumber(
              completedConversations.length,
            )}{" "}
            concluídas
          </span>
        </footer>
      </section>
    </main>
  );
}