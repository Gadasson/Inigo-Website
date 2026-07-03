import CreateGuidedSessionRoute from '@/components/studio/CreateGuidedSessionRoute';

export const dynamic = 'force-dynamic';

export default function NewGuidedSessionPage() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container studio-workspace__container--form">
        <CreateGuidedSessionRoute />
      </div>
    </main>
  );
}
