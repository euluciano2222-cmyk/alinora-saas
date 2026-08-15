"use client";

import Link from "next/link";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";

function validatePassword(password: string) {
  if (password.length < 12) {
    return "A senha precisa ter pelo menos 12 caracteres.";
  }

  if (!/[a-z]/.test(password)) {
    return "Inclua pelo menos uma letra minúscula.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Inclua pelo menos uma letra maiúscula.";
  }

  if (!/[0-9]/.test(password)) {
    return "Inclua pelo menos um número.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Inclua pelo menos um símbolo.";
  }

  return null;
}

export default function AtualizarSenhaPage() {
  const supabase = useMemo(() => createClient(), []);

  const [checkingSession, setCheckingSession] =
    useState(true);
  const [validSession, setValidSession] =
    useState(false);
  const [pending, setPending] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const { data, error } =
        await supabase.auth.getUser();

      if (!active) {
        return;
      }

      setValidSession(Boolean(data.user) && !error);
      setCheckingSession(false);
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, [supabase]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setMessage("");

    const formData = new FormData(event.currentTarget);

    const password = String(
      formData.get("password") ?? "",
    );

    const confirmation = String(
      formData.get("confirmation") ?? "",
    );

    const validationError = validatePassword(password);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    if (password !== confirmation) {
      setMessage("As duas senhas precisam ser iguais.");
      return;
    }

    setPending(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage(
        "Não foi possível atualizar a senha. Solicite um novo link.",
      );
      setPending(false);
      return;
    }

    await supabase.auth.signOut();

    setUpdated(true);
    setPending(false);
  }

  if (checkingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#e7e8e2] text-ink">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          VALIDANDO LINK SEGURO...
        </p>
      </main>
    );
  }

  if (!validSession && !updated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#e7e8e2] px-5 text-ink">
        <section className="w-full max-w-xl border border-ink/20 bg-[#f7f6f0] p-7 md:p-9">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-red-800">
            LINK INVÁLIDO OU EXPIRADO
          </span>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em]">
            Solicite um novo acesso.
          </h1>

          <p className="mt-4 text-sm leading-7 text-muted">
            Links de recuperação são temporários e só podem ser
            utilizados uma vez.
          </p>

          <Link
            href="/recuperar-senha"
            className="mt-7 inline-flex min-h-12 items-center bg-primary px-6 text-sm font-medium text-white"
          >
            Solicitar novo link
          </Link>
        </section>
      </main>
    );
  }

  if (updated) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#e7e8e2] px-5 text-ink">
        <section className="w-full max-w-xl border border-ink/20 bg-[#f7f6f0] p-7 md:p-9">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
            SENHA ATUALIZADA
          </span>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em]">
            Seu acesso está pronto.
          </h1>

          <p className="mt-4 text-sm leading-7 text-muted">
            A sessão de recuperação foi encerrada. Entre novamente
            usando sua nova senha.
          </p>

          <Link
            href="/login"
            className="mt-7 inline-flex min-h-12 items-center bg-primary px-6 text-sm font-medium text-white"
          >
            Entrar na Alinora
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#e7e8e2] px-5 py-12 text-ink">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl border border-ink/20 bg-[#f7f6f0]"
      >
        <header className="border-b border-ink/20 px-6 py-6 md:px-8">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-primary">
            NOVA CREDENCIAL
          </span>

          <h1 className="mt-4 text-4xl font-semibold tracking-[-0.055em]">
            Defina uma nova senha.
          </h1>

          <p className="mt-4 text-sm leading-7 text-muted">
            Use pelo menos 12 caracteres, com letras maiúsculas,
            minúsculas, número e símbolo.
          </p>
        </header>

        <div className="grid gap-5 p-6 md:p-8">
          <div>
            <label
              htmlFor="new-password"
              className="text-xs font-medium"
            >
              Nova senha
            </label>

            <input
              id="new-password"
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              className="mt-2 min-h-14 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none focus:border-primary"
            />
          </div>

          <div>
            <label
              htmlFor="password-confirmation"
              className="text-xs font-medium"
            >
              Confirme a nova senha
            </label>

            <input
              id="password-confirmation"
              name="confirmation"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              className="mt-2 min-h-14 w-full border border-ink/25 bg-transparent px-4 text-sm outline-none focus:border-primary"
            />
          </div>

          {message ? (
            <p
              role="alert"
              className="border-l-2 border-red-700 pl-3 text-sm text-red-800"
            >
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex min-h-12 items-center justify-between bg-primary px-5 text-sm font-medium text-white hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60"
          >
            {pending
              ? "Atualizando..."
              : "Atualizar senha"}

            <span aria-hidden="true">
              {pending ? "…" : "→"}
            </span>
          </button>
        </div>
      </form>
    </main>
  );
}