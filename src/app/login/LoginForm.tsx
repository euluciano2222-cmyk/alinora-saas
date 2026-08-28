"use client";

import { useActionState, useState } from "react";

import {
  authenticate,
  type AuthState,
} from "./actions";
import styles from "./login.module.css";

const initialAuthState: AuthState = {
  status: "idle",
  message: "",
};

const strongPasswordPattern =
  "(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{12,128}";

type AuthMode = "sign-in" | "sign-up";

type LoginFormProps = {
  nextPath: string;
};

type AuthModeFormProps = {
  mode: AuthMode;
  nextPath: string;
  onChangeMode: (mode: AuthMode) => void;
};

function EyeIcon({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.7a2 2 0 002.7 2.7" />
        <path d="M9.9 4.3A10.6 10.6 0 0112 4c5.5 0 9 5 9 5a15.4 15.4 0 01-2.1 2.7" />
        <path d="M6.6 6.6C4.3 8.1 3 10 3 10s3.5 5 9 5a9.7 9.7 0 004-.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12s3.5-5 9-5 9 5 9 5-3.5 5-9 5-9-5-9-5z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

function AuthModeForm({
  mode,
  nextPath,
  onChangeMode,
}: AuthModeFormProps) {
  const [state, formAction, pending] = useActionState(
    authenticate,
    initialAuthState,
  );

  const [showPassword, setShowPassword] = useState(false);
  const isSignUp = mode === "sign-up";

  return (
    <div className={styles.formContent}>
      <div
        className={styles.modeSelector}
        aria-label="Escolha uma forma de acesso"
      >
        <button
          type="button"
          className={!isSignUp ? styles.activeMode : ""}
          aria-pressed={!isSignUp}
          onClick={() => onChangeMode("sign-in")}
        >
          Entrar
        </button>

        <button
          type="button"
          className={isSignUp ? styles.activeMode : ""}
          aria-pressed={isSignUp}
          onClick={() => onChangeMode("sign-up")}
        >
          Criar conta
        </button>
      </div>

      <div className={styles.formHeading}>
        <span className={styles.formEyebrow}>
          {isSignUp ? "COMECE SUA ESTRUTURA" : "BEM-VINDO DE VOLTA"}
        </span>

        <h1>
          {isSignUp
            ? "Transforme movimento em crescimento."
            : "Sua operação continua daqui."}
        </h1>

        <p>
          {isSignUp
            ? "Crie seu espaço e comece a conduzir clientes, projetos e entregas com mais clareza."
            : "Entre para acompanhar decisões, projetos e relações que já estão em movimento."}
        </p>
      </div>

      <form action={formAction} className={styles.form}>
        <input type="hidden" name="intent" value={mode} />
        <input type="hidden" name="next" value={nextPath} />

        {isSignUp && (
          <div className={styles.field}>
            <label htmlFor="fullName">Seu nome</label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Como devemos chamar você?"
              defaultValue={state.fields?.fullName}
              minLength={2}
              maxLength={120}
              disabled={pending}
              required
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="email">E-mail profissional</label>

          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="voce@empresa.com"
            defaultValue={state.fields?.email}
            maxLength={320}
            disabled={pending}
            required
          />
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabelRow}>
            <label htmlFor="password">Senha</label>

            {!isSignUp && (
              <span className={styles.passwordHint}>
                Acesso protegido
              </span>
            )}
          </div>

          <div className={styles.passwordField}>
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={
                isSignUp
                  ? "new-password"
                  : "current-password"
              }
              placeholder={
                isSignUp
                  ? "Crie uma senha forte"
                  : "Digite sua senha"
              }
              minLength={isSignUp ? 12 : 8}
              maxLength={128}
              pattern={
                isSignUp
                  ? strongPasswordPattern
                  : undefined
              }
              title={
                isSignUp
                  ? "Use de 12 a 128 caracteres, incluindo letra maiúscula, letra minúscula, número e símbolo."
                  : undefined
              }
              aria-describedby={
                isSignUp
                  ? "passwordRequirements"
                  : undefined
              }
              disabled={pending}
              required
            />

            <button
              type="button"
              className={styles.passwordToggle}
              aria-label={
                showPassword
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
              aria-pressed={showPassword}
              onClick={() =>
                setShowPassword((current) => !current)
              }
            >
              <EyeIcon visible={showPassword} />
            </button>
          </div>

          {isSignUp && (
            <span
              id="passwordRequirements"
              className={styles.passwordHint}
            >
              Use de 12 a 128 caracteres, com letra maiúscula,
              minúscula, número e símbolo.
            </span>
          )}
        </div>

        {state.message && (
          <div
            className={
              state.status === "success"
                ? styles.successMessage
                : styles.errorMessage
            }
            role={
              state.status === "error"
                ? "alert"
                : "status"
            }
            aria-live="polite"
          >
            <span aria-hidden="true">
              {state.status === "success" ? "✓" : "!"}
            </span>

            <p>{state.message}</p>
          </div>
        )}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={pending}
        >
          <span>
            {pending
              ? "Preparando seu acesso..."
              : isSignUp
                ? "Criar meu espaço"
                : "Entrar na Alinora"}
          </span>

          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p className={styles.switchMessage}>
        {isSignUp
          ? "Já possui uma conta?"
          : "Ainda não começou?"}

        <button
          type="button"
          onClick={() =>
            onChangeMode(isSignUp ? "sign-in" : "sign-up")
          }
        >
          {isSignUp ? "Entrar agora" : "Criar meu espaço"}
        </button>
      </p>

      <p className={styles.privacyNote}>
        Ao continuar, você concorda com uma experiência segura,
        privada e preparada para o crescimento da sua operação.
      </p>
    </div>
  );
}

export function LoginForm({ nextPath }: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>("sign-in");

  return (
    <AuthModeForm
      key={mode}
      mode={mode}
      nextPath={nextPath}
      onChangeMode={setMode}
    />
  );
}