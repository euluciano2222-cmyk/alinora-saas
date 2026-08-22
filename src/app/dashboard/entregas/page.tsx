import type { Metadata } from "next";

import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import CancelDeliveryButton from "./CancelDeliveryButton";
import DeliveryForm from "./DeliveryForm";
import styles from "./entregas.module.css";

export const metadata: Metadata = {
  title: "Entregas | Alinora",
  description:
    "Acompanhe entregas, aprovações e solicitações de ajustes.",
};

type ApprovalStatus =
  | "pending"
  | "approved"
  | "changes_requested"
  | "cancelled";

type ClientRecord = {
  id: string;
  name: string;
  company_name: string | null;
};

type ProjectRecord = {
  id: string;
  name: string;
};

type ConversationRecord = {
  id: string;
  client_id: string;
  project_id: string | null;
  title: string;
  status: string;
  updated_at: string;
};

type AttachmentRecord = {
  id: string;
  request_id: string;
  file_size_bytes: number;
  is_internal: boolean;
};

type ApprovalRecord = {
  id: string;
  client_id: string;
  request_id: string;
  message: string | null;
  response_note: string | null;
  status: ApprovalStatus;
  requested_at: string;
  responded_at: string | null;
  created_at: string;
  updated_at: string;
};

type DeliveryRecord = ApprovalRecord & {
  clientName: string;
  projectName: string;
  conversationTitle: string;
  fileCount: number;
  totalFileSize: number;
};

const statusLabels: Record<
  ApprovalStatus,
  string
> = {
  pending: "Aguardando aprovação",
  approved: "Aprovada",
  changes_requested: "Ajustes solicitados",
  cancelled: "Cancelada",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Ainda não respondida";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024)
      .toFixed(1)
      .replace(".", ",")} KB`;
  }

  return `${(bytes / (1024 * 1024))
    .toFixed(1)
    .replace(".", ",")} MB`;
}

function getClientName(client?: ClientRecord) {
  if (!client) {
    return "Cliente não identificado";
  }

  return client.company_name?.trim() || client.name;
}

export default async function DeliveriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const [
    clientsResult,
    projectsResult,
    conversationsResult,
    attachmentsResult,
    approvalsResult,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, company_name")
      .order("company_name", {
        ascending: true,
      }),

    supabase
      .from("projects")
      .select("id, name")
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
          status,
          updated_at
        `,
      )
      .order("updated_at", {
        ascending: false,
      }),

    supabase
      .from("attachments")
      .select(
        `
          id,
          request_id,
          file_size_bytes,
          is_internal
        `,
      )
      .eq("is_internal", false),

    supabase
      .from("approvals")
      .select(
        `
          id,
          client_id,
          request_id,
          message,
          response_note,
          status,
          requested_at,
          responded_at,
          created_at,
          updated_at
        `,
      )
      .order("requested_at", {
        ascending: false,
      }),
  ]);

  if (clientsResult.error) {
    console.error(
      "Erro ao carregar clientes:",
      clientsResult.error,
    );
  }

  if (projectsResult.error) {
    console.error(
      "Erro ao carregar projetos:",
      projectsResult.error,
    );
  }

  if (conversationsResult.error) {
    console.error(
      "Erro ao carregar conversas:",
      conversationsResult.error,
    );
  }

  if (attachmentsResult.error) {
    console.error(
      "Erro ao carregar anexos:",
      attachmentsResult.error,
    );
  }

  if (approvalsResult.error) {
    console.error(
      "Erro ao carregar entregas:",
      approvalsResult.error,
    );
  }

  const clients = (clientsResult.data ??
    []) as ClientRecord[];

  const projects = (projectsResult.data ??
    []) as ProjectRecord[];

  const conversations = (conversationsResult.data ??
    []) as ConversationRecord[];

  const attachments = (attachmentsResult.data ??
    []) as AttachmentRecord[];

  const approvals = (approvalsResult.data ??
    []) as ApprovalRecord[];

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

  const conversationsById = new Map(
    conversations.map((conversation) => [
      conversation.id,
      conversation,
    ]),
  );

  const attachmentsByRequest = new Map<
    string,
    AttachmentRecord[]
  >();

  for (const attachment of attachments) {
    const currentAttachments =
      attachmentsByRequest.get(
        attachment.request_id,
      ) ?? [];

    currentAttachments.push(attachment);

    attachmentsByRequest.set(
      attachment.request_id,
      currentAttachments,
    );
  }

  const pendingRequestIds = new Set(
    approvals
      .filter(
        (approval) =>
          approval.status === "pending",
      )
      .map((approval) => approval.request_id),
  );

  const conversationOptions =
    conversations.map((conversation) => {
      const conversationAttachments =
        attachmentsByRequest.get(
          conversation.id,
        ) ?? [];

      return {
        id: conversation.id,
        title: conversation.title,

        clientName: getClientName(
          clientsById.get(
            conversation.client_id,
          ),
        ),

        projectName: conversation.project_id
          ? projectsById.get(
              conversation.project_id,
            )?.name ?? "Projeto não identificado"
          : "Sem projeto específico",

        fileCount:
          conversationAttachments.length,

        hasPendingDelivery:
          pendingRequestIds.has(conversation.id),
      };
    });

  const deliveries: DeliveryRecord[] =
    approvals.map((approval) => {
      const conversation =
        conversationsById.get(
          approval.request_id,
        );

      const conversationAttachments =
        attachmentsByRequest.get(
          approval.request_id,
        ) ?? [];

      const totalFileSize =
        conversationAttachments.reduce(
          (total, attachment) =>
            total +
            attachment.file_size_bytes,
          0,
        );

      return {
        ...approval,

        clientName: getClientName(
          clientsById.get(approval.client_id),
        ),

        projectName: conversation?.project_id
          ? projectsById.get(
              conversation.project_id,
            )?.name ?? "Projeto não identificado"
          : "Sem projeto específico",

        conversationTitle:
          conversation?.title ??
          "Conversa não identificada",

        fileCount:
          conversationAttachments.length,

        totalFileSize,
      };
    });

  const pendingDeliveries =
    deliveries.filter(
      (delivery) =>
        delivery.status === "pending",
    ).length;

  const approvedDeliveries =
    deliveries.filter(
      (delivery) =>
        delivery.status === "approved",
    ).length;

  const changesRequestedDeliveries =
    deliveries.filter(
      (delivery) =>
        delivery.status ===
        "changes_requested",
    ).length;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>
            ENTREGAS / DECISÕES REGISTRADAS
          </p>

          <h1>
            Entregar também
            <br />
            é criar clareza.
          </h1>
        </div>

        <p className={styles.heroDescription}>
          Transforme arquivos finalizados em
          solicitações de aprovação rastreáveis,
          mantendo cada resposta conectada ao
          cliente, ao projeto e à conversa.
        </p>
      </header>

      <section
        className={styles.stats}
        aria-label="Resumo das entregas"
      >
        <article className={styles.statCard}>
          <span>Total de entregas</span>

          <strong>
            {formatNumber(deliveries.length)}
          </strong>
        </article>

        <article className={styles.statCard}>
          <span>Aguardando cliente</span>

          <strong>
            {formatNumber(pendingDeliveries)}
          </strong>
        </article>

        <article className={styles.statCard}>
          <span>Aprovadas</span>

          <strong>
            {formatNumber(approvedDeliveries)}
          </strong>
        </article>

        <article className={styles.statCard}>
          <span>Ajustes solicitados</span>

          <strong>
            {formatNumber(
              changesRequestedDeliveries,
            )}
          </strong>
        </article>
      </section>

      <DeliveryForm
        conversations={conversationOptions}
      />

      <section className={styles.history}>
        <header className={styles.historyHeader}>
          <div>
            <p className={styles.eyebrow}>
              HISTÓRICO DE APROVAÇÕES
            </p>

            <h2>Entregas da organização</h2>
          </div>

          <span className={styles.historyCounter}>
            {formatNumber(deliveries.length)}{" "}
            registradas
          </span>
        </header>

        {deliveries.length > 0 ? (
          <div className={styles.deliveryList}>
            {deliveries.map((delivery) => (
              <article
                key={delivery.id}
                className={styles.deliveryCard}
              >
                <div
                  className={`${styles.statusRail} ${
                    styles[
                      `statusRail_${delivery.status}`
                    ]
                  }`}
                >
                  <span>
                    {
                      statusLabels[
                        delivery.status
                      ]
                    }
                  </span>
                </div>

                <div
                  className={styles.deliveryContent}
                >
                  <header
                    className={
                      styles.deliveryHeading
                    }
                  >
                    <div>
                      <p
                        className={
                          styles.deliveryClient
                        }
                      >
                        {delivery.clientName}
                      </p>

                      <h3>
                        {
                          delivery.conversationTitle
                        }
                      </h3>

                      <p
                        className={
                          styles.deliveryProject
                        }
                      >
                        {delivery.projectName}
                      </p>
                    </div>

                    <span
                      className={`${styles.statusBadge} ${
                        styles[
                          `statusBadge_${delivery.status}`
                        ]
                      }`}
                    >
                      {
                        statusLabels[
                          delivery.status
                        ]
                      }
                    </span>
                  </header>

                  {delivery.message ? (
                    <div
                      className={
                        styles.deliveryMessage
                      }
                    >
                      <span>
                        Mensagem enviada
                      </span>

                      <p>{delivery.message}</p>
                    </div>
                  ) : null}

                  {delivery.response_note ? (
                    <div
                      className={
                        styles.responseNote
                      }
                    >
                      <span>
                        Resposta do cliente
                      </span>

                      <p>
                        {delivery.response_note}
                      </p>
                    </div>
                  ) : null}

                  <div
                    className={
                      styles.deliveryMetadata
                    }
                  >
                    <div>
                      <span>Arquivos</span>

                      <strong>
                        {formatNumber(
                          delivery.fileCount,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Tamanho</span>

                      <strong>
                        {formatFileSize(
                          delivery.totalFileSize,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Solicitada</span>

                      <strong>
                        {formatDate(
                          delivery.requested_at,
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Respondida</span>

                      <strong>
                        {formatDate(
                          delivery.responded_at,
                        )}
                      </strong>
                    </div>
                  </div>

                  <footer
                    className={
                      styles.deliveryFooter
                    }
                  >
                    <div
                      className={
                        styles.deliveryLinks
                      }
                    >
                      <Link
                        href={`/dashboard/conversas/${delivery.request_id}`}
                        className={
                          styles.primaryLink
                        }
                      >
                        Abrir conversa
                      </Link>

                      <Link
                        href="/dashboard/arquivos"
                        className={
                          styles.secondaryLink
                        }
                      >
                        Ver arquivos
                      </Link>
                    </div>

                    {delivery.status ===
                    "pending" ? (
                      <CancelDeliveryButton
                        approvalId={delivery.id}
                        conversationTitle={
                          delivery.conversationTitle
                        }
                      />
                    ) : null}
                  </footer>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.eyebrow}>
              00 / ENTREGAS
            </p>

            <h2>
              A primeira aprovação
              <br />
              começa aqui.
            </h2>

            <p>
              Selecione acima uma conversa que
              possua arquivos visíveis ao cliente
              e envie a primeira entrega.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}