'use client';

import { useParams } from 'next/navigation';
import GuidedSessionDraftView from '@/components/studio/GuidedSessionDraftView';

export default function GuidedSessionDraftRoute() {
  const params = useParams();
  const rawId = params?.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const numericId = Number(idStr);

  if (!idStr || !Number.isInteger(numericId) || numericId <= 0) {
    return <p className="studio-form__error">Invalid session ID.</p>;
  }

  return <GuidedSessionDraftView sessionId={numericId} />;
}
