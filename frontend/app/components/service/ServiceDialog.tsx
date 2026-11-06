"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function ServiceDialog({
  id,
  title,
  busy,
  onClose,
  children,
}: {
  id: string;
  title: string;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    if (!dialog) return;
    dialog.showModal();
    dialog.querySelector<HTMLElement>("[data-dialog-focus]")?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
      else
        document
          .querySelector<HTMLElement>("[data-dialog-return-focus]")
          ?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className="service-dialog"
      aria-labelledby={`${id}-title`}
      aria-busy={busy}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>(
          'button:enabled, input:enabled, textarea:enabled, select:enabled, a[href], [tabindex="0"]',
        );
        const firstControl = controls[0];
        const lastControl = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === firstControl) {
          event.preventDefault();
          lastControl?.focus();
        } else if (!event.shiftKey && document.activeElement === lastControl) {
          event.preventDefault();
          firstControl?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
    >
      <div className="dialog-heading d-flex align-items-center justify-content-between gap-3">
        <h2 id={`${id}-title`} className="h5 fw-bold mb-0">
          {title}
        </h2>
        <button
          type="button"
          className="btn-close"
          aria-label="Fechar janela"
          disabled={busy}
          onClick={onClose}
        />
      </div>
      <div className="dialog-content">{children}</div>
    </dialog>
  );
}
