"use client";

import {
  useActionState,
  useState,
} from "react";

import {
  createClientAccessAction,
  revokeClientAccessAction,
  type ClientAccessActionState,
} from "./access-actions";

type ClientAccessRole =
  | "viewer"
  | "approver";

type ClientAccessStatus =
  | "invited"
  | "active"
  | "revoked";

type ClientAccess = {
  id: string;
  email: string;
  role: ClientAccessRole;
  status: ClientAccessStatus;
  invitedAt: string;
  acceptedAt: string | null;
};

type ClientAccessManagerProps = {
  clientId: string;
  clientName: string;
  defaultEmail: string | null;
  canManage: boolean;
  accesses: ClientAccess[];
};

const initialState: ClientAccessActionState = {
  status: "idle",
  message: "",
};

const roleLabels: Record<
  ClientAccessRole,
  string
> = {
  viewer: "Visualização",
  approver: "Aprovação",
};

const statusLabels: Record<
  ClientAccessStatus,
  string
> = {
  invited: "Convite pendente",
  active: "Acesso ativo",
  revoked: "Revogado",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

type RevokeAccessButtonProps = {
  accessId: string;
};

function RevokeAccessButton({
  accessId,
}: RevokeAccessButtonProps) {
  const [state, formAction, pending] =
    useActionState(
      revokeClientAccessAction,
      initialState,
    );

  return (
    <div className="mt-3">
      <form action={formAction}>
        <input
          type="hidden"
          name="accessId"
          value={accessId}
        />

        <button
          type="submit"
          disabled={pending}
          className="min-h-9 border border-red-800/30 px-3 text-[11px] text-red-800 transition hover:bg-red-900/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending
            ? "Revogando..."
            : "Revogar acesso"}
        </button>
      </form>

      {state.message ? (
        <p
          className={[
            "mt-2 text-[11px]",
            state.status === "error"
              ? "text-red-800"
              : "text-primary",
          ].join(" ")}
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
    </div>
  );
}

export default function ClientAccessManager({
  clientId,
  clientName,
  defaultEmail,
  canManage,
  accesses,
}: ClientAccessManagerProps) {
  const [state, formAction, pending] =
    useActionState(
      createClientAccessAction,
      initialState,
    );

  const [copiedId, setCopiedId] =
    useState<string | null>(null);

  async function copyInviteLink(
    accessId: string,
  ) {
    try {
      const inviteUrl = new URL(
        `/convite/${encodeURIComponent(accessId)}`,
        window.location.origin,
      ).toString();

      await navigator.clipboard.writeText(
        inviteUrl,
      );

      setCopiedId(accessId);

      window.setTimeout(() => {
        setCopiedId((current) =>
          current === accessId
            ? null
            : current,
        );
      }, 2500);
    } catch {
      setCopiedId(null);
    }
  }

  const visibleAccesses = accesses.filter(
    (access) =>
      access.status === "invited" ||
      access.status === "active",
  );

  return (
    <details className="w-full border border-ink/20 bg-[#f7f6f0] lg:w-[360px]">
      <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-4 px-4 text-xs text-primary transition hover:bg-primary hover:text-white">
        <span>Portal do cliente</span>

        <span
          className="font-mono text-[9px]"
          aria-hidden="true"
        >
          {String(
            visibleAccesses.length,
          ).padStart(2, "0")}
        </span>
      </summary>

      <div className="border-t border-ink/20 p-4">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-primary">
            ACESSOS DE {clientName}
          </span>

          <p className="mt-2 text-xs leading-5 text-muted">
            Crie um acesso isolado para o
            cliente visualizar conversas,
            arquivos e entregas.
          </p>
        </div>

        {visibleAccesses.length > 0 ? (
          <div className="mt-5 divide-y divide-ink/15 border-y border-ink/15">
            {visibleAccesses.map(
              (access) => (
                <article
                  key={access.id}
                  className="py-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="block break-all text-xs">
                        {access.email}
                      </strong>

                      <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                        {
                          roleLabels[
                            access.role
                          ]
                        }
                        {" · "}
                        {
                          statusLabels[
                            access.status
                          ]
                        }
                      </span>
                    </div>

                    <span className="font-mono text-[8px] uppercase text-muted">
                      {formatDate(
                        access.acceptedAt ??
                          access.invitedAt,
                      )}
                    </span>
                  </div>

                  {access.status ===
                  "invited" ? (
                    <button
                      type="button"
                      onClick={() =>
                        copyInviteLink(
                          access.id,
                        )
                      }
                      className="mt-3 min-h-9 border border-primary px-3 text-[11px] text-primary transition hover:bg-primary hover:text-white"
                    >
                      {copiedId === access.id
                        ? "Link copiado"
                        : "Copiar convite"}
                    </button>
                  ) : null}

                  {canManage ? (
                    <RevokeAccessButton
                      accessId={access.id}
                    />
                  ) : null}
                </article>
              ),
            )}
          </div>
        ) : (
          <div className="mt-5 border border-dashed border-ink/20 px-4 py-5">
            <p className="text-xs leading-5 text-muted">
              Nenhum convite ou acesso
              ativo para este cliente.
            </p>
          </div>
        )}

        {canManage ? (
          <form
            action={formAction}
            className="mt-5 space-y-4"
          >
            <input
              type="hidden"
              name="clientId"
              value={clientId}
            />

            <div>
              <label
                htmlFor={`access-email-${clientId}`}
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted"
              >
                E-mail do cliente
              </label>

              <input
                id={`access-email-${clientId}`}
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue={
                  defaultEmail ?? ""
                }
                placeholder="cliente@empresa.com"
                maxLength={320}
                required
                disabled={pending}
                className="mt-2 min-h-11 w-full border border-ink/20 bg-transparent px-3 text-xs outline-none transition focus:border-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor={`access-role-${clientId}`}
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted"
              >
                Permissão
              </label>

              <select
                id={`access-role-${clientId}`}
                name="role"
                defaultValue="approver"
                disabled={pending}
                className="mt-2 min-h-11 w-full border border-ink/20 bg-transparent px-3 text-xs outline-none transition focus:border-primary disabled:opacity-50"
              >
                <option value="approver">
                  Pode aprovar entregas
                </option>

                <option value="viewer">
                  Somente visualização
                </option>
              </select>
            </div>

            <button
              type="submit"
              disabled={pending}
              className="flex min-h-11 w-full items-center justify-between bg-primary px-4 text-xs text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span>
                {pending
                  ? "Criando convite..."
                  : "Criar convite"}
              </span>

              <span aria-hidden="true">
                →
              </span>
            </button>

            {state.message ? (
              <div
                className={[
                  "border-l-2 px-3 py-2 text-xs leading-5",
                  state.status === "error"
                    ? "border-red-800 bg-red-900/5 text-red-800"
                    : "border-primary bg-primary/5 text-primary",
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

            {state.status === "success" &&
            state.inviteId ? (
              <button
                type="button"
                onClick={() =>
                  copyInviteLink(
                    state.inviteId!,
                  )
                }
                className="min-h-10 w-full border border-primary px-4 text-xs text-primary transition hover:bg-primary hover:text-white"
              >
                {copiedId === state.inviteId
                  ? "Link copiado"
                  : "Copiar link do convite"}
              </button>
            ) : null}
          </form>
        ) : (
          <p className="mt-5 text-xs leading-5 text-muted">
            Somente proprietários e
            administradores podem gerenciar
            acessos.
          </p>
        )}
      </div>
    </details>
  );
}