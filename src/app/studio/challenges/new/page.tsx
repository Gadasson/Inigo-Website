import ChallengeEditor from '@/components/studio/challenges/ChallengeEditor';

export const dynamic = 'force-dynamic';

export default function NewChallengePage() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container studio-workspace__container--form">
        <ChallengeEditor mode="create" />
      </div>
    </main>
  );
}
