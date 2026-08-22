"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ClientAccessActionState = {
  status: "idle" | "success" | "error";
  message: string;
  inviteId?: string;
};

type ClientAccessRole = "viewer" | "approver";

const validRoles: ClientAccessRole[] = [
  "viewer",
  "approver",
];

async function getAdminContext() {
  const supabase = await createClient();

  const { data, error: authError } =
    await supabase.auth.getClaims();

  const userId = data?.claims?.sub;

  if (authError || !userId) {
    redirect("/login");
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (
    membershipError ||
    !membership?.organization_id
  ) {
    redirect("/dashboard/configuracoes");
  }

  if (
    membership.role !== "owner" &&
    membership.role !== "admin"
  ) {
    return {
      supabase,
      userId,
      organizationId:
        membership.organization_id,
      authorized: false,
    };
  }

  return {
    supabase,
    userId,
    organizationId:
      membership.organization_id,
    authorized: true,
  };
}

function getFormValue(
  formData: FormData,
  field: string,
) {
  return String(formData.get(field) ?? "").trim();
}

function refreshClientAccessPages() {
  revalidatePath("/dashboard/clientes");
  revalidatePath("/portal");
}

export async function createClientAccessAction(
  _previousState: ClientAccessActionState,
  formData: FormData,
): Promise<ClientAccessActionState> {
  const clientId = getFormValue(
    formData,
    "clientId",
  );

  const email = getFormValue(
    formData,
    "email",
  ).toLowerCase();

  const role = getFormValue(
    formData,
    "role",
  ) as ClientAccessRole;

  if (!clientId) {
    return {
      status: "error",
      message: "O cliente não foi encontrado.",
    };
  }

  if (
    !email ||
    !email.includes("@") ||
    email.length > 320
  ) {
    return {
      status: "error",
      message:
        "Informe um endereço de e-mail válido.",
    };
  }

  if (!validRoles.includes(role)) {
    return {
      status: "error",
      message:
        "Selecione uma permissão de acesso válida.",
    };
  }

  const {
    supabase,
    userId,
    organizationId,
    authorized,
  } = await getAdminContext();

  if (!authorized) {
    return {
      status: "error",
      message:
        "Somente proprietários e administradores podem convidar clientes.",
    };
  }

  const {
    data: selectedClient,
    error: clientError,
  } = await supabase
    .from("clients")
    .select("id, status")
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (clientError || !selectedClient) {
    return {
      status: "error",
      message:
        "O cliente não existe ou você não possui acesso.",
    };
  }

  if (selectedClient.status === "archived") {
    return {
      status: "error",
      message:
        "Reative o cliente antes de criar um convite.",
    };
  }

  const {
    data: invitation,
    error: invitationError,
  } = await supabase
    .from("client_access")
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      user_id: null,
      email,
      role,
      status: "invited",
      invited_by: userId,
      accepted_at: null,
      revoked_at: null,
    })
    .select("id")
    .single();

  if (invitationError || !invitation) {
    console.error(
      "Erro ao criar convite:",
      invitationError,
    );

    if (invitationError?.code === "23505") {
      return {
        status: "error",
        message:
          "Este e-mail já possui um convite ou acesso ativo para o cliente.",
      };
    }

    return {
      status: "error",
      message:
        "Não foi possível criar o convite. Tente novamente.",
    };
  }

  refreshClientAccessPages();

  return {
    status: "success",
    message:
      "Convite criado. Copie o link e envie ao cliente.",
    inviteId: invitation.id,
  };
}

export async function revokeClientAccessAction(
  _previousState: ClientAccessActionState,
  formData: FormData,
): Promise<ClientAccessActionState> {
  const accessId = getFormValue(
    formData,
    "accessId",
  );

  if (!accessId) {
    return {
      status: "error",
      message: "O acesso não foi encontrado.",
    };
  }

  const {
    supabase,
    organizationId,
    authorized,
  } = await getAdminContext();

  if (!authorized) {
    return {
      status: "error",
      message:
        "Somente proprietários e administradores podem revogar acessos.",
    };
  }

  const now = new Date().toISOString();

  const {
    data: revokedAccess,
    error: revokeError,
  } = await supabase
    .from("client_access")
    .update({
      status: "revoked",
      revoked_at: now,
      updated_at: now,
    })
    .eq("id", accessId)
    .eq("organization_id", organizationId)
    .in("status", ["invited", "active"])
    .select("id")
    .maybeSingle();

  if (revokeError) {
    console.error(
      "Erro ao revogar acesso:",
      revokeError,
    );

    return {
      status: "error",
      message:
        "Não foi possível revogar o acesso.",
    };
  }

  if (!revokedAccess) {
    return {
      status: "error",
      message:
        "O acesso já foi revogado ou não foi encontrado.",
    };
  }

  refreshClientAccessPages();

  return {
    status: "success",
    message: "Acesso revogado com segurança.",
  };
}