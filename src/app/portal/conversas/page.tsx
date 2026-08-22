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

export default async function ClientConversationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      "/login?next=/portal/conversas",
    );
  }

  const {
    data: activeAccesses,
    error: accessesError,
  } = await supabase
    .from("client_access")
    .select(
      "organization_id, client_id",
    )
    .eq("user_id", user.id)
    .eq("status", "active");

  if (accessesError) {
    console.error(
      "Erro ao carregar acessos:",
      accessesError,
    );
  }

  if (
    !activeAccesses ||
    activeAccesses.length === 0
  ) {
    redirect("/portal");
  }

  const organizationIds = [
    ...new Set(
      activeAccesses.map(
        (access) =>
          access.organization_id,
      ),
    ),
  ];

  const clientIds = [
    ...new Set(
      activeAccesses.map(
        (access) => access.client_id,
      ),
    ),
  ];

  const [
    conversationsResult,
    organizationsResult,
    clientsResult,
  ] = await Promise.all([
    supabase
      .from("requests")
      .select(
        "id, organization_id, client_id, project_id, title, summary, status, priority, created_at, updated_at",
      )
      .in(
        "organization_id",
        organizationIds,
      )
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("organizations")
      .select("id, name")
      .in("id", organizationIds),

    supabase
      .from("clients")
      .select(
        "id, name, company_name",
      )
      .in("id", clientIds),
  ]);

  if (conversationsResult.error) {
    console.error(
      "Erro ao carregar conversas:",
      conversationsResult.error,
    );
  }

  const conversations =
    conversationsResult.data ?? [];

  const projectIds = [
    ...new Set(
      conversations
        .map(
          (conversation) =>
            conversation.project_id,
        )
        .filter(
          (
            projectId,
          ): projectId is string =>
            Boolean(projectId),
        ),
    ),
  ];

  const conversationIds =
    conversations.map(
      (conversation) =>
        conversation.id,
    );

  const [
    projectsResult,
    messagesResult,
  ] = await Promise.all([
    projectIds.length > 0
      ? supabase
          .from("projects")
          .select("id, name")
          .in("id", projectIds)
      : Promise.resolve({
          data: [],
          error: null,
        }),

    conversationIds.length > 0
      ? supabase
          .from("request_messages")
          .select(
            "request_id, sender_type, created_at",
          )
          .in(
            "request_id",
            conversationIds,
          )
          .eq("is_internal", false)
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);

  if (projectsResult.error) {
    console.error(
      "Erro ao carregar projetos:",
      projectsResult.error,
    );
  }

  if (messagesResult.error) {
    console.error(
      "Erro ao carregar mensagens:",
      messagesResult.error,
    );
  }

  const organizationsById = new Map(
    (
      organizationsResult.data ?? []
    ).map((organization) => [
      organization.id,
      organization,
    ]),
  );

  const clientsById = new Map(
    (clientsResult.data ?? []).map(
      (client) => [
        client.id,
        client,
      ],
    ),
  );

  const projectsById = new Map(
    (
      projectsResult.data ?? []
    ).map((project) => [
      project.id,
      project,
    ]),
  );

  const messages =
    messagesResult.data ?? [];

  const totalConversations =
    conversations.length;

  const openConversations =
    conversations.filter(
      (conversation) =>
        conversation.status !==
          "completed" &&
        conversation.status !==
          "cancelled",
    ).length;

  const waitingConversations =
    conversations.filter(
      (conversation) =>
        conversation.status ===
        "waiting_client",
    ).length;

  const completedConversations =
    conversations.filter(
      (conversation) =>
        conversation.status ===
        "completed",
    ).length;

  return (
    <main className="mx-auto min-h-[calc(100vh-161px)] max-w-7xl px-5 py-12 md:px-10 md:py-16">
      <header className="grid gap-8 border-b border-[#1f231b]/20 pb-12 lg:grid-cols-[1fr_0.65fr] lg:items-end">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#566547]">
            COMUNICAÇÃO CONECTADA
          </span>

          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.065em] md:text-7xl">
            Cada conversa.
            <span className="block text-[#566547]">
              Todo o contexto.
            </span>
          </h1>
        </div>

        <p className="max-w-md text-sm leading-7 text-[#62675d]">
          Acompanhe solicitações, consulte o
          histórico e responda diretamente à
          equipe responsável.
        </p>
      </header>

      <section className="grid border-b border-[#1f231b]/20 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "TOTAL",
            totalConversations,
          ],
          [
            "EM ABERTO",
            openConversations,
          ],
          [
            "AGUARDANDO VOCÊ",
            waitingConversations,
          ],
          [
            "CONCLUÍDAS",
            completedConversations,
          ],
        ].map(
          ([label, value], index) => (
            <div
              key={String(label)}
              className={[
                "py-7 sm:px-5",
                index < 3
                  ? "border-b border-[#1f231b]/20 lg:border-r lg:border-b-0"
                  : "",
                index === 0
                  ? "sm:pl-0"
                  : "",
              ].join(" ")}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#62675d]">
                {label}
              </span>

              <strong className="mt-3 block text-4xl font-medium tracking-[-0.06em] text-[#566547]">
                {String(value).padStart(
                  2,
                  "0",
                )}
              </strong>
            </div>
          ),
        )}
      </section>

      <section className="py-12">
        <header className="flex flex-col gap-4 border-b border-[#1f231b]/20 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#566547]">
              HISTÓRICO OPERACIONAL
            </span>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              Conversas disponíveis
            </h2>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#62675d]">
            {String(
              totalConversations,
            ).padStart(2, "0")}{" "}
            REGISTRADAS
          </span>
        </header>

        {conversations.length > 0 ? (
          <div className="mt-8 divide-y divide-[#1f231b]/15 border-y border-[#1f231b]/20">
            {conversations.map(
              (conversation) => {
                const status =
                  conversation.status as RequestStatus;

                const organization =
                  organizationsById.get(
                    conversation.organization_id,
                  );

                const client =
                  clientsById.get(
                    conversation.client_id,
                  );

                const project =
                  conversation.project_id
                    ? projectsById.get(
                        conversation.project_id,
                      )
                    : null;

                const conversationMessages =
                  messages.filter(
                    (message) =>
                      message.request_id ===
                      conversation.id,
                  );

                const latestMessage =
                  conversationMessages
                    .slice()
                    .sort(
                      (first, second) =>
                        new Date(
                          second.created_at,
                        ).getTime() -
                        new Date(
                          first.created_at,
                        ).getTime(),
                    )[0];

                return (
                  <article
                    key={conversation.id}
                    className="grid gap-6 py-7 lg:grid-cols-[1fr_auto] lg:items-center"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={[
                            "border px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em]",
                            statusStyles[
                              status
                            ],
                          ].join(" ")}
                        >
                          {
                            statusLabels[
                              status
                            ]
                          }
                        </span>

                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                          {organization?.name ??
                            "Organização"}
                          {" · "}
                          {client?.name ??
                            "Cliente"}
                        </span>
                      </div>

                      <h3 className="mt-4 text-2xl font-semibold tracking-[-0.045em] md:text-3xl">
                        {conversation.title}
                      </h3>

                      <p className="mt-2 text-xs text-[#62675d]">
                        {project?.name ??
                          "Sem projeto específico"}
                      </p>

                      {conversation.summary ? (
                        <p className="mt-4 max-w-3xl text-sm leading-7 text-[#62675d]">
                          {
                            conversation.summary
                          }
                        </p>
                      ) : null}

                      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[8px] uppercase tracking-[0.1em] text-[#62675d]">
                        <span>
                          {
                            conversationMessages.length
                          }{" "}
                          MENSAGENS
                        </span>

                        <span>
                          ATUALIZADA{" "}
                          {formatDate(
                            latestMessage?.created_at ??
                              conversation.updated_at,
                          )}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/portal/conversas/${conversation.id}`}
                      className="flex min-h-11 w-fit min-w-40 items-center justify-between gap-6 bg-[#566547] px-5 text-xs text-white transition hover:bg-[#1f231b]"
                    >
                      <span>
                        Abrir conversa
                      </span>

                      <span aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-[#1f231b]/25 bg-[#f7f6f0] px-6 py-16 text-center">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#566547]">
              NENHUMA CONVERSA
            </span>

            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
              Seu histórico aparecerá aqui.
            </h3>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#62675d]">
              Quando a equipe iniciar uma
              conversa vinculada ao seu
              cliente, ela ficará disponível
              neste portal.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}