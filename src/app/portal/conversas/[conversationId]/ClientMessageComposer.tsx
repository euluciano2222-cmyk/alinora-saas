"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  sendClientMessageAction,
  type ClientMessageActionState,
} from "./actions";

type ClientMessageComposerProps = {
  conversationId: string;
  disabled?: boolean;
};

const initialState: ClientMessageActionState = {
  status: "idle",
  message: "",
};

export default function ClientMessageComposer({
  conversationId,
  disabled = false,
}: ClientMessageComposerProps) {
  const formRef =
    useRef<HTMLFormElement>(null);

  const sendMessageAction =
    sendClientMessageAction.bind(
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

  if (disabled) {
    return (
      <section className="border-t border-[#1f231b]/20 px-6 py-8 md:px-10">
        <div className="border-l-2 border-[#62675d] bg-[#1f231b]/5 px-4 py-3">
          <p className="text-sm leading-6 text-[#62675d]">
            Esta conversa foi encerrada e
            não aceita novas mensagens.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      className="border-t border-[#1f231b]/20 px-6 py-8 md:px-10"
      aria-labelledby="client-composer-title"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#566547]">
            COMUNICAÇÃO COM A EQUIPE
          </span>

          <h2
            id="client-composer-title"
            className="mt-2 text-2xl font-semibold tracking-[-0.045em]"
          >
            Responder à conversa
          </h2>
        </div>

        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#62675d]">
          MENSAGEM VISÍVEL À EQUIPE
        </span>
      </header>

      <form
        ref={formRef}
        action={formAction}
        className="mt-6"
      >
        <textarea
          name="body"
          rows={5}
          required
          maxLength={30000}
          disabled={pending}
          placeholder="Escreva sua resposta, dúvida ou atualização..."
          aria-label="Nova mensagem para a equipe"
          className="w-full resize-y border border-[#1f231b]/20 bg-transparent px-4 py-4 text-sm leading-7 outline-none transition placeholder:text-[#62675d]/65 focus:border-[#566547] disabled:cursor-not-allowed disabled:opacity-50"
        />

        {state.message ? (
          <div
            className={[
              "mt-4 border-l-2 px-4 py-3 text-xs leading-6",
              state.status === "error"
                ? "border-red-800 bg-red-900/5 text-red-800"
                : "border-[#566547] bg-[#566547]/5 text-[#566547]",
            ].join(" ")}
            role={
              state.status === "error"
                ? "alert"
                : "status"
            }
            aria-live="polite"
          >
            {state.message}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="flex min-h-12 min-w-52 items-center justify-between bg-[#566547] px-5 text-xs text-white transition hover:bg-[#1f231b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span>
              {pending
                ? "Enviando..."
                : "Enviar mensagem"}
            </span>

            <span aria-hidden="true">
              →
            </span>
          </button>
        </div>
      </form>
    </section>
  );
}