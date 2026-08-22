"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export type DeliveryActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const initialActionState: DeliveryActionState = {
  status: "idle",
  message: "",
};

async function getAuthenticatedContext() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      supabase,
      user: null,
      organizationId: null,
      error: "Sua sessão expirou. Entre novamente.",
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
      supabase,
      user,
      organizationId: null,
      error:
        "Não foi possível identificar sua organização.",
    };
  }

  return {
    supabase,
    user,
    organizationId: membership.organization_id,
    error: null,
  };
}

export async function createDeliveryAction(
  _previousState: DeliveryActionState =
    initialActionState,
  formData: FormData,
): Promise<DeliveryActionState> {
  const conversationId = String(
    formData.get("conversationId") ?? "",
  ).trim();

  const message = String(
    formData.get("message") ?? "",
  ).trim();

  if (!conversationId) {
    return {
      status: "error",
      message:
        "Selecione uma conversa para criar a entrega.",
    };
  }

  if (message.length > 5000) {
    return {
      status: "error",
      message:
        "A mensagem deve possuir no máximo 5.000 caracteres.",
    };
  }

  const context = await getAuthenticatedContext();

  if (
    context.error ||
    !context.user ||
    !context.organizationId
  ) {
    return {
      status: "error",
      message:
        context.error ??
        "Não foi possível autenticar a solicitação.",
    };
  }

  const {
    data: conversation,
    error: conversationError,
  } = await context.supabase
    .from("requests")
    .select("id, client_id, title")
    .eq("id", conversationId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (conversationError) {
    console.error(
      "Erro ao consultar conversa da entrega:",
      conversationError,
    );

    return {
      status: "error",
      message:
        "Não foi possível consultar a conversa selecionada.",
    };
  }

  if (!conversation) {
    return {
      status: "error",
      message:
        "A conversa não existe ou você não possui acesso.",
    };
  }

  const {
    count: visibleAttachmentCount,
    error: attachmentError,
  } = await context.supabase
    .from("attachments")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("request_id", conversation.id)
    .eq("organization_id", context.organizationId)
    .eq("is_internal", false);

  if (attachmentError) {
    console.error(
      "Erro ao verificar arquivos da entrega:",
      attachmentError,
    );

    return {
      status: "error",
      message:
        "Não foi possível verificar os arquivos vinculados.",
    };
  }

  if (!visibleAttachmentCount) {
    return {
      status: "error",
      message:
        "Adicione pelo menos um arquivo visível ao cliente antes de solicitar a aprovação.",
    };
  }

  const {
    data: pendingApproval,
    error: pendingApprovalError,
  } = await context.supabase
    .from("approvals")
    .select("id")
    .eq("request_id", conversation.id)
    .eq("organization_id", context.organizationId)
    .eq("status", "pending")
    .limit(1)
    .maybeSingle();

  if (pendingApprovalError) {
    console.error(
      "Erro ao consultar aprovação pendente:",
      pendingApprovalError,
    );

    return {
      status: "error",
      message:
        "Não foi possível verificar as aprovações existentes.",
    };
  }

  if (pendingApproval) {
    return {
      status: "error",
      message:
        "Essa conversa já possui uma entrega aguardando aprovação.",
    };
  }

  const {
    data: approval,
    error: approvalError,
  } = await context.supabase
    .from("approvals")
    .insert({
      organization_id: context.organizationId,
      client_id: conversation.client_id,
      request_id: conversation.id,
      requested_by: context.user.id,
      message: message || null,
      status: "pending",
    })
    .select("id")
    .single();

  if (approvalError || !approval) {
    console.error(
      "Erro ao criar entrega:",
      approvalError,
    );

    if (approvalError?.code === "23505") {
      return {
        status: "error",
        message:
          "Essa conversa já possui uma entrega aguardando aprovação.",
      };
    }

    return {
      status: "error",
      message:
        "Não foi possível enviar a entrega para aprovação.",
    };
  }

  revalidatePath("/dashboard/entregas");
  revalidatePath(
    `/dashboard/conversas/${conversation.id}`,
  );

  return {
    status: "success",
    message:
      "Entrega enviada para aprovação com sucesso.",
  };
}

export async function cancelDeliveryAction(
  approvalId: string,
): Promise<DeliveryActionState> {
  const normalizedApprovalId = approvalId.trim();

  if (!normalizedApprovalId) {
    return {
      status: "error",
      message: "A entrega informada é inválida.",
    };
  }

  const context = await getAuthenticatedContext();

  if (
    context.error ||
    !context.user ||
    !context.organizationId
  ) {
    return {
      status: "error",
      message:
        context.error ??
        "Não foi possível autenticar o cancelamento.",
    };
  }

  const {
    data: approval,
    error: approvalError,
  } = await context.supabase
    .from("approvals")
    .select("id, request_id, status")
    .eq("id", normalizedApprovalId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (approvalError) {
    console.error(
      "Erro ao consultar entrega:",
      approvalError,
    );

    return {
      status: "error",
      message:
        "Não foi possível consultar a entrega.",
    };
  }

  if (!approval) {
    return {
      status: "error",
      message:
        "A entrega não existe ou você não possui acesso.",
    };
  }

  if (approval.status !== "pending") {
    return {
      status: "error",
      message:
        "Somente entregas aguardando aprovação podem ser canceladas.",
    };
  }

  const {
    data: updatedApproval,
    error: updateError,
  } = await context.supabase
    .from("approvals")
    .update({
      status: "cancelled",
    })
    .eq("id", approval.id)
    .eq("organization_id", context.organizationId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError || !updatedApproval) {
    console.error(
      "Erro ao cancelar entrega:",
      updateError,
    );

    return {
      status: "error",
      message:
        "Não foi possível cancelar a entrega.",
    };
  }

  revalidatePath("/dashboard/entregas");
  revalidatePath(
    `/dashboard/conversas/${approval.request_id}`,
  );

  return {
    status: "success",
    message: "Entrega cancelada com sucesso.",
  };
}