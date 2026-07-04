'use client';

import { Suspense } from 'react';
import GuidedSessionEditor from '@/components/studio/GuidedSessionEditor';

type Props = {
  sessionId: number;
};

export default function GuidedSessionDraftView({ sessionId }: Props) {
  return (
    <Suspense
      fallback={
        <p className="studio-form-page__status" role="status">
          Loading session…
        </p>
      }
    >
      <GuidedSessionEditor sessionId={sessionId} />
    </Suspense>
  );
}
