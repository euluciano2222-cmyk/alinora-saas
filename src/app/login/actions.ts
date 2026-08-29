"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSafeInternalPath } from "@/lib/security/redirects";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  status: "idle" | "success" | "error";
  message: string;
  fields?: {
    email?: string;
    fullName?: string;
  };
};

const minimumSignInPasswordLength = 8;
const minimumSignUpPasswordLength = 12;
const maximumPasswordLength = 128;
const maximumEmailLength = 320;
const maximumFullNameLength = 120;

function isValidEmail(email: string) {
  if (
    !email ||
    email.length > maximumEmailLength ||
    /[\u0000-\u001F\u007F]/.test(email)
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password: string) {
  return (
    password.length >= minimumSignUpPasswordLength &&
    password.length <= maximumPasswordLength &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9\s]/.test(password)
  );
}

function getTrustedSiteOrigin() {
  const configuredSiteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim();

  const vercelProductionUrl =
    process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();

  const candidates = [
    configuredSiteUrl,
    vercelProductionUrl
      ? `https://${vercelProductionUrl}`
      : null,
    process.env.NODE_ENV === "production"
      ? "https://alinora-saas.vercel.app"
      : "http://localhost:3000",
  ];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const url = new URL(candidate);

      const isSecureUrl =
        url.protocol === "https:";

      const isLocalDevelopment =
        process.env.NODE_ENV !== "production" &&
        url.protocol === "http:" &&
        (url.hostname === "localhost" ||
          url.hostname === "127.0.0.1");

      if (isSecureUrl || isLocalDevelopment) {
        return url.origin;
      }
    } catch {
      continue;
    }
  }

  return process.env.NODE_ENV === "production"
    ? "https://alinora-saas.vercel.app"
    : "http://localhost:3000";
}

function translateAuthError(code?: string) {
  switch (code) {
    case "invalid_credentials":
      return "E-mail ou senha incorretos.";

    case "email_not_confirmed":
      return "Confirme seu e-mail antes de entrar.";

    case "user_already_exists":
    case "email_exists":
      return "Não foi possível criar esta conta. Verifique os dados informados ou tente entrar.";

    case "weak_password":
      return "Use uma senha de 12 a 128 caracteres, com letra maiúscula, letra minúscula, número e símbolo.";

    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de tentar novamente.";

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
  const nextValue = formData.get("next");

  const nextPath = getSafeInternalPath(
    typeof nextValue === "string"
      ? nextValue
      : null,
  );

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
      ? fullNameValue
          .normalize("NFC")
          .trim()
          .replace(/\s+/g, " ")
      : "";

  const fields = {
    email,
    fullName,
  };

  if (
    intent !== "sign-in" &&
    intent !== "sign-up"
  ) {
    return {
      status: "error",
      message: "Ação de autenticação inválida.",
      fields,
    };
  }

  if (!isValidEmail(email)) {
    return {
      status: "error",
      message: "Informe um endereço de e-mail válido.",
      fields,
    };
  }

  if (
    intent === "sign-in" &&
    (
      password.length <
        minimumSignInPasswordLength ||
      password.length >
        maximumPasswordLength
    )
  ) {
    return {
      status: "error",
      message:
        "A senha precisa ter entre 8 e 128 caracteres.",
      fields,
    };
  }

  if (
    intent === "sign-up" &&
    !isStrongPassword(password)
  ) {
    return {
      status: "error",
      message:
        "Use uma senha de 12 a 128 caracteres, com letra maiúscula, letra minúscula, número e símbolo.",
      fields,
    };
  }

  if (
    intent === "sign-up" &&
    (
      fullName.length < 2 ||
      fullName.length >
        maximumFullNameLength ||
      /[\u0000-\u001F\u007F]/.test(fullName)
    )
  ) {
    return {
      status: "error",
      message:
        "Informe um nome válido entre 2 e 120 caracteres.",
      fields,
    };
  }

  const supabase = await createClient();

  if (intent === "sign-in") {
    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      return {
        status: "error",
        message: translateAuthError(
          error.code,
        ),
        fields,
      };
    }

    revalidatePath("/", "layout");
    redirect(nextPath);
  }

  const confirmUrl = new URL(
    "/auth/confirm",
    getTrustedSiteOrigin(),
  );

  confirmUrl.searchParams.set(
    "next",
    nextPath,
  );

  const { data, error } =
    await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          confirmUrl.toString(),
        data: {
          full_name: fullName,
        },
      },
    });

  if (error) {
    return {
      status: "error",
      message: translateAuthError(
        error.code,
      ),
      fields,
    };
  }

  if (
    data.user?.identities?.length === 0
  ) {
    return {
      status: "success",
      message:
        "Se o endereço informado estiver disponível, você receberá as instruções de confirmação por e-mail.",
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