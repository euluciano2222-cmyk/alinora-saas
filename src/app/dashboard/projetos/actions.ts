"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ProjectActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

const allowedProjectStatuses: ProjectStatus[] = [
  "active",
  "on_hold",
  "completed",
  "archived",
];

function getTextValue(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function isValidDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false;
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === date
  );
}

async function getAuthenticatedContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return null;
  }

  return {
    supabase,
    user,
    organizationId: membership.organization_id,
  };
}

export async function createProjectAction(
  _previousState: ProjectActionState,
  formData: FormData,
): Promise<ProjectActionState> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return {
      status: "error",
      message: "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  const name = getTextValue(formData, "name");
  const clientId = getTextValue(formData, "clientId");
  const description = getTextValue(formData, "description");
  const startDate = getTextValue(formData, "startDate");
  const dueDate = getTextValue(formData, "dueDate");

  if (name.length < 2) {
    return {
      status: "error",
      message: "Informe um nome com pelo menos 2 caracteres.",
    };
  }

  if (name.length > 160) {
    return {
      status: "error",
      message: "O nome do projeto pode ter no máximo 160 caracteres.",
    };
  }

  if (!clientId) {
    return {
      status: "error",
      message: "Selecione o cliente responsável pelo projeto.",
    };
  }

  if (description.length > 10000) {
    return {
      status: "error",
      message: "A descrição pode ter no máximo 10.000 caracteres.",
    };
  }

  if (startDate && !isValidDate(startDate)) {
    return {
      status: "error",
      message: "Informe uma data de início válida.",
    };
  }

  if (dueDate && !isValidDate(dueDate)) {
    return {
      status: "error",
      message: "Informe uma data de entrega válida.",
    };
  }

  if (startDate && dueDate && dueDate < startDate) {
    return {
      status: "error",
      message: "A data de entrega não pode ser anterior à data de início.",
    };
  }

  const { data: client, error: clientError } = await context.supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (clientError || !client) {
    return {
      status: "error",
      message: "O cliente selecionado não foi encontrado.",
    };
  }

  const { error: insertError } = await context.supabase
    .from("projects")
    .insert({
      organization_id: context.organizationId,
      client_id: client.id,
      name,
      description: description || null,
      status: "active",
      start_date: startDate || null,
      due_date: dueDate || null,
      created_by: context.user.id,
    });

  if (insertError) {
    return {
      status: "error",
      message: "Não foi possível criar o projeto. Tente novamente.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projetos");

  return {
    status: "success",
    message: "Projeto criado com sucesso.",
  };
}

export async function updateProjectStatusAction(
  formData: FormData,
): Promise<void> {
  const context = await getAuthenticatedContext();

  if (!context) {
    redirect("/login");
  }

  const projectId = getTextValue(formData, "projectId");
  const requestedStatus = getTextValue(formData, "status");

  if (
    !projectId ||
    !allowedProjectStatuses.includes(requestedStatus as ProjectStatus)
  ) {
    return;
  }

  const status = requestedStatus as ProjectStatus;

  const { error } = await context.supabase
    .from("projects")
    .update({
      status,
    })
    .eq("id", projectId)
    .eq("organization_id", context.organizationId);

  if (error) {
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/projetos");
}