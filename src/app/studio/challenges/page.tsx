import MyChallenges from '@/components/studio/challenges/MyChallenges';

export const dynamic = 'force-dynamic';

export default function ChallengesPage() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container">
        <MyChallenges />
      </div>
    </main>
  );
}
