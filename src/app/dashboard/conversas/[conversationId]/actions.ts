"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

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
};

const allowedStatuses: RequestStatus[] = [
  "received",
  "ai_review",
  "in_progress",
  "waiting_client",
  "completed",
  "cancelled",
];

const initialErrorState: ConversationActionState = {
  status: "error",
  message: "Não foi possível concluir esta ação.",
};

async function getAuthenticatedContext(
  conversationId: string,
) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: "Sua sessão expirou. Entre novamente.",
      supabase,
      user: null,
      organizationId: null,
    };
  }

  const {
    data: membership,
    error: membershipError,
  } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (membershipError || !membership) {
    return {
      error:
        "Não foi possível identificar sua organização.",
      supabase,
      user,
      organizationId: null,
    };
  }

  const organizationId =
    membership.organization_id;

  const {
    data: conversation,
    error: conversationError,
  } = await supabase
    .from("requests")
    .select("id")
    .eq("id", conversationId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return {
      error:
        "A conversa não existe ou você não possui acesso.",
      supabase,
      user,
      organizationId,
    };
  }

  return {
    error: null,
    supabase,
    user,
    organizationId,
  };
}

export async function sendConversationMessageAction(
  conversationId: string,
  _previousState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  const bodyValue = formData.get("body");

  const body =
    typeof bodyValue === "string"
      ? bodyValue.trim()
      : "";

  const isInternal =
    formData.get("isInternal") === "on";

  if (!body) {
    return {
      status: "error",
      message:
        "Escreva uma mensagem antes de enviar.",
    };
  }

  if (body.length > 30000) {
    return {
      status: "error",
      message:
        "A mensagem deve possuir no máximo 30.000 caracteres.",
    };
  }

  const context =
    await getAuthenticatedContext(conversationId);

  if (
    context.error ||
    !context.user ||
    !context.organizationId
  ) {
    return {
      ...initialErrorState,
      message:
        context.error ??
        initialErrorState.message,
    };
  }

  const { error: insertError } =
    await context.supabase
      .from("request_messages")
      .insert({
        organization_id:
          context.organizationId,
        request_id: conversationId,
        author_user_id: context.user.id,
        author_client_id: null,
        author_client_access_id: null,
        sender_type: "team",
        body,
        is_internal: isInternal,
      });

  if (insertError) {
    console.error(
      "Erro ao enviar mensagem:",
      insertError,
    );

    return {
      status: "error",
      message:
        "Não foi possível enviar a mensagem. Tente novamente.",
    };
  }

  const { error: updateError } =
    await context.supabase
      .from("requests")
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId)
      .eq(
        "organization_id",
        context.organizationId,
      );

  if (updateError) {
    console.error(
      "Erro ao atualizar a conversa:",
      updateError,
    );
  }

  revalidatePath(
    `/dashboard/conversas/${conversationId}`,
  );

  revalidatePath("/dashboard/conversas");

  return {
    status: "success",
    message: isInternal
      ? "Nota interna adicionada ao histórico."
      : "Mensagem adicionada ao histórico.",
  };
}

export async function updateConversationStatusAction(
  conversationId: string,
  _previousState: ConversationActionState,
  formData: FormData,
): Promise<ConversationActionState> {
  const statusValue = formData.get("status");

  if (
    typeof statusValue !== "string" ||
    !allowedStatuses.includes(
      statusValue as RequestStatus,
    )
  ) {
    return {
      status: "error",
      message: "Selecione um status válido.",
    };
  }

  const status =
    statusValue as RequestStatus;

  const context =
    await getAuthenticatedContext(conversationId);

  if (
    context.error ||
    !context.user ||
    !context.organizationId
  ) {
    return {
      ...initialErrorState,
      message:
        context.error ??
        initialErrorState.message,
    };
  }

  const now = new Date().toISOString();

  const {
    data: updatedConversation,
    error: updateError,
  } = await context.supabase
    .from("requests")
    .update({
      status,
      completed_at:
        status === "completed" ? now : null,
      updated_at: now,
    })
    .eq("id", conversationId)
    .eq(
      "organization_id",
      context.organizationId,
    )
    .select("id")
    .maybeSingle();

  if (updateError || !updatedConversation) {
    console.error(
      "Erro ao atualizar status:",
      updateError ?? {
        message:
          "Nenhuma conversa foi atualizada.",
      },
    );

    return {
      status: "error",
      message:
        "Não foi possível atualizar o status da conversa.",
    };
  }

  revalidatePath(
    `/dashboard/conversas/${conversationId}`,
  );

  revalidatePath("/dashboard/conversas");

  return {
    status: "success",
    message: "Status atualizado com sucesso.",
  };
}