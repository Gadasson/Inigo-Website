'use client';

import dynamic from 'next/dynamic';

const GuidedSessionDraftRoute = dynamic(
  () => import('@/components/studio/GuidedSessionDraftRoute'),
  {
    ssr: false,
    loading: () => (
      <p className="studio-form-page__status" role="status">
        Loading session…
      </p>
    ),
  },
);

export default function GuidedSessionDraftPageClient() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container studio-workspace__container--creator">
        <GuidedSessionDraftRoute />
      </div>
    </main>
  );
}
