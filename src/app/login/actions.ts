"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  status: "idle" | "success" | "error";
  message: string;
  fields?: {
    email?: string;
    fullName?: string;
  };
};



function sanitizeNextPath(value: FormDataEntryValue | null) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/dashboard";
  }

  return value;
}

function translateAuthError(code?: string) {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";

    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar.";

    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta cadastrada com este e-mail.";

    case "weak_password":
      return "Crie uma senha mais segura, com pelo menos 8 caracteres.";

    case "over_email_send_rate_limit":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos.";

    case "signup_disabled":
      return "A criação de novas contas está temporariamente indisponível.";

    default:
      return "Não foi possível concluir a solicitação. Tente novamente.";
  }
}

export async function authenticate(
  _previousState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const intent = formData.get("intent");
  const emailValue = formData.get("email");
  const passwordValue = formData.get("password");
  const fullNameValue = formData.get("fullName");
  const nextPath = sanitizeNextPath(formData.get("next"));

  const email =
    typeof emailValue === "string"
      ? emailValue.trim().toLowerCase()
      : "";

  const password =
    typeof passwordValue === "string"
      ? passwordValue
      : "";

  const fullName =
    typeof fullNameValue === "string"
      ? fullNameValue.trim()
      : "";

  const fields = {
    email,
    fullName,
  };

  if (intent !== "sign-in" && intent !== "sign-up") {
    return {
      status: "error",
      message: "Ação de autenticação inválida.",
      fields,
    };
  }

  if (!email || !email.includes("@")) {
    return {
      status: "error",
      message: "Informe um endereço de e-mail válido.",
      fields,
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "A senha precisa ter pelo menos 8 caracteres.",
      fields,
    };
  }

  if (intent === "sign-up" && fullName.length < 2) {
    return {
      status: "error",
      message: "Informe seu nome para criar a conta.",
      fields,
    };
  }

  const supabase = await createClient();

  if (intent === "sign-in") {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        status: "error",
        message: translateAuthError(error.code),
        fields,
      };
    }

    revalidatePath("/", "layout");
    redirect(nextPath);
  }

  const requestHeaders = await headers();
  const origin =
    requestHeaders.get("origin") ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  const confirmUrl = new URL("/auth/confirm", origin);
  confirmUrl.searchParams.set("next", nextPath);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl.toString(),
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return {
      status: "error",
      message: translateAuthError(error.code),
      fields,
    };
  }

  if (data.user?.identities?.length === 0) {
    return {
      status: "error",
      message: "Já existe uma conta cadastrada com este e-mail.",
      fields,
    };
  }

  if (data.session) {
    revalidatePath("/", "layout");
    redirect(nextPath);
  }

  return {
    status: "success",
    message:
      "Conta criada. Enviamos um link de confirmação para o seu e-mail.",
    fields,
  };
}