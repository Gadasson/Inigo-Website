'use client';

import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { useStudioLocale } from '@/contexts/StudioIntlContext';

type Props = {
  open: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  confirmBusy?: boolean;
  confirmBusyLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function StudioConfirmDialog({
  open,
  title,
  message,
  cancelLabel,
  confirmLabel,
  confirmBusy = false,
  confirmBusyLabel,
  onCancel,
  onConfirm,
}: Props) {
  const titleId = useId();
  const { locale } = useStudioLocale();
  const dir = locale === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !confirmBusy) {
        onCancel();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, confirmBusy, onCancel]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className="studio-confirm-dialog__backdrop"
      dir={dir}
      lang={locale}
      onClick={confirmBusy ? undefined : onCancel}
    >
      <div
        className="studio-confirm-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId} className="studio-confirm-dialog__title">
          {title}
        </h3>
        <p className="studio-confirm-dialog__text">{message}</p>
        <div className="studio-confirm-dialog__actions">
          {dir === 'rtl' ? (
            <>
              <button
                type="button"
                className="studio-form__submit studio-confirm-dialog__btn"
                disabled={confirmBusy}
                onClick={onConfirm}
              >
                {confirmBusy && confirmBusyLabel ? confirmBusyLabel : confirmLabel}
              </button>
              <button
                type="button"
                className="studio-confirm-dialog__btn studio-confirm-dialog__btn--secondary"
                disabled={confirmBusy}
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="studio-confirm-dialog__btn studio-confirm-dialog__btn--secondary"
                disabled={confirmBusy}
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="studio-form__submit studio-confirm-dialog__btn"
                disabled={confirmBusy}
                onClick={onConfirm}
              >
                {confirmBusy && confirmBusyLabel ? confirmBusyLabel : confirmLabel}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
