"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ClientMessageActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function sendClientMessageAction(
  conversationId: string,
  _previousState: ClientMessageActionState,
  formData: FormData,
): Promise<ClientMessageActionState> {
  const body = String(
    formData.get("body") ?? "",
  ).trim();

  if (!conversationId) {
    return {
      status: "error",
      message:
        "A conversa não foi encontrada.",
    };
  }

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
        "A mensagem pode possuir no máximo 30.000 caracteres.",
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
        `/portal/conversas/${conversationId}`,
      )}`,
    );
  }

  const {
    data: conversation,
    error: conversationError,
  } = await supabase
    .from("requests")
    .select(
      "id, organization_id, client_id, status",
    )
    .eq("id", conversationId)
    .maybeSingle();

  if (
    conversationError ||
    !conversation
  ) {
    return {
      status: "error",
      message:
        "A conversa não existe ou você não possui acesso.",
    };
  }

  if (
    conversation.status === "completed" ||
    conversation.status === "cancelled"
  ) {
    return {
      status: "error",
      message:
        "Esta conversa foi encerrada e não aceita novas mensagens.",
    };
  }

  const {
    data: clientAccess,
    error: accessError,
  } = await supabase
    .from("client_access")
    .select("id, status")
    .eq(
      "organization_id",
      conversation.organization_id,
    )
    .eq(
      "client_id",
      conversation.client_id,
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (
    accessError ||
    !clientAccess
  ) {
    return {
      status: "error",
      message:
        "Seu acesso a esta conversa não está ativo.",
    };
  }

  const { error: insertError } =
    await supabase
      .from("request_messages")
      .insert({
        organization_id:
          conversation.organization_id,
        request_id: conversation.id,
        author_user_id: null,
        author_client_id:
          conversation.client_id,
        author_client_access_id:
          clientAccess.id,
        sender_type: "client",
        body,
        is_internal: false,
      });

  if (insertError) {
    console.error(
      "Erro ao enviar mensagem do cliente:",
      insertError,
    );

    return {
      status: "error",
      message:
        "Não foi possível enviar a mensagem. Tente novamente.",
    };
  }

  revalidatePath(
    `/portal/conversas/${conversation.id}`,
  );

  revalidatePath("/portal/conversas");

  revalidatePath(
    `/dashboard/conversas/${conversation.id}`,
  );

  revalidatePath(
    "/dashboard/conversas",
  );

  return {
    status: "success",
    message:
      "Mensagem enviada para a equipe.",
  };
}