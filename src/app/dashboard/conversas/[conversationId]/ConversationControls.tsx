"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  sendConversationMessageAction,
  updateConversationStatusAction,
  type ConversationActionState,
} from "./actions";

import styles from "../conversas.module.css";

type RequestStatus =
  | "received"
  | "ai_review"
  | "in_progress"
  | "waiting_client"
  | "completed"
  | "cancelled";

type ConversationControlProps = {
  conversationId: string;
};

type StatusControlProps = {
  conversationId: string;
  currentStatus: RequestStatus;
};

const initialState: ConversationActionState = {
  status: "idle",
  message: "",
};

export function MessageComposer({
  conversationId,
}: ConversationControlProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const sendMessageAction =
    sendConversationMessageAction.bind(
      null,
      conversationId,
    );

  const [state, formAction, pending] =
    useActionState(
      sendMessageAction,
      initialState,
    );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section
      className={styles.composer}
      aria-labelledby="composer-title"
    >
      <div className={styles.composerHeader}>
        <h2 id="composer-title">
          Adicionar ao histórico
        </h2>

        <span className={styles.eyebrow}>
          Comunicação da equipe
        </span>
      </div>

      <form
        ref={formRef}
        action={formAction}
      >
        <textarea
          className={styles.composerTextarea}
          name="body"
          required
          maxLength={30000}
          rows={5}
          disabled={pending}
          placeholder="Escreva uma resposta, decisão ou atualização importante..."
          aria-label="Nova mensagem"
        />

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

        <div className={styles.composerFooter}>
          <label className={styles.internalToggle}>
            <input
              type="checkbox"
              name="isInternal"
              disabled={pending}
            />

            <span>
              Registrar como nota interna
            </span>
          </label>

          <button
            type="submit"
            disabled={pending}
          >
            {pending
              ? "Adicionando..."
              : "Adicionar mensagem"}
          </button>
        </div>
      </form>
    </section>
  );
}

export function StatusControl({
  conversationId,
  currentStatus,
}: StatusControlProps) {
  const updateStatusAction =
    updateConversationStatusAction.bind(
      null,
      conversationId,
    );

  const [state, formAction, pending] =
    useActionState(
      updateStatusAction,
      initialState,
    );

  return (
    <section
      className={styles.statusPanel}
      aria-labelledby="status-title"
    >
      <span className={styles.eyebrow}>
        Fluxo operacional
      </span>

      <h2 id="status-title">
        Status da conversa
      </h2>

      <form
        action={formAction}
        className={styles.statusForm}
      >
        <label htmlFor="conversation-status">
          Estado atual
        </label>

        <select
          key={currentStatus}
          id="conversation-status"
          name="status"
          defaultValue={currentStatus}
          disabled={pending}
        >
          <option value="received">
            Recebida
          </option>

          <option value="ai_review">
            Em análise
          </option>

          <option value="in_progress">
            Em andamento
          </option>

          <option value="waiting_client">
            Aguardando cliente
          </option>

          <option value="completed">
            Concluída
          </option>

          <option value="cancelled">
            Cancelada
          </option>
        </select>

        <button
          type="submit"
          disabled={pending}
        >
          {pending
            ? "Atualizando..."
            : "Atualizar status"}
        </button>

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
      </form>
    </section>
  );
}