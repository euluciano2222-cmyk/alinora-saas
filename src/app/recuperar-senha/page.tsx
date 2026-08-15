"use client";

import Link from "next/link";
import {
  type FormEvent,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

export default function RecuperarSenhaPage() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [requested, setRequested] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setErrorMessage("Informe o e-mail da sua conta.");
      return;
    }

    setPending(true);
    setErrorMessage("");

    const callbackUrl = new URL(
      "/auth/callback",
      window.location.origin,
    );

    callbackUrl.searchParams.set(
      "next",
      "/atualizar-senha",
    );

    const { error } =
      await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: callbackUrl.toString(),
        },
      );

    if (error) {
      setPending(false);

      if (
        error.status === 429 ||
        error.code === "over_email_send_rate_limit"
      ) {
        setErrorMessage(
          "O limite temporário de e-mails foi atingido. Aguarde aproximadamente uma hora antes de tentar novamente.",
        );

        return;
      }

      setErrorMessage(
        "Não foi possível solicitar a recuperação agora. Aguarde alguns minutos e tente novamente.",
      );

      return;
    }

    setRequested(true);
    setPending(false);
  }

  function requestAgain() {
    setRequested(false);
    setErrorMessage("");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#e7e8e2] px-5 py-12 text-ink">
      <section className="w-full max-w-xl border border-ink/20 bg-[#f7f6f0]">
        <header className="border-b border-ink/20 px-6 py-6 md:px-8">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
            ACESSO PROTEGIDO
          </span>

          <h1 className="mt-4 text-4xl font-semibold leading-none tracking-[-0.055em]">
            Recupere sua senha.
          </h1>

          <p className="mt-4 max-w-md text-sm leading-7 text-muted">
            Enviaremos um link temporário para você definir uma
            nova senha com segurança.
          </p>
        </header>

        {requested ? (
          <div className="p-6 md:p-8">
            <div
              role="status"
              className="border-l-2 border-primary pl-4"
            >
              <h2 className="font-semibold">
                Verifique sua caixa de entrada
              </h2>

              <p className="mt-2 text-sm leading-6 text-muted">
                Se existir uma conta associada ao endereço
                informado, você receberá um link de recuperação.
                Confira também as pastas de spam e promoções.
              </p>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={requestAgain}
                className="min-h-11 border border-ink/25 px-5 text-xs transition-colors hover:bg-ink hover:text-white"
              >
                Solicitar novamente
              </button>

              <Link
                href="/login"
                className="inline-flex min-h-11 items-center px-5 text-xs text-muted transition-colors hover:text-ink"
              >
                Voltar para entrar
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="p-6 md:p-8"
          >
            <label
              htmlFor="recovery-email"
              className="text-xs font-medium"
            >
              E-mail da conta
            </label>

            <input
              id="recovery-email"
              name="email"
              type="email"
              required
              maxLength={320}
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                if (errorMessage) {
                  setErrorMessage("");
                }
              }}
              placeholder="voce@empresa.com"
              className="mt-3 min-h-14 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none transition-colors placeholder:text-muted/60 focus:border-primary"
            />

            {errorMessage ? (
              <div
                role="alert"
                className="mt-4 border-l-2 border-[#9a4c3a] bg-[#9a4c3a]/5 px-4 py-3"
              >
                <p className="text-sm leading-6 text-[#743527]">
                  {errorMessage}
                </p>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={pending}
              className="mt-6 flex min-h-12 w-full items-center justify-between bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60"
            >
              {pending
                ? "Enviando..."
                : "Enviar link de recuperação"}

              <span aria-hidden="true">
                {pending ? "…" : "→"}
              </span>
            </button>

            <Link
              href="/login"
              className="mt-5 inline-block text-xs text-muted underline-offset-4 transition-colors hover:text-ink hover:underline"
            >
              Voltar para entrar
            </Link>
          </form>
        )}
      </section>
    </main>
  );
}