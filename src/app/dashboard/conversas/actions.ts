"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

type RequestPriority = "low" | "normal" | "high" | "urgent";

type RequestStatus =
  | "received"
  | "ai_review"
  | "in_progress"
  | "waiting_client"
  | "completed"
  | "cancelled";

export type ConversationActionState = {
  status: "idle" | "success" | "error";
  message: string;
  conversationId?: string;
};

export type MessageActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const allowedPriorities: RequestPriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

const allowedStatuses: RequestStatus[] = [
  "received",
  "ai_review",
  "in_progress",
  "waiting_client",
  "completed",
  "cancelled",
];

function getTextValue(formData: FormData, field: string) {
  return String(formData.get(field) ?? "").trim();
}

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
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

  const { data: membership, error: membershipError } =
    await supabase
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

export async function createConversationAction(
  _previousState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  const clientId = getTextValue(formData, "clientId");
  const projectId = getTextValue(formData, "projectId");
  const title = getTextValue(formData, "title");
  const body = getTextValue(formData, "body");
  const requestedPriority = getTextValue(
    formData,
    "priority",
  );

  if (!isValidUuid(clientId)) {
    return {
      status: "error",
      message: "Selecione um cliente válido.",
    };
  }

  if (projectId && !isValidUuid(projectId)) {
    return {
      status: "error",
      message: "Selecione um projeto válido.",
    };
  }

  if (title.length < 2) {
    return {
      status: "error",
      message:
        "Informe um assunto com pelo menos 2 caracteres.",
    };
  }

  if (title.length > 180) {
    return {
      status: "error",
      message:
        "O assunto pode ter no máximo 180 caracteres.",
    };
  }

  if (!body) {
    return {
      status: "error",
      message: "Escreva a primeira mensagem da conversa.",
    };
  }

  if (body.length > 30000) {
    return {
      status: "error",
      message:
        "A mensagem pode ter no máximo 30.000 caracteres.",
    };
  }

  if (
    !allowedPriorities.includes(
      requestedPriority as RequestPriority,
    )
  ) {
    return {
      status: "error",
      message: "Selecione uma prioridade válida.",
    };
  }

  const priority =
    requestedPriority as RequestPriority;

  const { data: client, error: clientError } =
    await context.supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq(
        "organization_id",
        context.organizationId,
      )
      .maybeSingle();

  if (clientError || !client) {
    return {
      status: "error",
      message:
        "O cliente selecionado não foi encontrado.",
    };
  }

  if (projectId) {
    const { data: project, error: projectError } =
      await context.supabase
        .from("projects")
        .select("id")
        .eq("id", projectId)
        .eq("client_id", client.id)
        .eq(
          "organization_id",
          context.organizationId,
        )
        .maybeSingle();

    if (projectError || !project) {
      return {
        status: "error",
        message:
          "O projeto selecionado não pertence a esse cliente.",
      };
    }
  }

  const { data: conversation, error: insertError } =
    await context.supabase
      .from("requests")
      .insert({
        organization_id: context.organizationId,
        client_id: client.id,
        project_id: projectId || null,
        title,
        original_message: body,
        summary: null,
        status: "received",
        priority,
        source: "manual",
        due_at: null,
        completed_at: null,
        created_by: context.user.id,
      })
      .select("id")
      .single();

  if (insertError || !conversation) {
    return {
      status: "error",
      message:
        "Não foi possível criar a conversa. Tente novamente.",
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/conversas");

  return {
    status: "success",
    message: "Conversa criada com sucesso.",
    conversationId: conversation.id,
  };
}

export async function sendMessageAction(
  _previousState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const context = await getAuthenticatedContext();

  if (!context) {
    return {
      status: "error",
      message:
        "Sua sessão expirou. Entre novamente para continuar.",
    };
  }

  const requestId = getTextValue(
    formData,
    "requestId",
  );

  const body = getTextValue(formData, "body");

  const isInternal =
    getTextValue(formData, "isInternal") === "true";

  if (!isValidUuid(requestId)) {
    return {
      status: "error",
      message: "A conversa informada é inválida.",
    };
  }

  if (!body) {
    return {
      status: "error",
      message: "Escreva uma mensagem antes de enviar.",
    };
  }

  if (body.length > 30000) {
    return {
      status: "error",
      message:
        "A mensagem pode ter no máximo 30.000 caracteres.",
    };
  }

  const { data: conversation, error: conversationError } =
    await context.supabase
      .from("requests")
      .select("id")
      .eq("id", requestId)
      .eq(
        "organization_id",
        context.organizationId,
      )
      .maybeSingle();

  if (conversationError || !conversation) {
    return {
      status: "error",
      message: "A conversa não foi encontrada.",
    };
  }

  const { error: insertError } =
    await context.supabase
      .from("request_messages")
      .insert({
        organization_id: context.organizationId,
        request_id: conversation.id,
        sender_type: "team",
        author_user_id: context.user.id,
        author_client_id: null,
        author_client_access_id: null,
        body,
        is_internal: isInternal,
      });

  if (insertError) {
    return {
      status: "error",
      message:
        "Não foi possível enviar a mensagem. Tente novamente.",
    };
  }

  revalidatePath("/dashboard/conversas");
  revalidatePath(
    `/dashboard/conversas/${conversation.id}`,
  );

  return {
    status: "success",
    message: isInternal
      ? "Nota interna adicionada."
      : "Mensagem enviada com sucesso.",
  };
}

export async function updateConversationStatusAction(
  formData: FormData,
): Promise<void> {
  const context = await getAuthenticatedContext();

  if (!context) {
    redirect("/login");
  }

  const requestId = getTextValue(
    formData,
    "requestId",
  );

  const requestedStatus = getTextValue(
    formData,
    "status",
  );

  if (
    !isValidUuid(requestId) ||
    !allowedStatuses.includes(
      requestedStatus as RequestStatus,
    )
  ) {
    return;
  }

  const status = requestedStatus as RequestStatus;

  const { error } = await context.supabase
    .from("requests")
    .update({
      status,
      completed_at:
        status === "completed"
          ? new Date().toISOString()
          : null,
    })
    .eq("id", requestId)
    .eq(
      "organization_id",
      context.organizationId,
    );

  if (error) {
    return;
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/conversas");
  revalidatePath(
    `/dashboard/conversas/${requestId}`,
  );
}