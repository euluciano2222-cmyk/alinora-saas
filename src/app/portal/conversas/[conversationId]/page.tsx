import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ClientMessageComposer from "./ClientMessageComposer";

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

type MessageSenderType =
  | "team"
  | "client"
  | "system";

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
  waiting_client:
    "Aguardando sua resposta",
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

const statusStyles: Record<
  RequestStatus,
  string
> = {
  received:
    "border-[#566547]/30 bg-[#566547]/10 text-[#566547]",
  ai_review:
    "border-[#74664a]/30 bg-[#d9ad82]/15 text-[#74664a]",
  in_progress:
    "border-[#566547]/30 bg-[#566547]/10 text-[#566547]",
  waiting_client:
    "border-[#9a704a]/35 bg-[#d9ad82]/20 text-[#744b28]",
  completed:
    "border-[#1f231b]/20 bg-[#1f231b]/5 text-[#1f231b]",
  cancelled:
    "border-[#9b3a2a]/25 bg-[#9b3a2a]/5 text-[#9b3a2a]",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "pt-BR",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(new Date(value));
}

function getSenderLabel(
  senderType: MessageSenderType,
) {
  if (senderType === "team") {
    return "Equipe";
  }

  if (senderType === "client") {
    return "Você";
  }

  return "Sistema";
}

export default async function ClientConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } =
    await params;

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/portal/conversas/${conversationId}`,
      )}`,
    );
  }

  const {
    data: conversation,
    error: conversationError,
  } = await supabase
    .from("requests")
    .select(
      "id, organization_id, client_id, project_id, title, original_message, summary, status, priority, source, created_at, updated_at, due_at, completed_at",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (
    conversationError ||
    !conversation
  ) {
    notFound();
  }

  const [
    accessResult,
    organizationResult,
    clientResult,
    projectResult,
    messagesResult,
  ] = await Promise.all([
    supabase
      .from("client_access")
      .select("id, role, status")
      .eq(
        "organization_id",
        conversation.organization_id,
      )
      .eq(
        "client_id",
        conversation.client_id,
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle(),

    supabase
      .from("organizations")
      .select("id, name")
      .eq(
        "id",
        conversation.organization_id,
      )
      .maybeSingle(),

    supabase
      .from("clients")
      .select(
        "id, name, company_name",
      )
      .eq(
        "id",
        conversation.client_id,
      )
      .maybeSingle(),

    conversation.project_id
      ? supabase
          .from("projects")
          .select("id, name")
          .eq(
            "id",
            conversation.project_id,
          )
          .maybeSingle()
      : Promise.resolve({
          data: null,
          error: null,
        }),

    supabase
      .from("request_messages")
      .select(
        "id, body, sender_type, is_internal, created_at",
      )
      .eq(
        "request_id",
        conversation.id,
      )
      .eq(
        "organization_id",
        conversation.organization_id,
      )
      .eq("is_internal", false)
      .order("created_at", {
        ascending: true,
      }),
  ]);

  if (
    accessResult.error ||
    !accessResult.data
  ) {
    notFound();
  }

  const organization =
    organizationResult.data;

  const client = clientResult.data;
  const project = projectResult.data;

  const messages =
    messagesResult.data ?? [];

  const status =
    conversation.status as RequestStatus;

  const priority =
    conversation.priority as RequestPriority;

  const conversationClosed =
    status === "completed" ||
    status === "cancelled";

  return (
    <main className="mx-auto min-h-[calc(100vh-161px)] max-w-7xl px-5 py-10 md:px-10 md:py-14">
      <header className="flex flex-col gap-5 border-b border-[#1f231b]/20 pb-7 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/portal/conversas"
          className="inline-flex items-center gap-3 text-xs text-[#566547] transition hover:text-[#1f231b]"
        >
          <span aria-hidden="true">
            ←
          </span>

          Voltar para conversas
        </Link>

        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#62675d]">
          CONVERSA /{" "}
          {conversation.id
            .slice(0, 8)
            .toUpperCase()}
        </span>
      </header>

      <div className="grid gap-7 py-8 lg:grid-cols-[1fr_330px] lg:items-start">
        <section className="border border-[#1f231b]/20 bg-[#f7f6f0]">
          <header className="border-b border-[#1f231b]/20 px-6 py-8 md:px-10 md:py-10">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#566547]">
                  {organization?.name ??
                    "Organização"}
                  {" · "}
                  {client?.company_name ||
                    client?.name ||
                    "Cliente"}
                </span>

                <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-none tracking-[-0.06em] md:text-6xl">
                  {conversation.title}
                </h1>

                {project ? (
                  <p className="mt-4 text-sm text-[#62675d]">
                    Projeto:{" "}
                    <strong className="font-medium text-[#1f231b]">
                      {project.name}
                    </strong>
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <span className="border border-[#1f231b]/20 px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em]">
                  {
                    priorityLabels[
                      priority
                    ]
                  }
                </span>

                <span
                  className={[
                    "border px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em]",
                    statusStyles[status],
                  ].join(" ")}
                >
                  {statusLabels[status]}
                </span>
              </div>
            </div>
          </header>

          <div className="px-6 py-8 md:px-10">
            <article className="max-w-3xl border border-[#1f231b]/15 bg-[#e8e9e3] px-5 py-5">
              <header className="flex flex-wrap items-center justify-between gap-4">
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#566547]">
                  MENSAGEM INICIAL
                </span>

                <time className="font-mono text-[8px] uppercase tracking-[0.1em] text-[#62675d]">
                  {formatDate(
                    conversation.created_at,
                  )}
                </time>
              </header>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                {
                  conversation.original_message
                }
              </p>
            </article>

            {messages.length > 0 ? (
              <div className="mt-8 space-y-5">
                {messages.map(
                  (message) => {
                    const senderType =
                      message.sender_type as MessageSenderType;

                    const isClient =
                      senderType ===
                      "client";

                    const isSystem =
                      senderType ===
                      "system";

                    return (
                      <article
                        key={message.id}
                        className={[
                          "max-w-3xl border px-5 py-5",
                          isClient
                            ? "ml-auto border-[#566547] bg-[#566547] text-white"
                            : isSystem
                              ? "mx-auto border-[#1f231b]/15 bg-transparent text-[#62675d]"
                              : "mr-auto border-[#1f231b]/15 bg-[#e8e9e3]",
                        ].join(" ")}
                      >
                        <header className="flex flex-wrap items-center justify-between gap-4">
                          <span
                            className={[
                              "font-mono text-[8px] uppercase tracking-[0.14em]",
                              isClient
                                ? "text-white/75"
                                : "text-[#566547]",
                            ].join(" ")}
                          >
                            {getSenderLabel(
                              senderType,
                            )}
                          </span>

                          <time
                            className={[
                              "font-mono text-[8px] uppercase tracking-[0.1em]",
                              isClient
                                ? "text-white/65"
                                : "text-[#62675d]",
                            ].join(" ")}
                          >
                            {formatDate(
                              message.created_at,
                            )}
                          </time>
                        </header>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-7">
                          {message.body}
                        </p>
                      </article>
                    );
                  },
                )}
              </div>
            ) : (
              <div className="mt-8 border border-dashed border-[#1f231b]/20 px-5 py-10 text-center">
                <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#566547]">
                  HISTÓRICO INICIADO
                </span>

                <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[#62675d]">
                  As próximas mensagens da
                  equipe e suas respostas
                  aparecerão aqui.
                </p>
              </div>
            )}
          </div>

          <ClientMessageComposer
            conversationId={
              conversation.id
            }
            disabled={
              conversationClosed
            }
          />
        </section>

        <aside className="border border-[#1f231b]/20 bg-[#f7f6f0] p-6">
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#566547]">
            CONTEXTO DA CONVERSA
          </span>

          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
            Informações
          </h2>

          <dl className="mt-7 divide-y divide-[#1f231b]/15 border-y border-[#1f231b]/15">
            <div className="grid grid-cols-[90px_1fr] gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                Cliente
              </dt>

              <dd className="text-xs font-medium">
                {client?.name ??
                  "Não informado"}
              </dd>
            </div>

            <div className="grid grid-cols-[90px_1fr] gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                Projeto
              </dt>

              <dd className="text-xs font-medium">
                {project?.name ??
                  "Sem projeto específico"}
              </dd>
            </div>

            <div className="grid grid-cols-[90px_1fr] gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                Status
              </dt>

              <dd className="text-xs font-medium">
                {statusLabels[status]}
              </dd>
            </div>

            <div className="grid grid-cols-[90px_1fr] gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                Criada
              </dt>

              <dd className="text-xs font-medium leading-5">
                {formatDate(
                  conversation.created_at,
                )}
              </dd>
            </div>

            <div className="grid grid-cols-[90px_1fr] gap-4 py-4">
              <dt className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                Atualizada
              </dt>

              <dd className="text-xs font-medium leading-5">
                {formatDate(
                  conversation.updated_at,
                )}
              </dd>
            </div>
          </dl>

          <p className="mt-6 text-xs leading-6 text-[#62675d]">
            Notas internas da equipe nunca
            são exibidas no portal do
            cliente.
          </p>
        </aside>
      </div>
    </main>
  );
}