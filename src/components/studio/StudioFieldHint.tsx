'use client';

import { useEffect, useState } from 'react';

type Props = {
  id: string;
  text: string;
  label?: string;
};

export default function StudioFieldHint({ id, text, label = 'Field help' }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const root = document.getElementById(id)?.closest('.studio-field-hint');
      if (root && event.target instanceof Node && root.contains(event.target)) return;
      setOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [id, open]);

  return (
    <span className={`studio-field-hint${open ? ' studio-field-hint--open' : ''}`}>
      <button
        type="button"
        className="studio-field-hint__btn"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((current) => !current)}
      >
        i
      </button>
      <span id={id} role="tooltip" className="studio-field-hint__tooltip">
        {text}
      </span>
    </span>
  );
}
