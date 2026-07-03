'use client';

import GuidedSessionEditor from '@/components/studio/GuidedSessionEditor';

type Props = {
  sessionId: number;
};

export default function GuidedSessionDraftView({ sessionId }: Props) {
  return <GuidedSessionEditor sessionId={sessionId} />;
}
