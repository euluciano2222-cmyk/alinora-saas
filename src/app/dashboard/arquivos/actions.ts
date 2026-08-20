"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

const STORAGE_BUCKET = "alinora-attachments";
const MAX_FILE_SIZE = 20 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

type PrepareAttachmentInput = {
  conversationId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  isInternal: boolean;
};

export type AttachmentActionResult = {
  status: "success" | "error";
  message: string;
  attachment?: {
    id: string;
    bucket: string;
    path: string;
  };
};

function sanitizeFileName(fileName: string) {
  const normalizedName = fileName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalizedName.slice(0, 180) || "arquivo";
}

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
      error: "Não foi possível identificar sua organização.",
    };
  }

  return {
    supabase,
    user,
    organizationId: membership.organization_id,
    error: null,
  };
}

export async function prepareAttachmentUploadAction(
  input: PrepareAttachmentInput,
): Promise<AttachmentActionResult> {
  const conversationId = input.conversationId.trim();
  const fileName = input.fileName.trim();
  const mimeType = input.mimeType.trim();
  const fileSize = Number(input.fileSize);

  if (!conversationId) {
    return {
      status: "error",
      message: "Selecione uma conversa para vincular o arquivo.",
    };
  }

  if (!fileName || fileName.length > 255) {
    return {
      status: "error",
      message: "O nome do arquivo é inválido.",
    };
  }

  if (
    !Number.isFinite(fileSize) ||
    fileSize < 1 ||
    fileSize > MAX_FILE_SIZE
  ) {
    return {
      status: "error",
      message: "O arquivo deve possuir no máximo 20 MB.",
    };
  }

  if (!allowedMimeTypes.has(mimeType)) {
    return {
      status: "error",
      message: "Este tipo de arquivo não é permitido.",
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
        "Não foi possível autenticar o upload.",
    };
  }

  const {
    data: conversation,
    error: conversationError,
  } = await context.supabase
    .from("requests")
    .select("id, client_id")
    .eq("id", conversationId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (conversationError || !conversation) {
    return {
      status: "error",
      message:
        "A conversa selecionada não existe ou você não possui acesso.",
    };
  }

  const safeFileName = sanitizeFileName(fileName);

  const storagePath = [
    context.organizationId,
    conversation.client_id,
    conversation.id,
    `${crypto.randomUUID()}-${safeFileName}`,
  ].join("/");

  const {
    data: attachment,
    error: attachmentError,
  } = await context.supabase
    .from("attachments")
    .insert({
      organization_id: context.organizationId,
      client_id: conversation.client_id,
      request_id: conversation.id,
      message_id: null,
      uploaded_by: context.user.id,
      uploaded_by_client_access_id: null,
      file_name: fileName,
      mime_type: mimeType,
      file_size_bytes: fileSize,
      storage_bucket: STORAGE_BUCKET,
      storage_path: storagePath,
      is_internal: input.isInternal,
    })
    .select("id, storage_bucket, storage_path")
    .single();

  if (attachmentError || !attachment) {
    console.error(
      "Erro ao preparar anexo:",
      attachmentError,
    );

    return {
      status: "error",
      message:
        "Não foi possível preparar o arquivo para upload.",
    };
  }

  return {
    status: "success",
    message: "Upload preparado com segurança.",
    attachment: {
      id: attachment.id,
      bucket: attachment.storage_bucket,
      path: attachment.storage_path,
    },
  };
}

export async function completeAttachmentUploadAction(
  attachmentId: string,
): Promise<AttachmentActionResult> {
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
        "Não foi possível confirmar o upload.",
    };
  }

  const {
    data: attachment,
    error: attachmentError,
  } = await context.supabase
    .from("attachments")
    .select("id, storage_bucket, storage_path")
    .eq("id", attachmentId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (attachmentError || !attachment) {
    return {
      status: "error",
      message:
        "Os metadados do arquivo não foram encontrados.",
    };
  }

  const {
    data: fileExists,
    error: storageError,
  } = await context.supabase.storage
    .from(attachment.storage_bucket)
    .exists(attachment.storage_path);

  if (storageError || !fileExists) {
    console.error(
      "Erro ao confirmar objeto:",
      storageError,
    );

    return {
      status: "error",
      message:
        "O arquivo não foi encontrado no armazenamento.",
    };
  }

  revalidatePath("/dashboard/arquivos");

  return {
    status: "success",
    message: "Arquivo enviado com sucesso.",
  };
}

export async function cancelAttachmentUploadAction(
  attachmentId: string,
): Promise<void> {
  const context = await getAuthenticatedContext();

  if (context.error || !context.organizationId) {
    return;
  }

  const {
    data: attachment,
    error: attachmentError,
  } = await context.supabase
    .from("attachments")
    .select("id, storage_bucket, storage_path")
    .eq("id", attachmentId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (attachmentError || !attachment) {
    return;
  }

  await context.supabase.storage
    .from(attachment.storage_bucket)
    .remove([attachment.storage_path]);

  await context.supabase
    .from("attachments")
    .delete()
    .eq("id", attachment.id)
    .eq("organization_id", context.organizationId);
}

export async function deleteAttachmentAction(
  attachmentId: string,
): Promise<AttachmentActionResult> {
  const normalizedAttachmentId = attachmentId.trim();

  if (!normalizedAttachmentId) {
    return {
      status: "error",
      message: "O arquivo informado é inválido.",
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
        "Não foi possível autenticar a exclusão.",
    };
  }

  const {
    data: attachment,
    error: attachmentError,
  } = await context.supabase
    .from("attachments")
    .select(
      `
        id,
        request_id,
        storage_bucket,
        storage_path
      `,
    )
    .eq("id", normalizedAttachmentId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();

  if (attachmentError) {
    console.error(
      "Erro ao consultar arquivo para exclusão:",
      attachmentError,
    );

    return {
      status: "error",
      message:
        "Não foi possível consultar o arquivo selecionado.",
    };
  }

  if (!attachment) {
    return {
      status: "error",
      message:
        "O arquivo não existe ou você não possui acesso.",
    };
  }

  const { error: storageError } =
    await context.supabase.storage
      .from(attachment.storage_bucket)
      .remove([attachment.storage_path]);

  if (storageError) {
    console.error(
      "Erro ao excluir objeto do armazenamento:",
      storageError,
    );

    return {
      status: "error",
      message:
        "Não foi possível remover o arquivo do armazenamento.",
    };
  }

  const {
    data: deletedAttachment,
    error: deleteError,
  } = await context.supabase
    .from("attachments")
    .delete()
    .eq("id", attachment.id)
    .eq("organization_id", context.organizationId)
    .select("id")
    .maybeSingle();

  if (deleteError || !deletedAttachment) {
    console.error(
      "Erro ao excluir metadados do arquivo:",
      deleteError,
    );

    return {
      status: "error",
      message:
        "O arquivo foi removido do armazenamento, mas não foi possível finalizar a exclusão do registro.",
    };
  }

  revalidatePath("/dashboard/arquivos");
  revalidatePath(
    `/dashboard/conversas/${attachment.request_id}`,
  );

  return {
    status: "success",
    message: "Arquivo excluído com sucesso.",
  };
}