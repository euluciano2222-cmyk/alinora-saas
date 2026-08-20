"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { deleteAttachmentAction } from "./actions";
import styles from "./arquivos.module.css";

type DeleteAttachmentButtonProps = {
  attachmentId: string;
  fileName: string;
};

export default function DeleteAttachmentButton({
  attachmentId,
  fileName,
}: DeleteAttachmentButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState("");

  function handleDelete() {
    const confirmed = window.confirm(
      `Deseja realmente excluir o arquivo "${fileName}"?\n\nEssa ação não poderá ser desfeita.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    startTransition(async () => {
      const result =
        await deleteAttachmentAction(attachmentId);

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className={styles.deleteControl}>
      <button
        type="button"
        className={styles.deleteButton}
        disabled={isPending}
        onClick={handleDelete}
        aria-label={`Excluir o arquivo ${fileName}`}
      >
        {isPending ? "Excluindo..." : "Excluir"}
      </button>

      {errorMessage ? (
        <p
          className={styles.deleteFeedback}
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}