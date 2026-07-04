import type { WorkspaceReadiness } from '@/lib/studio/workspaceReadiness';
import WorkspaceReadinessChecklist from '@/components/studio/workspace/WorkspaceReadinessChecklist';

type Props = {
  readiness: WorkspaceReadiness;
};

export default function WorkspaceShareSection({ readiness }: Props) {
  const { publishable } = readiness;

  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-share-heading">
      <h2 id="workspace-share-heading" className="creator-workspace__section-title">
        Ready to share
      </h2>
      <p className="creator-workspace__section-lede">
        {publishable
          ? 'Everything required is ready.'
          : 'Complete the missing items before sharing.'}
      </p>

      <WorkspaceReadinessChecklist readiness={readiness} />
    </section>
  );
}
