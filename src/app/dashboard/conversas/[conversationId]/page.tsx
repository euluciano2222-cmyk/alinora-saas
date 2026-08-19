import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import {
  MessageComposer,
  StatusControl,
} from "./ConversationControls";

import styles from "../conversas.module.css";

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

type RequestSource =
  | "manual"
  | "email"
  | "whatsapp"
  | "portal"
  | "other";

type MessageSenderType =
  | "team"
  | "client"
  | "system";

type ConversationRecord = {
  id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  original_message: string;
  summary: string | null;
  status: RequestStatus;
  priority: RequestPriority;
  source: RequestSource;
  created_at: string;
  updated_at: string;
  due_at: string | null;
  completed_at: string | null;
};

type ClientRecord = {
  id: string;
  name: string;
  company_name: string | null;
  status: string;
};

type ProjectRecord = {
  id: string;
  name: string;
  status: string;
};

type MessageRecord = {
  id: string;
  request_id: string;
  body: string;
  sender_type: MessageSenderType;
  is_internal: boolean;
  author_user_id: string | null;
  author_client_id: string | null;
  author_client_access_id: string | null;
  created_at: string;
};

type ConversationPageProps = {
  params: Promise<{
    conversationId: string;
  }>;
};

const statusLabels: Record<
  RequestStatus,
  string
> = {
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

const sourceLabels: Record<
  RequestSource,
  string
> = {
  manual: "Cadastro manual",
  email: "E-mail",
  whatsapp: "WhatsApp",
  portal: "Portal do cliente",
  other: "Outro canal",
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

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getSenderLabel(
  message: MessageRecord,
) {
  if (message.is_internal) {
    return "Nota interna";
  }

  if (message.sender_type === "team") {
    return "Equipe";
  }

  if (message.sender_type === "client") {
    return "Cliente";
  }

  return "Sistema";
}

function getMessageClassName(
  message: MessageRecord,
) {
  const classNames = [styles.message];

  if (message.is_internal) {
    classNames.push(styles.internalMessage);

    return classNames.join(" ");
  }

  if (message.sender_type === "team") {
    classNames.push(styles.messageTeam);
  }

  if (message.sender_type === "client") {
    classNames.push(styles.messageClient);
  }

  if (message.sender_type === "system") {
    classNames.push(styles.messageSystem);
  }

  return classNames.join(" ");
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;
  const supabase = await createClient();

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

  const {
    data: conversationData,
    error: conversationError,
  } = await supabase
    .from("requests")
    .select(
      `
        id,
        client_id,
        project_id,
        title,
        original_message,
        summary,
        status,
        priority,
        source,
        created_at,
        updated_at,
        due_at,
        completed_at
      `,
    )
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (
    conversationError ||
    !conversationData
  ) {
    notFound();
  }

  const conversation =
    conversationData as ConversationRecord;

  const clientPromise = supabase
    .from("clients")
    .select(
      "id, name, company_name, status",
    )
    .eq("id", conversation.client_id)
    .eq("organization_id", organizationId)
    .maybeSingle();

  const projectPromise =
    conversation.project_id
      ? supabase
          .from("projects")
          .select("id, name, status")
          .eq(
            "id",
            conversation.project_id,
          )
          .eq(
            "organization_id",
            organizationId,
          )
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        });

  const messagesPromise = supabase
    .from("request_messages")
    .select(
      `
        id,
        request_id,
        body,
        sender_type,
        is_internal,
        author_user_id,
        author_client_id,
        author_client_access_id,
        created_at
      `,
    )
    .eq("request_id", conversationId)
    .eq("organization_id", organizationId)
    .order("created_at", {
      ascending: true,
    });

  const [
    clientResult,
    projectResult,
    messagesResult,
  ] = await Promise.all([
    clientPromise,
    projectPromise,
    messagesPromise,
  ]);

  const client =
    clientResult.data as ClientRecord | null;

  const project =
    projectResult.data as ProjectRecord | null;

  const messages =
    (messagesResult.data ??
      []) as MessageRecord[];

  const relatedDataError = Boolean(
    clientResult.error ||
      projectResult.error ||
      messagesResult.error,
  );

  const clientDisplayName =
    client?.company_name ||
    client?.name ||
    "Cliente não encontrado";

  return (
    <main className={styles.detailPage}>
      <header className={styles.detailTopbar}>
        <Link
          href="/dashboard/conversas"
          className={styles.backLink}
        >
          <span aria-hidden="true">←</span>

          Voltar para conversas
        </Link>

        <span className={styles.detailNumber}>
          Conversa /{" "}
          {conversation.id
            .slice(0, 8)
            .toUpperCase()}
        </span>
      </header>

      {relatedDataError ? (
        <p
          className={styles.errorMessage}
          role="alert"
        >
          Parte dos dados relacionados não pôde
          ser carregada. Atualize a página e tente
          novamente.
        </p>
      ) : null}

      <div className={styles.detailLayout}>
        <section
          className={styles.threadPanel}
          aria-labelledby="conversation-title"
        >
          <header className={styles.threadHeader}>
            <div className={styles.threadIdentity}>
              <div>
                <span className={styles.eyebrow}>
                  {clientDisplayName}
                  {project
                    ? ` / ${project.name}`
                    : ""}
                </span>

                <h1 id="conversation-title">
                  {conversation.title}
                </h1>
              </div>

              <div
                className={styles.threadBadges}
                aria-label="Estado da conversa"
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
            </div>
          </header>

          <div
            className={styles.timeline}
            aria-label="Histórico da conversa"
          >
            <article
              className={`${styles.message} ${styles.messageInitial}`}
            >
              <header
                className={styles.messageHeader}
              >
                <span>Mensagem inicial</span>

                <time
                  dateTime={
                    conversation.created_at
                  }
                >
                  {formatDate(
                    conversation.created_at,
                  )}
                </time>
              </header>

              <p className={styles.messageBody}>
                {conversation.original_message}
              </p>
            </article>

            {messages.map((message) => (
              <article
                key={message.id}
                className={getMessageClassName(
                  message,
                )}
              >
                <header
                  className={styles.messageHeader}
                >
                  <span>
                    {getSenderLabel(message)}
                  </span>

                  <time
                    dateTime={message.created_at}
                  >
                    {formatDate(
                      message.created_at,
                    )}
                  </time>
                </header>

                <p className={styles.messageBody}>
                  {message.body}
                </p>
              </article>
            ))}
          </div>

          <MessageComposer
            conversationId={conversation.id}
          />
        </section>

        <aside
          className={styles.sidePanel}
          aria-label="Contexto da conversa"
        >
          <section className={styles.contextCard}>
            <span className={styles.eyebrow}>
              Contexto conectado
            </span>

            <h2>Informações</h2>

            <div className={styles.contextRows}>
              <div className={styles.contextRow}>
                <span>Cliente</span>

                <strong>
                  {clientDisplayName}
                </strong>
              </div>

              <div className={styles.contextRow}>
                <span>Contato</span>

                <strong>
                  {client?.name ||
                    "Não informado"}
                </strong>
              </div>

              <div className={styles.contextRow}>
                <span>Projeto</span>

                <strong>
                  {project?.name ||
                    "Sem projeto específico"}
                </strong>
              </div>

              <div className={styles.contextRow}>
                <span>Origem</span>

                <strong>
                  {
                    sourceLabels[
                      conversation.source
                    ]
                  }
                </strong>
              </div>

              <div className={styles.contextRow}>
                <span>Criada</span>

                <strong>
                  {formatDate(
                    conversation.created_at,
                  )}
                </strong>
              </div>

              <div className={styles.contextRow}>
                <span>Atualizada</span>

                <strong>
                  {formatDate(
                    conversation.updated_at,
                  )}
                </strong>
              </div>

              <div className={styles.contextRow}>
                <span>Prazo</span>

                <strong>
                  {conversation.due_at
                    ? formatDate(
                        conversation.due_at,
                      )
                    : "Não definido"}
                </strong>
              </div>
            </div>
          </section>

          <StatusControl
            conversationId={conversation.id}
            currentStatus={
              conversation.status
            }
          />
        </aside>
      </div>
    </main>
  );
}