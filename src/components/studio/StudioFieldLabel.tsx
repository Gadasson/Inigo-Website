import type { ReactNode } from 'react';
import StudioFieldHint from '@/components/studio/StudioFieldHint';
import {
  GUIDED_SESSION_FIELD_HINTS,
  type GuidedSessionFieldHintKey,
} from '@/lib/studio/guidedSessionFieldHints';

type Props = {
  htmlFor: string;
  hintKey?: GuidedSessionFieldHintKey;
  children: ReactNode;
};

export default function StudioFieldLabel({ htmlFor, hintKey, children }: Props) {
  const hint = hintKey ? GUIDED_SESSION_FIELD_HINTS[hintKey] : undefined;
  const hintId = hint ? `${htmlFor}-hint` : undefined;

  return (
    <div className="studio-form__label-row">
      <label htmlFor={htmlFor}>{children}</label>
      {hint && hintId ? <StudioFieldHint text={hint} id={hintId} /> : null}
    </div>
  );
}
