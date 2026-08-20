import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import  UploadForm  from "./UploadForm";
import styles from "./arquivos.module.css";

export const metadata: Metadata = {
  title: "Arquivos | Alinora",
  description: "Biblioteca de arquivos conectados às conversas da organização.",
};

type ClientRecord = {
  id: string;
  name: string;
  company_name: string | null;
};

type ConversationRecord = {
  id: string;
  client_id: string;
  title: string;
  status: string;
  updated_at: string;
};

type AttachmentRecord = {
  id: string;
  client_id: string;
  request_id: string;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  storage_bucket: string;
  storage_path: string;
  is_internal: boolean;
  created_at: string;
};

type FileWithContext = AttachmentRecord & {
  clientName: string;
  conversationTitle: string;
  downloadUrl: string | null;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumIntegerDigits: 2,
    useGrouping: false,
  }).format(value);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1).replace(".", ",")} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

function getClientName(client?: ClientRecord) {
  if (!client) {
    return "Cliente não identificado";
  }

  return client.company_name?.trim() || client.name;
}

function getFileType(mimeType: string, fileName: string) {
  const extension = fileName.split(".").pop()?.toUpperCase();

  if (mimeType === "application/pdf") {
    return "PDF";
  }

  if (mimeType.startsWith("image/")) {
    return extension || "IMAGEM";
  }

  if (
    mimeType === "application/msword" ||
    mimeType.includes("wordprocessingml")
  ) {
    return "DOC";
  }

  if (
    mimeType === "application/vnd.ms-excel" ||
    mimeType.includes("spreadsheetml")
  ) {
    return "PLANILHA";
  }

  if (mimeType === "text/plain") {
    return "TEXTO";
  }

  return extension || "ARQUIVO";
}

export default async function FilesPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const [clientsResult, conversationsResult, attachmentsResult] =
    await Promise.all([
      supabase
        .from("clients")
        .select("id, name, company_name")
        .order("company_name", { ascending: true }),

      supabase
        .from("requests")
        .select("id, client_id, title, status, updated_at")
        .order("updated_at", { ascending: false }),

      supabase
        .from("attachments")
        .select(
          `
            id,
            client_id,
            request_id,
            file_name,
            file_size_bytes,
            mime_type,
            storage_bucket,
            storage_path,
            is_internal,
            created_at
          `,
        )
        .order("created_at", { ascending: false }),
    ]);

  if (clientsResult.error) {
    console.error("Erro ao carregar clientes:", clientsResult.error);
  }

  if (conversationsResult.error) {
    console.error(
      "Erro ao carregar conversas:",
      conversationsResult.error,
    );
  }

  if (attachmentsResult.error) {
    console.error("Erro ao carregar arquivos:", attachmentsResult.error);
  }

  const clients = (clientsResult.data ?? []) as ClientRecord[];
  const conversations = (conversationsResult.data ??
    []) as ConversationRecord[];
  const attachments = (attachmentsResult.data ?? []) as AttachmentRecord[];

  const clientsById = new Map(
    clients.map((client) => [client.id, client]),
  );

  const conversationsById = new Map(
    conversations.map((conversation) => [
      conversation.id,
      conversation,
    ]),
  );

  const uploadConversations = conversations.map((conversation) => ({
    id: conversation.id,
    title: conversation.title,
    clientName: getClientName(
      clientsById.get(conversation.client_id),
    ),
  }));

  const filesWithContext: FileWithContext[] = await Promise.all(
    attachments.map(async (attachment) => {
      const conversation = conversationsById.get(
        attachment.request_id,
      );

      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from(attachment.storage_bucket)
          .createSignedUrl(attachment.storage_path, 600);

      if (signedUrlError) {
        console.error(
          `Erro ao gerar link para ${attachment.file_name}:`,
          signedUrlError,
        );
      }

      return {
        ...attachment,
        clientName: getClientName(
          clientsById.get(attachment.client_id),
        ),
        conversationTitle:
          conversation?.title ?? "Conversa não identificada",
        downloadUrl: signedUrlData?.signedUrl ?? null,
      };
    }),
  );

  const totalSize = attachments.reduce(
    (total, attachment) => total + attachment.file_size_bytes,
    0,
  );

  const internalFiles = attachments.filter(
    (attachment) => attachment.is_internal,
  ).length;

  const sharedFiles = attachments.length - internalFiles;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.eyebrow}>
            ARQUIVOS / BIBLIOTECA CONECTADA
          </p>

          <h1>
            Cada arquivo
            <br />
            no contexto certo.
          </h1>
        </div>

        <p className={styles.heroDescription}>
          Centralize documentos, referências e entregas sem perder a
          relação com o cliente e com a conversa que originou cada
          arquivo.
        </p>
      </header>

      <section
        className={styles.stats}
        aria-label="Resumo dos arquivos"
      >
        <article className={styles.statCard}>
          <span>Total de arquivos</span>
          <strong>{formatNumber(attachments.length)}</strong>
        </article>

        <article className={styles.statCard}>
          <span>Visíveis ao cliente</span>
          <strong>{formatNumber(sharedFiles)}</strong>
        </article>

        <article className={styles.statCard}>
          <span>Somente equipe</span>
          <strong>{formatNumber(internalFiles)}</strong>
        </article>

        <article className={styles.statCard}>
          <span>Espaço utilizado</span>
          <strong className={styles.statSize}>
            {formatFileSize(totalSize)}
          </strong>
        </article>
      </section>

      <UploadForm conversations={uploadConversations} />

      <section className={styles.library}>
        <header className={styles.libraryHeader}>
          <div>
            <p className={styles.eyebrow}>ACERVO OPERACIONAL</p>
            <h2>Arquivos da organização</h2>
          </div>

          <span className={styles.libraryCounter}>
            {formatNumber(filesWithContext.length)} registrados
          </span>
        </header>

        {filesWithContext.length > 0 ? (
          <div className={styles.fileList}>
            {filesWithContext.map((file) => (
              <article className={styles.fileCard} key={file.id}>
                <div className={styles.fileType}>
                  {getFileType(file.mime_type, file.file_name)}
                </div>

                <div className={styles.fileContent}>
                  <div className={styles.fileHeading}>
                    <div>
                      <h3>{file.file_name}</h3>

                      <p>
                        {file.clientName} / {file.conversationTitle}
                      </p>
                    </div>

                    <span
                      className={
                        file.is_internal
                          ? styles.internalBadge
                          : styles.sharedBadge
                      }
                    >
                      {file.is_internal
                        ? "Somente equipe"
                        : "Visível ao cliente"}
                    </span>
                  </div>

                  <footer className={styles.fileFooter}>
                    <div className={styles.fileMetadata}>
                      <span>{formatFileSize(file.file_size_bytes)}</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>

                    <div className={styles.fileActions}>
                      <Link
                        href={`/dashboard/conversas/${file.request_id}`}
                        className={styles.contextLink}
                      >
                        Ver conversa
                      </Link>

                      {file.downloadUrl ? (
                        <a
                          href={file.downloadUrl}
                          className={styles.downloadLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Abrir arquivo
                          <span aria-hidden="true">↗</span>
                        </a>
                      ) : (
                        <span className={styles.unavailableLink}>
                          Indisponível
                        </span>
                      )}
                    </div>
                  </footer>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.eyebrow}>00 / ARQUIVOS</p>

            <h2>
              A biblioteca começa
              <br />
              com o primeiro envio.
            </h2>

            <p>
              Selecione uma conversa no formulário acima e envie o
              primeiro documento da organização.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}