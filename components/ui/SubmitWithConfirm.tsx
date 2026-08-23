"use client";

import { useState, useRef } from "react";
import { ConfirmModal } from "./ConfirmModal";

interface SubmitWithConfirmProps {
  action: (formData: FormData) => void;
  id?: string;
  buttonElement: React.ReactNode;
  modalTitle: string;
  modalDesc: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function SubmitWithConfirm({
  action,
  id,
  buttonElement,
  modalTitle,
  modalDesc,
  confirmText = "Hapus",
  cancelText = "Batal",
  isDestructive = true,
}: SubmitWithConfirmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <>
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {buttonElement}
      </div>

      <form ref={formRef} action={action} className="hidden">
        {id && <input type="hidden" name="id" value={id} />}
      </form>

      <ConfirmModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onConfirm={() => {
          setIsOpen(false);
          formRef.current?.requestSubmit();
        }}
        title={modalTitle}
        description={modalDesc}
        confirmText={confirmText}
        cancelText={cancelText}
        isDestructive={isDestructive}
      />
    </>
  );
}
