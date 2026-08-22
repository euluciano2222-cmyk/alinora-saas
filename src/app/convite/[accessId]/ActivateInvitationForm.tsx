"use client";

import { useActionState } from "react";

import {
  activateInvitationAction,
  type ActivateInvitationState,
} from "./actions";

type ActivateInvitationFormProps = {
  accessId: string;
};

const initialState: ActivateInvitationState = {
  status: "idle",
  message: "",
};

export default function ActivateInvitationForm({
  accessId,
}: ActivateInvitationFormProps) {
  const [state, formAction, pending] =
    useActionState(
      activateInvitationAction,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="mt-8"
    >
      <input
        type="hidden"
        name="accessId"
        value={accessId}
      />

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-14 w-full items-center justify-between bg-[#566547] px-6 text-sm text-white transition hover:bg-[#1f231b] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>
          {pending
            ? "Verificando convite..."
            : "Aceitar convite e acessar"}
        </span>

        <span aria-hidden="true">→</span>
      </button>

      {state.message ? (
        <div
          className={[
            "mt-5 border-l-2 px-4 py-3 text-sm leading-6",
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
    </form>
  );
}