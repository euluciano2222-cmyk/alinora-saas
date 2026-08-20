"use client";

import {
  useRef,
  useState,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

import {
  cancelAttachmentUploadAction,
  completeAttachmentUploadAction,
  prepareAttachmentUploadAction,
} from "./actions";

import styles from "./arquivos.module.css";

type ConversationOption = {
  id: string;
  title: string;
  clientName: string;
};

type UploadFormProps = {
  conversations: ConversationOption[];
};

type UploadState = {
  status: "idle" | "uploading" | "success" | "error";
  message: string;
};

const initialState: UploadState = {
  status: "idle",
  message: "",
};

export default function UploadForm({
  conversations,
}: UploadFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, setState] =
    useState<UploadState>(initialState);

  const pending = state.status === "uploading";
  const hasConversations =
    conversations.length > 0;

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const conversationIdValue =
      formData.get("conversationId");

    const fileValue = formData.get("file");

    const isInternal =
      formData.get("isInternal") === "on";

    const conversationId =
      typeof conversationIdValue === "string"
        ? conversationIdValue
        : "";

    if (!(fileValue instanceof File)) {
      setState({
        status: "error",
        message:
          "Selecione um arquivo antes de continuar.",
      });

      return;
    }

    if (!fileValue.name || fileValue.size < 1) {
      setState({
        status: "error",
        message:
          "O arquivo selecionado está vazio ou é inválido.",
      });

      return;
    }

    setState({
      status: "uploading",
      message:
        "Preparando o envio com segurança...",
    });

    const preparation =
      await prepareAttachmentUploadAction({
        conversationId,
        fileName: fileValue.name,
        fileSize: fileValue.size,
        mimeType: fileValue.type,
        isInternal,
      });

    if (
      preparation.status === "error" ||
      !preparation.attachment
    ) {
      setState({
        status: "error",
        message: preparation.message,
      });

      return;
    }

    const preparedAttachment =
      preparation.attachment;

    setState({
      status: "uploading",
      message:
        "Enviando arquivo para o armazenamento...",
    });

    const supabase = createClient();

    const { error: uploadError } =
      await supabase.storage
        .from(preparedAttachment.bucket)
        .upload(
          preparedAttachment.path,
          fileValue,
          {
            cacheControl: "3600",
            contentType: fileValue.type,
            upsert: false,
          },
        );

    if (uploadError) {
      console.error(
        "Erro durante o upload:",
        uploadError,
      );

      await cancelAttachmentUploadAction(
        preparedAttachment.id,
      );

      setState({
        status: "error",
        message:
          "Não foi possível enviar o arquivo. Tente novamente.",
      });

      return;
    }

    setState({
      status: "uploading",
      message: "Confirmando o arquivo...",
    });

    const confirmation =
      await completeAttachmentUploadAction(
        preparedAttachment.id,
      );

    if (confirmation.status === "error") {
      await cancelAttachmentUploadAction(
        preparedAttachment.id,
      );

      setState({
        status: "error",
        message: confirmation.message,
      });

      return;
    }

    formRef.current?.reset();

    setState({
      status: "success",
      message: confirmation.message,
    });

    router.refresh();
  }

  return (
    <section
      className={styles.uploadPanel}
      aria-labelledby="upload-title"
    >
      <div className={styles.uploadIntro}>
        <span className={styles.eyebrow}>
          Novo arquivo
        </span>

        <h2 id="upload-title">
          Um lugar seguro para cada entrega.
        </h2>

        <p>
          Vincule documentos ao contexto correto,
          preserve o histórico e defina o que pode
          ser visualizado pelo cliente.
        </p>

        <div className={styles.uploadRules}>
          <span>Até 20 MB</span>
          <span>Bucket privado</span>
          <span>Histórico conectado</span>
        </div>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={styles.uploadForm}
      >
        <div className={styles.formHeader}>
          <div>
            <span className={styles.eyebrow}>
              Enviar anexo
            </span>

            <h3>Informações do arquivo</h3>
          </div>

          <span className={styles.formNumber}>
            01 / Upload
          </span>
        </div>

        {!hasConversations ? (
          <div
            className={styles.formWarning}
            role="status"
          >
            <strong>
              Crie uma conversa primeiro.
            </strong>

            <p>
              Todo arquivo da Alinora precisa estar
              conectado a uma conversa existente.
            </p>
          </div>
        ) : null}

        <div className={styles.formGrid}>
          <label
            className={`${styles.field} ${styles.fieldWide}`}
          >
            <span>Conversa relacionada</span>

            <select
              name="conversationId"
              required
              disabled={
                !hasConversations || pending
              }
              defaultValue=""
            >
              <option value="">
                Selecione uma conversa
              </option>

              {conversations.map(
                (conversation) => (
                  <option
                    key={conversation.id}
                    value={conversation.id}
                  >
                    {conversation.clientName}
                    {" — "}
                    {conversation.title}
                  </option>
                ),
              )}
            </select>
          </label>

          <label
            className={`${styles.field} ${styles.fieldWide}`}
          >
            <span>Arquivo</span>

            <input
              name="file"
              type="file"
              required
              disabled={
                !hasConversations || pending
              }
              accept={[
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
                ".pdf",
                ".txt",
                ".doc",
                ".docx",
                ".xls",
                ".xlsx",
              ].join(",")}
            />

            <small>
              JPG, PNG, WEBP, PDF, TXT, Word ou
              Excel. Tamanho máximo de 20 MB.
            </small>
          </label>
        </div>

        <label className={styles.internalToggle}>
          <input
            type="checkbox"
            name="isInternal"
            disabled={
              !hasConversations || pending
            }
          />

          <span>
            Manter este arquivo visível somente
            para a equipe
          </span>
        </label>

        {state.message ? (
          <div
            role={
              state.status === "error"
                ? "alert"
                : "status"
            }
            aria-live="polite"
            className={`${styles.formMessage} ${
              state.status === "error"
                ? styles.formMessageError
                : styles.formMessageSuccess
            }`}
          >
            {state.message}
          </div>
        ) : null}

        <div className={styles.formFooter}>
          <p>
            O arquivo será protegido pelas regras
            de acesso da organização e do cliente.
          </p>

          <button
            type="submit"
            disabled={
              !hasConversations || pending
            }
          >
            <span>
              {pending
                ? "Enviando..."
                : "Enviar arquivo"}
            </span>

            <span aria-hidden="true">
              {pending ? "…" : "↑"}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
}