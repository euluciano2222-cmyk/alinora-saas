"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type ApprovalResponseState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ApprovalDecision =
  | "approved"
  | "changes_requested";

const validDecisions: ApprovalDecision[] = [
  "approved",
  "changes_requested",
];

function getFormValue(
  formData: FormData,
  field: string,
) {
  return String(
    formData.get(field) ?? "",
  ).trim();
}

function refreshApprovalPages(
  requestId?: string,
) {
  revalidatePath("/portal");
  revalidatePath("/dashboard/entregas");

  if (requestId) {
    revalidatePath(
      `/dashboard/conversas/${requestId}`,
    );
  }
}

export async function respondToApprovalAction(
  _previousState: ApprovalResponseState,
  formData: FormData,
): Promise<ApprovalResponseState> {
  const approvalId = getFormValue(
    formData,
    "approvalId",
  );

  const decision = getFormValue(
    formData,
    "decision",
  ) as ApprovalDecision;

  const responseNote = getFormValue(
    formData,
    "responseNote",
  );

  if (!approvalId) {
    return {
      status: "error",
      message:
        "A entrega não foi encontrada.",
    };
  }

  if (!validDecisions.includes(decision)) {
    return {
      status: "error",
      message:
        "Selecione uma resposta válida.",
    };
  }

  if (
    decision === "changes_requested" &&
    responseNote.length < 3
  ) {
    return {
      status: "error",
      message:
        "Descreva quais alterações são necessárias.",
    };
  }

  if (responseNote.length > 5000) {
    return {
      status: "error",
      message:
        "A observação pode possuir no máximo 5.000 caracteres.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login?next=/portal");
  }

  const {
    data: approval,
    error: approvalError,
  } = await supabase
    .from("approvals")
    .select(
      "id, request_id, organization_id, client_id, status",
    )
    .eq("id", approvalId)
    .maybeSingle();

  if (approvalError || !approval) {
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
        "Esta entrega já recebeu uma resposta.",
    };
  }

  const {
    data: clientAccess,
    error: accessError,
  } = await supabase
    .from("client_access")
    .select("id, role, status")
    .eq(
      "organization_id",
      approval.organization_id,
    )
    .eq(
      "client_id",
      approval.client_id,
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (
    accessError ||
    !clientAccess ||
    clientAccess.role !== "approver"
  ) {
    return {
      status: "error",
      message:
        "Seu acesso permite apenas visualizar esta entrega.",
    };
  }

  const now = new Date().toISOString();

  const {
    data: updatedApproval,
    error: updateError,
  } = await supabase
    .from("approvals")
    .update({
      status: decision,
      response_note:
        responseNote || null,
      responded_at: now,
      updated_at: now,
    })
    .eq("id", approval.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error(
      "Erro ao responder aprovação:",
      updateError,
    );

    return {
      status: "error",
      message:
        "Não foi possível registrar sua resposta. Tente novamente.",
    };
  }

  if (!updatedApproval) {
    return {
      status: "error",
      message:
        "Esta entrega já foi respondida ou não está mais disponível.",
    };
  }

  refreshApprovalPages(
    approval.request_id,
  );

  return {
    status: "success",
    message:
      decision === "approved"
        ? "Entrega aprovada com sucesso."
        : "Solicitação de alterações registrada com sucesso.",
  };
}