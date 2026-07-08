'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import StudioFieldHint from '@/components/studio/StudioFieldHint';
import type { GuidedSessionFieldHintKey } from '@/lib/studio/guidedSessionFieldHints';

type Props = {
  htmlFor: string;
  hintKey?: GuidedSessionFieldHintKey;
  children: ReactNode;
};

export default function StudioFieldLabel({ htmlFor, hintKey, children }: Props) {
  const t = useTranslations('hints');
  const hint = hintKey ? t(hintKey) : undefined;
  const hintId = hint ? `${htmlFor}-hint` : undefined;

  return (
    <div className="studio-form__label-row">
      <label htmlFor={htmlFor}>{children}</label>
      {hint && hintId ? <StudioFieldHint text={hint} id={hintId} /> : null}
    </div>
  );
}
