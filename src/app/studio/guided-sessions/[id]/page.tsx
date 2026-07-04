import GuidedSessionDraftRoute from '@/components/studio/GuidedSessionDraftRoute';

export const dynamic = 'force-dynamic';

export default function GuidedSessionDraftPage() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container studio-workspace__container--creator">
        <GuidedSessionDraftRoute />
      </div>
    </main>
  );
}
