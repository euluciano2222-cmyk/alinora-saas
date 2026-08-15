"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  deleteClientAction,
  updateClientAction,
  type ClientActionState,
} from "./actions";

type ClientManagementProps = {
  client: {
    id: string;
    name: string;
    companyName: string | null;
    email: string | null;
    phone: string | null;
    notes: string | null;
  };
};

const initialState: ClientActionState = { status: "idle", message: "" };

export default function ClientManagement({ client }: ClientManagementProps) {
  const editDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const [editState, editAction, editPending] = useActionState(updateClientAction, initialState);
  const [deleteState, deleteAction, deletePending] = useActionState(deleteClientAction, initialState);

  useEffect(() => {
    if (editState.status !== "success") return;
    const timeout = window.setTimeout(() => editDialogRef.current?.close(), 700);
    return () => window.clearTimeout(timeout);
  }, [editState]);

  useEffect(() => {
    if (deleteState.status === "success") deleteDialogRef.current?.close();
  }, [deleteState]);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => editDialogRef.current?.showModal()} className="min-h-10 border border-primary px-4 text-xs text-primary hover:bg-primary hover:text-white">Editar</button>
        <button type="button" onClick={() => deleteDialogRef.current?.showModal()} className="min-h-10 border border-[#8c3f32]/30 px-4 text-xs text-[#743527] hover:bg-[#743527] hover:text-white">Excluir</button>
      </div>

      <dialog ref={editDialogRef} aria-labelledby={`edit-client-${client.id}`} className="m-auto max-h-[90vh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto border border-ink/25 bg-[#f7f6f0] p-0 text-ink shadow-2xl backdrop:bg-ink/60">
        <header className="flex items-start justify-between border-b border-ink/20 px-6 py-5">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-primary">EDITAR CLIENTE</span>
            <h2 id={`edit-client-${client.id}`} className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Atualize esta relação.</h2>
          </div>
          <button type="button" onClick={() => editDialogRef.current?.close()} aria-label="Fechar edição" className="grid size-10 place-items-center border border-ink/20 text-lg hover:bg-ink hover:text-white">×</button>
        </header>

        <form action={editAction} className="grid gap-5 p-6">
          <input type="hidden" name="clientId" value={client.id} />
          <div>
            <label htmlFor={`edit-name-${client.id}`} className="text-xs font-medium">Nome do cliente *</label>
            <input id={`edit-name-${client.id}`} name="name" type="text" required minLength={2} maxLength={120} defaultValue={client.name} autoComplete="name" className="mt-2 min-h-12 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label htmlFor={`edit-company-${client.id}`} className="text-xs font-medium">Empresa</label>
            <input id={`edit-company-${client.id}`} name="companyName" type="text" minLength={2} maxLength={160} defaultValue={client.companyName ?? ""} autoComplete="organization" className="mt-2 min-h-12 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none focus:border-primary" />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`edit-email-${client.id}`} className="text-xs font-medium">E-mail</label>
              <input id={`edit-email-${client.id}`} name="email" type="email" maxLength={320} defaultValue={client.email ?? ""} autoComplete="email" className="mt-2 min-h-12 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label htmlFor={`edit-phone-${client.id}`} className="text-xs font-medium">Telefone</label>
              <input id={`edit-phone-${client.id}`} name="phone" type="tel" minLength={5} maxLength={30} defaultValue={client.phone ?? ""} autoComplete="tel" className="mt-2 min-h-12 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label htmlFor={`edit-notes-${client.id}`} className="text-xs font-medium">Contexto e observações</label>
            <textarea id={`edit-notes-${client.id}`} name="notes" rows={5} maxLength={5000} defaultValue={client.notes ?? ""} className="mt-2 w-full resize-y border border-ink/25 bg-transparent px-4 py-3 text-sm leading-6 outline-none focus:border-primary" />
          </div>
          {editState.message ? <p role={editState.status === "error" ? "alert" : "status"} className={["border-l-2 pl-3 text-sm", editState.status === "error" ? "border-[#9a4c3a] text-[#743527]" : "border-primary text-primary"].join(" ")}>{editState.message}</p> : null}
          <div className="flex flex-col-reverse gap-3 border-t border-ink/15 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => editDialogRef.current?.close()} className="min-h-11 border border-ink/25 px-5 text-xs hover:bg-ink hover:text-white">Cancelar</button>
            <button type="submit" disabled={editPending} className="min-h-11 bg-primary px-6 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-60">{editPending ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        </form>
      </dialog>

      <dialog ref={deleteDialogRef} aria-labelledby={`delete-client-${client.id}`} className="m-auto w-[calc(100%_-_2rem)] max-w-xl border border-[#743527]/40 bg-[#f7f6f0] p-0 text-ink shadow-2xl backdrop:bg-ink/60">
        <header className="flex items-start justify-between border-b border-ink/20 px-6 py-5">
          <div>
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#743527]">AÇÃO IRREVERSÍVEL</span>
            <h2 id={`delete-client-${client.id}`} className="mt-2 text-2xl font-semibold tracking-[-0.04em]">Excluir {client.name}?</h2>
          </div>
          <button type="button" onClick={() => deleteDialogRef.current?.close()} aria-label="Fechar exclusão" className="grid size-10 place-items-center border border-ink/20 text-lg hover:bg-ink hover:text-white">×</button>
        </header>
        <form action={deleteAction} className="grid gap-5 p-6">
          <input type="hidden" name="clientId" value={client.id} />
          <p className="text-sm leading-7 text-muted">Essa ação remove definitivamente o cliente. Se existirem projetos, conversas ou entregas vinculadas, a exclusão será bloqueada para preservar o histórico.</p>
          <div>
            <label htmlFor={`delete-confirmation-${client.id}`} className="text-xs font-medium">Digite <strong className="font-mono">EXCLUIR</strong> para confirmar</label>
            <input id={`delete-confirmation-${client.id}`} name="confirmation" type="text" required autoComplete="off" spellCheck={false} className="mt-2 min-h-12 w-full border border-[#743527]/40 bg-transparent px-4 font-mono text-sm uppercase outline-none focus:border-[#743527]" />
          </div>
          {deleteState.message ? <p role={deleteState.status === "error" ? "alert" : "status"} className={["border-l-2 pl-3 text-sm", deleteState.status === "error" ? "border-[#9a4c3a] text-[#743527]" : "border-primary text-primary"].join(" ")}>{deleteState.message}</p> : null}
          <div className="flex flex-col-reverse gap-3 border-t border-ink/15 pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => deleteDialogRef.current?.close()} className="min-h-11 border border-ink/25 px-5 text-xs hover:bg-ink hover:text-white">Manter cliente</button>
            <button type="submit" disabled={deletePending} className="min-h-11 bg-[#743527] px-6 text-xs font-medium text-white hover:bg-[#57271e] disabled:opacity-60">{deletePending ? "Excluindo..." : "Excluir definitivamente"}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}