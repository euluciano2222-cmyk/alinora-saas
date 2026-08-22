"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ActivateInvitationState = {
  status: "idle" | "success" | "error";
  message: string;
};

function translateActivationError(
  message?: string,
) {
  const normalizedMessage =
    message?.toLowerCase() ?? "";

  if (
    normalizedMessage.includes(
      "belongs to another email",
    )
  ) {
    return "Este convite pertence a outro endereço de e-mail. Entre com a conta correta.";
  }

  if (
    normalizedMessage.includes(
      "invalid",
    ) ||
    normalizedMessage.includes(
      "expired",
    )
  ) {
    return "Este convite é inválido, já foi utilizado ou foi revogado.";
  }

  if (
    normalizedMessage.includes(
      "authentication",
    )
  ) {
    return "Sua sessão expirou. Entre novamente para aceitar o convite.";
  }

  return "Não foi possível ativar o acesso. Confirme se você entrou com o mesmo e-mail que recebeu o convite.";
}

export async function activateInvitationAction(
  _previousState: ActivateInvitationState,
  formData: FormData,
): Promise<ActivateInvitationState> {
  const accessId = String(
    formData.get("accessId") ?? "",
  ).trim();

  if (!accessId) {
    return {
      status: "error",
      message:
        "O identificador do convite é inválido.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      `/login?next=${encodeURIComponent(
        `/convite/${accessId}`,
      )}`,
    );
  }

  const {
    data: existingAccess,
    error: existingAccessError,
  } = await supabase
    .from("client_access")
    .select("id, status")
    .eq("id", accessId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingAccessError) {
    console.error(
      "Erro ao verificar convite:",
      existingAccessError,
    );
  }

  if (
    existingAccess?.status === "active"
  ) {
    redirect("/portal");
  }

  const { error: activationError } =
    await supabase.rpc(
      "activate_client_access",
      {
        access_id: accessId,
      },
    );

  if (activationError) {
    console.error(
      "Erro ao ativar convite:",
      activationError,
    );

    return {
      status: "error",
      message: translateActivationError(
        activationError.message,
      ),
    };
  }

  revalidatePath("/", "layout");
  revalidatePath("/portal");
  revalidatePath("/dashboard/clientes");

  redirect("/portal");
}