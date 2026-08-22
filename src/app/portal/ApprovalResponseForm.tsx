"use client";

import { useActionState } from "react";

import {
  respondToApprovalAction,
  type ApprovalResponseState,
} from "./actions";

type ApprovalResponseFormProps = {
  approvalId: string;
  canApprove: boolean;
};

const initialState: ApprovalResponseState = {
  status: "idle",
  message: "",
};

export default function ApprovalResponseForm({
  approvalId,
  canApprove,
}: ApprovalResponseFormProps) {
  const [state, formAction, pending] =
    useActionState(
      respondToApprovalAction,
      initialState,
    );

  if (!canApprove) {
    return (
      <div className="mt-6 border-l-2 border-[#566547] bg-[#566547]/5 px-4 py-3">
        <p className="text-xs leading-6 text-[#62675d]">
          Seu acesso permite visualizar esta
          entrega, mas somente um contato com
          permissão de aprovação pode
          respondê-la.
        </p>
      </div>
    );
  }

  if (state.status === "success") {
    return (
      <div
        className="mt-6 border-l-2 border-[#566547] bg-[#566547]/5 px-4 py-4 text-sm text-[#566547]"
        role="status"
      >
        {state.message}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="mt-6 border-t border-[#1f231b]/15 pt-6"
    >
      <input
        type="hidden"
        name="approvalId"
        value={approvalId}
      />

      <label
        htmlFor={`response-note-${approvalId}`}
        className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#566547]"
      >
        OBSERVAÇÃO DA RESPOSTA
      </label>

      <textarea
        id={`response-note-${approvalId}`}
        name="responseNote"
        rows={4}
        maxLength={5000}
        disabled={pending}
        placeholder="Se desejar, registre uma observação. Para solicitar alterações, descreva o que precisa ser ajustado."
        className="mt-3 w-full resize-y border border-[#1f231b]/20 bg-transparent px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-[#62675d]/65 focus:border-[#566547] disabled:opacity-50"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className="flex min-h-12 items-center justify-between bg-[#566547] px-5 text-xs text-white transition hover:bg-[#1f231b] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>
            {pending
              ? "Registrando..."
              : "Aprovar entrega"}
          </span>

          <span aria-hidden="true">
            ✓
          </span>
        </button>

        <button
          type="submit"
          name="decision"
          value="changes_requested"
          disabled={pending}
          className="flex min-h-12 items-center justify-between border border-[#9b3a2a]/40 px-5 text-xs text-[#9b3a2a] transition hover:bg-[#9b3a2a] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>
            {pending
              ? "Registrando..."
              : "Solicitar alterações"}
          </span>

          <span aria-hidden="true">
            →
          </span>
        </button>
      </div>

      {state.message ? (
        <div
          className="mt-4 border-l-2 border-red-800 bg-red-900/5 px-4 py-3 text-xs leading-6 text-red-800"
          role="alert"
          aria-live="polite"
        >
          {state.message}
        </div>
      ) : null}
    </form>
  );
}