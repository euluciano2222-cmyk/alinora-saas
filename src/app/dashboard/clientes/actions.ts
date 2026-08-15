"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ClientActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ClientStatus = "active" | "inactive" | "archived";

const validStatuses: ClientStatus[] = [
  "active",
  "inactive",
  "archived",
];

async function getAuthenticatedContext() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;

  if (error || !claims?.sub) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", claims.sub)
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) {
    redirect("/dashboard/configuracoes");
  }

  return {
    supabase,
    userId: claims.sub,
    organizationId: membership.organization_id,
    organizationRole: membership.role,
  };
}

function getRequiredValue(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function getOptionalValue(formData: FormData, field: string) {
  const value = getRequiredValue(formData, field);
  return value.length > 0 ? value : null;
}

function validateClientData(formData: FormData) {
  const name = getRequiredValue(formData, "name");
  const companyName = getOptionalValue(formData, "companyName");
  const email = getOptionalValue(formData, "email");
  const phone = getOptionalValue(formData, "phone");
  const notes = getOptionalValue(formData, "notes");

  if (name.length < 2 || name.length > 120) {
    return {
      error: "O nome do cliente precisa ter entre 2 e 120 caracteres.",
      values: null,
    };
  }

  if (companyName && (companyName.length < 2 || companyName.length > 160)) {
    return {
      error: "O nome da empresa precisa ter entre 2 e 160 caracteres.",
      values: null,
    };
  }

  if (email && (!email.includes("@") || email.length > 320)) {
    return { error: "Informe um endereço de e-mail válido.", values: null };
  }

  if (phone && (phone.length < 5 || phone.length > 30)) {
    return { error: "Informe um telefone válido.", values: null };
  }

  if (notes && notes.length > 5000) {
    return {
      error: "As observações podem ter no máximo 5.000 caracteres.",
      values: null,
    };
  }

  return {
    error: null,
    values: {
      name,
      company_name: companyName,
      email,
      phone,
      notes,
    },
  };
}

function refreshClientPages() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/clientes");
}

export async function createClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const validation = validateClientData(formData);

  if (validation.error || !validation.values) {
    return {
      status: "error",
      message: validation.error ?? "Verifique as informações do cliente.",
    };
  }

  const { supabase, userId, organizationId } =
    await getAuthenticatedContext();

  const { error } = await supabase.from("clients").insert({
    organization_id: organizationId,
    ...validation.values,
    status: "active",
    created_by: userId,
  });

  if (error) {
    return {
      status: "error",
      message: "Não foi possível cadastrar o cliente. Tente novamente.",
    };
  }

  refreshClientPages();
  return { status: "success", message: "Cliente cadastrado com segurança." };
}

export async function updateClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const clientId = getRequiredValue(formData, "clientId");

  if (!clientId) {
    return { status: "error", message: "Cliente não encontrado." };
  }

  const validation = validateClientData(formData);

  if (validation.error || !validation.values) {
    return {
      status: "error",
      message: validation.error ?? "Verifique as informações do cliente.",
    };
  }

  const { supabase, organizationId } = await getAuthenticatedContext();

  const { data: updatedClient, error } = await supabase
    .from("clients")
    .update({ ...validation.values, updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();

  if (error || !updatedClient) {
    return { status: "error", message: "Não foi possível atualizar o cliente." };
  }

  refreshClientPages();
  return { status: "success", message: "Cliente atualizado com segurança." };
}

export async function updateClientStatusAction(formData: FormData) {
  const clientId = getRequiredValue(formData, "clientId");
  const requestedStatus = getRequiredValue(formData, "status") as ClientStatus;

  if (!clientId || !validStatuses.includes(requestedStatus)) {
    return;
  }

  const { supabase, organizationId } = await getAuthenticatedContext();

  await supabase
    .from("clients")
    .update({ status: requestedStatus, updated_at: new Date().toISOString() })
    .eq("id", clientId)
    .eq("organization_id", organizationId);

  refreshClientPages();
}

export async function deleteClientAction(
  _previousState: ClientActionState,
  formData: FormData,
): Promise<ClientActionState> {
  const clientId = getRequiredValue(formData, "clientId");
  const confirmation = getRequiredValue(formData, "confirmation");

  if (!clientId) {
    return { status: "error", message: "Cliente não encontrado." };
  }

  if (confirmation !== "EXCLUIR") {
    return {
      status: "error",
      message: "Digite EXCLUIR para confirmar a remoção.",
    };
  }

  const { supabase, organizationId, organizationRole } =
    await getAuthenticatedContext();

  if (organizationRole !== "owner" && organizationRole !== "admin") {
    return {
      status: "error",
      message: "Somente proprietários e administradores podem excluir clientes.",
    };
  }

  const { data: deletedClient, error } = await supabase
    .from("clients")
    .delete()
    .eq("id", clientId)
    .eq("organization_id", organizationId)
    .select("id")
    .maybeSingle();

  if (error) {
    return {
      status: "error",
      message:
        "Este cliente possui dados relacionados e não pode ser excluído. Arquive-o para preservar o histórico.",
    };
  }

  if (!deletedClient) {
    return {
      status: "error",
      message: "O cliente não foi encontrado ou você não possui permissão.",
    };
  }

  refreshClientPages();
  return { status: "success", message: "Cliente excluído definitivamente." };
}