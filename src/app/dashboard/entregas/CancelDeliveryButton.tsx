"use client";

import {
  useState,
  useTransition,
} from "react";

import { useRouter } from "next/navigation";

import { cancelDeliveryAction } from "./actions";
import styles from "./entregas.module.css";

type CancelDeliveryButtonProps = {
  approvalId: string;
  conversationTitle: string;
};

export default function CancelDeliveryButton({
  approvalId,
  conversationTitle,
}: CancelDeliveryButtonProps) {
  const router = useRouter();

  const [isPending, startTransition] =
    useTransition();

  const [errorMessage, setErrorMessage] =
    useState("");

  function handleCancel() {
    const confirmed = window.confirm(
      `Deseja cancelar a entrega relacionada à conversa "${conversationTitle}"?\n\nO cliente não poderá mais responder a essa solicitação.`,
    );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    startTransition(async () => {
      const result =
        await cancelDeliveryAction(approvalId);

      if (result.status === "error") {
        setErrorMessage(result.message);
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className={styles.cancelControl}>
      <button
        type="button"
        className={styles.cancelButton}
        disabled={isPending}
        onClick={handleCancel}
      >
        {isPending
          ? "Cancelando..."
          : "Cancelar entrega"}
      </button>

      {errorMessage ? (
        <p
          className={styles.cancelFeedback}
          role="alert"
          aria-live="polite"
        >
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}