"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  createDeliveryAction,
  type DeliveryActionState,
} from "./actions";

import styles from "./entregas.module.css";

type ConversationOption = {
  id: string;
  title: string;
  clientName: string;
  projectName: string;
  fileCount: number;
  hasPendingDelivery: boolean;
};

type DeliveryFormProps = {
  conversations: ConversationOption[];
};

const initialState: DeliveryActionState = {
  status: "idle",
  message: "",
};

export default function DeliveryForm({
  conversations,
}: DeliveryFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] =
    useActionState(
      createDeliveryAction,
      initialState,
    );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <section className={styles.deliveryPanel}>
      <div className={styles.deliveryIntro}>
        <p className={styles.eyebrow}>
          NOVA ENTREGA
        </p>

        <h2>
          Do trabalho
          <br />
          à aprovação.
        </h2>

        <p>
          Reúna os arquivos da conversa, envie
          uma solicitação clara e acompanhe a
          decisão do cliente em um único fluxo.
        </p>

        <div className={styles.deliveryRules}>
          <span>01 / Arquivo vinculado</span>
          <span>02 / Solicitação enviada</span>
          <span>03 / Decisão registrada</span>
        </div>
      </div>

      <form
        ref={formRef}
        action={formAction}
        className={styles.deliveryForm}
      >
        <header className={styles.formHeader}>
          <div>
            <p className={styles.eyebrow}>
              SOLICITAR APROVAÇÃO
            </p>

            <h2>Informações da entrega</h2>
          </div>

          <span className={styles.formNumber}>
            01 / APROVAÇÃO
          </span>
        </header>

        {conversations.length > 0 ? (
          <>
            <div className={styles.field}>
              <label htmlFor="conversationId">
                Conversa relacionada
              </label>

              <select
                id="conversationId"
                name="conversationId"
                required
                defaultValue=""
                disabled={isPending}
              >
                <option value="" disabled>
                  Selecione uma conversa
                </option>

                {conversations.map(
                  (conversation) => {
                    const unavailable =
                      conversation.fileCount === 0 ||
                      conversation.hasPendingDelivery;

                    let availabilityLabel = "";

                    if (
                      conversation.hasPendingDelivery
                    ) {
                      availabilityLabel =
                        " — aprovação pendente";
                    } else if (
                      conversation.fileCount === 0
                    ) {
                      availabilityLabel =
                        " — sem arquivos";
                    } else {
                      availabilityLabel = ` — ${conversation.fileCount} ${
                        conversation.fileCount === 1
                          ? "arquivo"
                          : "arquivos"
                      }`;
                    }

                    return (
                      <option
                        key={conversation.id}
                        value={conversation.id}
                        disabled={unavailable}
                      >
                        {conversation.clientName} /{" "}
                        {conversation.title}
                        {availabilityLabel}
                      </option>
                    );
                  },
                )}
              </select>

              <p className={styles.formHelp}>
                Apenas conversas com arquivos
                visíveis ao cliente podem ser
                enviadas para aprovação.
              </p>
            </div>

            <div className={styles.contextSummary}>
              <span>Contexto conectado</span>

              <p>
                A entrega utilizará os arquivos
                visíveis ao cliente que estiverem
                vinculados à conversa selecionada.
              </p>
            </div>

            <div className={styles.field}>
              <label htmlFor="message">
                Mensagem para o cliente
              </label>

              <textarea
                id="message"
                name="message"
                maxLength={5000}
                disabled={isPending}
                placeholder="Ex.: A primeira versão do projeto está pronta. Revise os arquivos e registre sua aprovação ou solicite os ajustes necessários."
              />

              <p className={styles.formHelp}>
                A mensagem é opcional e pode
                possuir até 5.000 caracteres.
              </p>
            </div>

            {state.status !== "idle" ? (
              <p
                className={`${styles.formMessage} ${
                  state.status === "error"
                    ? styles.formMessageError
                    : styles.formMessageSuccess
                }`}
                role={
                  state.status === "error"
                    ? "alert"
                    : "status"
                }
                aria-live="polite"
              >
                {state.message}
              </p>
            ) : null}

            <footer className={styles.formFooter}>
              <p>
                O cliente precisará possuir acesso
                ativo com permissão de aprovação
                para responder à entrega.
              </p>

              <button
                type="submit"
                disabled={isPending}
              >
                {isPending
                  ? "Enviando..."
                  : "Enviar para aprovação"}
              </button>
            </footer>
          </>
        ) : (
          <div className={styles.formEmpty}>
            <p className={styles.eyebrow}>
              NENHUMA CONVERSA
            </p>

            <h3>
              Crie uma conversa antes de registrar
              uma entrega.
            </h3>

            <p>
              As entregas precisam estar
              conectadas a uma conversa e a um
              cliente.
            </p>
          </div>
        )}
      </form>
    </section>
  );
}