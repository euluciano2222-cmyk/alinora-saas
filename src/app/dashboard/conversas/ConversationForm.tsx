"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  createConversationAction,
  type ConversationActionState,
} from "./actions";
import styles from "./conversas.module.css";

type ClientOption = {
  id: string;
  name: string;
  company: string | null;
};

type ProjectOption = {
  id: string;
  clientId: string;
  name: string;
};

type ConversationFormProps = {
  clients: ClientOption[];
  projects: ProjectOption[];
};

const initialState: ConversationActionState = {
  status: "idle",
  message: "",
};

export default function ConversationForm({
  clients,
  projects,
}: ConversationFormProps) {
  const router = useRouter();

  const [selectedClientId, setSelectedClientId] =
    useState("");

  const [state, formAction, pending] = useActionState(
    createConversationAction,
    initialState,
  );

  const availableProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.clientId === selectedClientId,
      ),
    [projects, selectedClientId],
  );

  useEffect(() => {
    if (
      state.status === "success" &&
      state.conversationId
    ) {
      router.push(
        `/dashboard/conversas/${state.conversationId}`,
      );
    }
  }, [
    router,
    state.conversationId,
    state.status,
  ]);

  const hasClients = clients.length > 0;

  return (
    <section
      className={styles.creationPanel}
      aria-labelledby="new-conversation-title"
    >
      <div className={styles.creationIntro}>
        <span className={styles.eyebrow}>
          Novo contato
        </span>

        <h2 id="new-conversation-title">
          Transforme uma mensagem em direção.
        </h2>

        <p>
          Registre o contexto inicial, conecte o cliente
          ao projeto certo e mantenha cada decisão em um
          único histórico.
        </p>

        <div className={styles.creationNote}>
          <span>01</span>

          <p>
            Toda conversa nasce vinculada a um cliente,
            garantindo organização e segurança desde o
            primeiro contato.
          </p>
        </div>
      </div>

      <form
        action={formAction}
        className={styles.conversationForm}
      >
        <div className={styles.formHeader}>
          <div>
            <span className={styles.eyebrow}>
              Criar conversa
            </span>

            <h3>Contexto inicial</h3>
          </div>

          <span className={styles.formNumber}>
            01 / 03
          </span>
        </div>

        {!hasClients ? (
          <div
            className={styles.formWarning}
            role="status"
          >
            <strong>
              Cadastre um cliente primeiro.
            </strong>

            <p>
              Uma conversa precisa estar conectada a um
              cliente ativo.
            </p>
          </div>
        ) : null}

        <div className={styles.formGrid}>
          <label className={styles.field}>
            <span>Cliente</span>

            <select
              name="clientId"
              required
              disabled={!hasClients || pending}
              value={selectedClientId}
              onChange={(event) => {
                setSelectedClientId(
                  event.target.value,
                );
              }}
            >
              <option value="">
                Selecione um cliente
              </option>

              {clients.map((client) => (
                <option
                  key={client.id}
                  value={client.id}
                >
                  {client.company
                    ? `${client.company} — ${client.name}`
                    : client.name}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Projeto relacionado</span>

            <select
              name="projectId"
              disabled={
                !selectedClientId || pending
              }
              defaultValue=""
            >
              <option value="">
                Nenhum projeto específico
              </option>

              {availableProjects.map((project) => (
                <option
                  key={project.id}
                  value={project.id}
                >
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label
            className={`${styles.field} ${styles.fieldWide}`}
          >
            <span>Assunto</span>

            <input
              name="title"
              type="text"
              required
              minLength={2}
              maxLength={180}
              disabled={!hasClients || pending}
              placeholder="Ex.: Aprovação da nova identidade"
            />
          </label>

          <label className={styles.field}>
            <span>Prioridade</span>

            <select
              name="priority"
              defaultValue="normal"
              disabled={!hasClients || pending}
            >
              <option value="low">Baixa</option>
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
              <option value="urgent">
                Urgente
              </option>
            </select>
          </label>

          <div className={styles.formContext}>
            <span>Organização inteligente</span>

            <p>
              O histórico continuará disponível mesmo
              depois da conclusão do projeto.
            </p>
          </div>

          <label
            className={`${styles.field} ${styles.fieldWide}`}
          >
            <span>Primeira mensagem</span>

            <textarea
              name="body"
              required
              maxLength={30000}
              rows={6}
              disabled={!hasClients || pending}
              placeholder="Registre a solicitação, o contexto ou a decisão que iniciou esta conversa."
            />
          </label>
        </div>

        {state.message ? (
          <div
            role={
              state.status === "error"
                ? "alert"
                : "status"
            }
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
            Os dados serão protegidos pelas regras de
            acesso da sua organização.
          </p>

          <button
            type="submit"
            disabled={!hasClients || pending}
          >
            <span>
              {pending
                ? "Criando conversa..."
                : "Iniciar conversa"}
            </span>

            <span aria-hidden="true">
              {pending ? "…" : "→"}
            </span>
          </button>
        </div>
      </form>
    </section>
  );
}