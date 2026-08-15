"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  createProjectAction,
  type ProjectActionState,
} from "./actions";
import styles from "./projetos.module.css";

type ClientOption = {
  id: string;
  name: string;
  company: string | null;
};

type ProjectFormProps = {
  clients: ClientOption[];
};

const initialState: ProjectActionState = {
  status: "idle",
  message: "",
};

export default function ProjectForm({ clients }: ProjectFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  const hasClients = clients.length > 0;

  return (
    <form ref={formRef} action={formAction} className={styles.projectForm}>
      <div className={styles.formHeading}>
        <div>
          <span className={styles.eyebrow}>Novo projeto</span>
          <h2>Transforme uma ideia em movimento.</h2>
        </div>

        <span className={styles.formNumber}>01 / 04</span>
      </div>

      {!hasClients ? (
        <div className={styles.noClientsNotice}>
          <strong>Cadastre um cliente primeiro.</strong>

          <p>
            Todo projeto precisa estar conectado a um cliente da sua
            organização.
          </p>

          <a href="/dashboard/clientes">Ir para Clientes →</a>
        </div>
      ) : (
        <>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Nome do projeto</span>

              <input
                type="text"
                name="name"
                minLength={2}
                maxLength={160}
                placeholder="Ex.: Novo website institucional"
                autoComplete="off"
                required
              />
            </label>

            <label className={styles.field}>
              <span>Cliente</span>

              <select name="clientId" defaultValue="" required>
                <option value="" disabled>
                  Selecione um cliente
                </option>

                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.company
                      ? `${client.name} — ${client.company}`
                      : client.name}
                  </option>
                ))}
              </select>
            </label>

            <label className={`${styles.field} ${styles.fullWidth}`}>
              <span>Descrição</span>

              <textarea
                name="description"
                maxLength={10000}
                rows={5}
                placeholder="Descreva o objetivo, o resultado esperado e as informações importantes do projeto."
              />
            </label>

            <label className={styles.field}>
              <span>Data de início</span>

              <input type="date" name="startDate" />
            </label>

            <label className={styles.field}>
              <span>Prazo de entrega</span>

              <input type="date" name="dueDate" />
            </label>
          </div>

          {state.message ? (
            <p
              className={
                state.status === "success"
                  ? styles.successMessage
                  : styles.errorMessage
              }
              role={state.status === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              {state.message}
            </p>
          ) : null}

          <div className={styles.formFooter}>
            <p>
              O projeto será criado como ativo e poderá ser atualizado a
              qualquer momento.
            </p>

            <button type="submit" disabled={isPending}>
              {isPending ? "Criando projeto..." : "Criar projeto"}
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      )}
    </form>
  );
}