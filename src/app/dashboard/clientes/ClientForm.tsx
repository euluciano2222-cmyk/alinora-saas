"use client";

import { useActionState, useEffect, useRef } from "react";

import { createClientAction, type ClientActionState } from "./actions";

const initialState: ClientActionState = { status: "idle", message: "" };

export default function ClientForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(
    createClientAction,
    initialState,
  );

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="border border-ink/20 bg-[#f7f6f0]">
      <header className="border-b border-ink/20 px-6 py-5">
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">
          NOVO CLIENTE
        </span>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em]">
          Comece uma nova relação.
        </h2>
      </header>

      <div className="grid gap-5 p-6">
        <div>
          <label htmlFor="client-name" className="text-xs font-medium">Nome do cliente *</label>
          <input id="client-name" name="name" type="text" required minLength={2} maxLength={120} autoComplete="name" placeholder="Ex.: Mariana Costa" className="mt-2 min-h-12 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none placeholder:text-muted/60 focus:border-primary" />
        </div>

        <div>
          <label htmlFor="client-company" className="text-xs font-medium">Empresa</label>
          <input id="client-company" name="companyName" type="text" minLength={2} maxLength={160} autoComplete="organization" placeholder="Ex.: Estúdio Norte" className="mt-2 min-h-12 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none placeholder:text-muted/60 focus:border-primary" />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="client-email" className="text-xs font-medium">E-mail</label>
            <input id="client-email" name="email" type="email" maxLength={320} autoComplete="email" placeholder="cliente@empresa.com" className="mt-2 min-h-12 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none placeholder:text-muted/60 focus:border-primary" />
          </div>
          <div>
            <label htmlFor="client-phone" className="text-xs font-medium">Telefone</label>
            <input id="client-phone" name="phone" type="tel" minLength={5} maxLength={30} autoComplete="tel" placeholder="(51) 99999-9999" className="mt-2 min-h-12 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none placeholder:text-muted/60 focus:border-primary" />
          </div>
        </div>

        <div>
          <label htmlFor="client-notes" className="text-xs font-medium">Contexto e observações</label>
          <textarea id="client-notes" name="notes" rows={4} maxLength={5000} placeholder="Objetivos, preferências e informações importantes sobre o cliente." className="mt-2 w-full resize-y border border-ink/25 bg-transparent px-4 py-3 text-sm leading-6 outline-none placeholder:text-muted/60 focus:border-primary" />
        </div>

        {state.message ? (
          <p role={state.status === "error" ? "alert" : "status"} className={["border-l-2 pl-3 text-sm", state.status === "error" ? "border-red-700 text-red-800" : "border-primary text-primary"].join(" ")}>
            {state.message}
          </p>
        ) : null}

        <button type="submit" disabled={pending} className="flex min-h-12 w-full items-center justify-between bg-primary px-5 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60">
          {pending ? "Cadastrando..." : "Cadastrar cliente"}
          <span aria-hidden="true">{pending ? "…" : "→"}</span>
        </button>
      </div>
    </form>
  );
}