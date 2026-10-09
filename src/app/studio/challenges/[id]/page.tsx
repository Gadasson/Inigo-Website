import ChallengeEditorRoute from '@/components/studio/challenges/ChallengeEditorRoute';

export const dynamic = 'force-dynamic';

export default function ChallengeEditorPage() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container studio-workspace__container--form">
        <ChallengeEditorRoute />
      </div>
    </main>
  );
}
