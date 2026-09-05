"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { unstable_rethrow } from "next/navigation";
import { ConfirmModal } from "./ConfirmModal";

interface SubmitWithConfirmProps {
  action: (formData: FormData) => Promise<any> | void;
  id?: string;
  buttonElement: React.ReactNode;
  modalTitle: string;
  modalDesc: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  wrapperClassName?: string;
}

export function SubmitWithConfirm({ action, id, buttonElement, modalTitle, modalDesc, confirmText = "Hapus", cancelText = "Batal", isDestructive = true, wrapperClassName = "" }: SubmitWithConfirmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  const handleConfirm = async () => {
    // Guard synchronous — a fast double-click on the confirm button fires two native
    // click events before React's `loading` state re-render can disable it, which would
    // otherwise send the delete/edit action twice concurrently.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);

    if (formRef.current) {
      const formData = new FormData(formRef.current);
      try {
        const result = await action(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          // Kebanyakan aksi hapus di admin cuma `throw` kalau gagal dan tidak mengembalikan apa
          // pun kalau berhasil (bukan { success, message }) — tanpa fallback ini, berhasil hapus
          // jadi senyap, tidak ada status apa pun yang muncul di pojok kanan atas.
          toast.success(result?.message || "Berhasil dilakukan.");
        }
      } catch (e: any) {
        // redirect()/signOut({ redirectTo }) inside a server action work by throwing a special
        // control-flow error — swallowing it here as a generic failure (e.g. on logout) blocks
        // the navigation and shows a false "Terjadi kesalahan" toast even though the action
        // itself succeeded. Rethrow it so Next.js can still perform the redirect.
        unstable_rethrow(e);
        toast.error("Terjadi kesalahan.");
      }
    }

    isSubmittingRef.current = false;
    setLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <div onClick={() => setIsOpen(true)} className={`inline-block cursor-pointer ${wrapperClassName}`}>
        {buttonElement}
      </div>

      <form ref={formRef} className="hidden">
        {id && <input type="hidden" name="id" value={id} />}
      </form>

      <ConfirmModal isOpen={isOpen} onClose={() => setIsOpen(false)} onConfirm={handleConfirm} title={modalTitle} description={modalDesc} confirmText={confirmText} cancelText={cancelText} isDestructive={isDestructive} isLoading={loading} />
    </>
  );
}
