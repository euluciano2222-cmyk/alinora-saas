import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import ApprovalResponseForm from "./ApprovalResponseForm";

type ApprovalStatus =
  | "pending"
  | "approved"
  | "changes_requested"
  | "cancelled";

const statusLabels: Record<
  ApprovalStatus,
  string
> = {
  pending: "Aguardando sua resposta",
  approved: "Aprovada",
  changes_requested:
    "Alterações solicitadas",
  cancelled: "Cancelada",
};

const statusStyles: Record<
  ApprovalStatus,
  string
> = {
  pending:
    "border-[#8a7048]/30 bg-[#d9ad82]/15 text-[#744b28]",
  approved:
    "border-[#566547]/30 bg-[#566547]/10 text-[#566547]",
  changes_requested:
    "border-[#9b3a2a]/30 bg-[#9b3a2a]/5 text-[#9b3a2a]",
  cancelled:
    "border-[#1f231b]/20 bg-[#1f231b]/5 text-[#62675d]",
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

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/portal");
  }

  const {
    data: activeAccesses,
    error: accessesError,
  } = await supabase
    .from("client_access")
    .select(
      "id, organization_id, client_id, email, role, status, accepted_at",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("accepted_at", {
      ascending: false,
    });

  if (accessesError) {
    console.error(
      "Erro ao carregar acessos do portal:",
      accessesError,
    );
  }

  if (
    !activeAccesses ||
    activeAccesses.length === 0
  ) {
    return (
      <main className="mx-auto min-h-[calc(100vh-161px)] max-w-7xl px-5 py-16 md:px-10">
        <section className="border border-[#1f231b]/20 bg-[#f7f6f0] px-6 py-20 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#566547]">
            NENHUM ACESSO ATIVO
          </span>

          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-semibold leading-none tracking-[-0.055em] md:text-6xl">
            Seu portal começa com um convite.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-[#62675d]">
            Solicite à equipe responsável
            um link de acesso e confirme que
            o convite foi criado utilizando
            este mesmo endereço de e-mail:
          </p>

          <strong className="mt-5 block break-all text-lg">
            {user.email}
          </strong>
        </section>
      </main>
    );
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
    organizationsResult,
    clientsResult,
    approvalsResult,
  ] = await Promise.all([
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

    supabase
      .from("approvals")
      .select(
        "id, organization_id, client_id, request_id, message, response_note, status, requested_at, responded_at",
      )
      .in(
        "organization_id",
        organizationIds,
      )
      .order("requested_at", {
        ascending: false,
      }),
  ]);

  if (organizationsResult.error) {
    console.error(
      "Erro ao carregar organizações:",
      organizationsResult.error,
    );
  }

  if (clientsResult.error) {
    console.error(
      "Erro ao carregar clientes:",
      clientsResult.error,
    );
  }

  if (approvalsResult.error) {
    console.error(
      "Erro ao carregar entregas:",
      approvalsResult.error,
    );
  }

  const approvals =
    approvalsResult.data ?? [];

  const requestIds = [
    ...new Set(
      approvals.map(
        (approval) =>
          approval.request_id,
      ),
    ),
  ];

  const requestsResult =
    requestIds.length > 0
      ? await supabase
          .from("requests")
          .select(
            "id, title, project_id, updated_at",
          )
          .in("id", requestIds)
      : {
          data: [],
          error: null,
        };

  if (requestsResult.error) {
    console.error(
      "Erro ao carregar conversas:",
      requestsResult.error,
    );
  }

  const attachmentsResult =
    requestIds.length > 0
      ? await supabase
          .from("attachments")
          .select(
            "id, request_id, file_name, file_size_bytes, mime_type, storage_bucket, storage_path, created_at",
          )
          .in("request_id", requestIds)
          .eq("is_internal", false)
          .order("created_at", {
            ascending: false,
          })
      : {
          data: [],
          error: null,
        };

  if (attachmentsResult.error) {
    console.error(
      "Erro ao carregar arquivos:",
      attachmentsResult.error,
    );
  }

  const attachmentsWithLinks =
    await Promise.all(
      (
        attachmentsResult.data ?? []
      ).map(async (attachment) => {
        const {
          data: signedUrlData,
          error: signedUrlError,
        } = await supabase.storage
          .from(
            attachment.storage_bucket,
          )
          .createSignedUrl(
            attachment.storage_path,
            300,
          );

        if (signedUrlError) {
          console.error(
            "Erro ao criar link do arquivo:",
            signedUrlError,
          );
        }

        return {
          ...attachment,
          signedUrl:
            signedUrlData?.signedUrl ??
            null,
        };
      }),
    );

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

  const requestsById = new Map(
    (
      requestsResult.data ?? []
    ).map((request) => [
      request.id,
      request,
    ]),
  );

  const accessesByContext = new Map(
    activeAccesses.map((access) => [
      `${access.organization_id}:${access.client_id}`,
      access,
    ]),
  );

  const totalDeliveries =
    approvals.length;

  const pendingDeliveries =
    approvals.filter(
      (approval) =>
        approval.status === "pending",
    ).length;

  const approvedDeliveries =
    approvals.filter(
      (approval) =>
        approval.status === "approved",
    ).length;

  const changesRequested =
    approvals.filter(
      (approval) =>
        approval.status ===
        "changes_requested",
    ).length;

  return (
    <main className="mx-auto min-h-[calc(100vh-161px)] max-w-7xl px-5 py-12 md:px-10 md:py-16">
      <header className="grid gap-8 border-b border-[#1f231b]/20 pb-12 lg:grid-cols-[1fr_0.65fr] lg:items-end">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#566547]">
            VISÃO COMPARTILHADA
          </span>

          <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.92] tracking-[-0.065em] md:text-7xl">
            Entregas claras.
            <span className="block text-[#566547]">
              Decisões conectadas.
            </span>
          </h1>
        </div>

        <p className="max-w-md text-sm leading-7 text-[#62675d]">
          Consulte os arquivos enviados,
          acompanhe cada solicitação e
          registre sua decisão em um
          histórico seguro.
        </p>
      </header>

      <section className="grid border-b border-[#1f231b]/20 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [
            "TOTAL DE ENTREGAS",
            totalDeliveries,
          ],
          [
            "AGUARDANDO VOCÊ",
            pendingDeliveries,
          ],
          [
            "APROVADAS",
            approvedDeliveries,
          ],
          [
            "AJUSTES SOLICITADOS",
            changesRequested,
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
              HISTÓRICO DE APROVAÇÕES
            </span>

            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em]">
              Entregas disponíveis
            </h2>
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#62675d]">
            {String(
              totalDeliveries,
            ).padStart(2, "0")}{" "}
            REGISTRADAS
          </span>
        </header>

        {approvals.length > 0 ? (
          <div className="mt-8 space-y-6">
            {approvals.map(
              (approval) => {
                const status =
                  approval.status as ApprovalStatus;

                const organization =
                  organizationsById.get(
                    approval.organization_id,
                  );

                const client =
                  clientsById.get(
                    approval.client_id,
                  );

                const request =
                  requestsById.get(
                    approval.request_id,
                  );

                const access =
                  accessesByContext.get(
                    `${approval.organization_id}:${approval.client_id}`,
                  );

                const attachments =
                  attachmentsWithLinks.filter(
                    (attachment) =>
                      attachment.request_id ===
                      approval.request_id,
                  );

                return (
                  <article
                    key={approval.id}
                    className="border border-[#1f231b]/20 bg-[#f7f6f0]"
                  >
                    <div className="grid lg:grid-cols-[170px_1fr]">
                      <aside className="flex min-h-32 items-center justify-center bg-[#566547] px-5 py-8 text-white lg:min-h-full">
                        <span className="font-mono text-[9px] uppercase tracking-[0.2em] [writing-mode:vertical-rl] lg:rotate-180">
                          {
                            statusLabels[
                              status
                            ]
                          }
                        </span>
                      </aside>

                      <div className="p-6 md:p-10">
                        <header className="flex flex-col gap-5 border-b border-[#1f231b]/15 pb-7 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#566547]">
                              {organization?.name ??
                                "Organização"}
                              {" · "}
                              {client?.name ??
                                "Cliente"}
                            </span>

                            <h3 className="mt-4 text-3xl font-semibold leading-none tracking-[-0.055em] md:text-5xl">
                              {request?.title ??
                                "Entrega"}
                            </h3>

                            <p className="mt-3 text-xs text-[#62675d]">
                              {client?.company_name ??
                                "Relacionamento independente"}
                            </p>
                          </div>

                          <span
                            className={[
                              "w-fit border px-3 py-2 font-mono text-[8px] uppercase tracking-[0.12em]",
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
                        </header>

                        {approval.message ? (
                          <div className="mt-7 border-l-2 border-[#566547] bg-[#e8e9e3] px-5 py-5">
                            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#566547]">
                              MENSAGEM DA EQUIPE
                            </span>

                            <p className="mt-3 text-sm leading-7">
                              {approval.message}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-7 grid gap-px border border-[#1f231b]/15 bg-[#1f231b]/15 sm:grid-cols-3">
                          <div className="bg-[#f7f6f0] p-4">
                            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                              ARQUIVOS
                            </span>

                            <strong className="mt-3 block text-lg">
                              {String(
                                attachments.length,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </strong>
                          </div>

                          <div className="bg-[#f7f6f0] p-4">
                            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                              SOLICITADA
                            </span>

                            <strong className="mt-3 block text-xs leading-5">
                              {formatDate(
                                approval.requested_at,
                              )}
                            </strong>
                          </div>

                          <div className="bg-[#f7f6f0] p-4">
                            <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
                              RESPONDIDA
                            </span>

                            <strong className="mt-3 block text-xs leading-5">
                              {approval.responded_at
                                ? formatDate(
                                    approval.responded_at,
                                  )
                                : "Ainda não respondida"}
                            </strong>
                          </div>
                        </div>

                        {attachments.length >
                        0 ? (
                          <div className="mt-7">
                            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#566547]">
                              ARQUIVOS DA ENTREGA
                            </span>

                            <div className="mt-3 divide-y divide-[#1f231b]/15 border-y border-[#1f231b]/15">
                              {attachments.map(
                                (
                                  attachment,
                                ) => (
                                  <div
                                    key={
                                      attachment.id
                                    }
                                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                  >
                                    <div className="min-w-0">
                                      <strong className="block break-all text-sm">
                                        {
                                          attachment.file_name
                                        }
                                      </strong>

                                      <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-[#62675d]">
                                        {formatFileSize(
                                          attachment.file_size_bytes,
                                        )}
                                        {" · "}
                                        {
                                          attachment.mime_type
                                        }
                                      </span>
                                    </div>

                                    {attachment.signedUrl ? (
                                      <a
                                        href={
                                          attachment.signedUrl
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="w-fit border border-[#566547] px-4 py-2 text-xs text-[#566547] transition hover:bg-[#566547] hover:text-white"
                                      >
                                        Abrir arquivo
                                      </a>
                                    ) : (
                                      <span className="text-xs text-[#9b3a2a]">
                                        Arquivo indisponível
                                      </span>
                                    )}
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ) : (
                          <p className="mt-6 text-xs text-[#62675d]">
                            Nenhum arquivo
                            disponível nesta
                            entrega.
                          </p>
                        )}

                        {status ===
                        "pending" ? (
                          <ApprovalResponseForm
                            approvalId={
                              approval.id
                            }
                            canApprove={
                              access?.role ===
                              "approver"
                            }
                          />
                        ) : approval.response_note ? (
                          <div className="mt-7 border-l-2 border-[#566547] bg-[#e8e9e3] px-5 py-5">
                            <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-[#566547]">
                              SUA RESPOSTA
                            </span>

                            <p className="mt-3 text-sm leading-7">
                              {
                                approval.response_note
                              }
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        ) : (
          <div className="mt-8 border border-dashed border-[#1f231b]/25 bg-[#f7f6f0] px-6 py-16 text-center">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#566547]">
              NENHUMA ENTREGA
            </span>

            <h3 className="mt-4 text-3xl font-semibold tracking-[-0.05em]">
              As próximas decisões aparecerão
              aqui.
            </h3>

            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-[#62675d]">
              Quando a equipe enviar uma
              entrega para aprovação, os
              arquivos e a solicitação
              ficarão disponíveis neste
              portal.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}