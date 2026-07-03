import CreateGuidedSessionForm from '@/components/studio/CreateGuidedSessionForm';

export default function NewGuidedSessionPage() {
  return (
    <main className="studio-workspace">
      <div className="studio-workspace__container studio-workspace__container--form">
        <CreateGuidedSessionForm />
      </div>
    </main>
  );
}
