export type WorkspaceReadinessState = 'complete' | 'waiting' | 'coming';

export type WorkspaceReadinessItem = {
  id: string;
  label: string;
  state: WorkspaceReadinessState;
};

type Props = {
  items: WorkspaceReadinessItem[];
};

function readinessLabel(state: WorkspaceReadinessState): string {
  switch (state) {
    case 'complete':
      return 'Complete';
    case 'waiting':
      return 'Waiting';
    case 'coming':
      return 'Coming next';
  }
}

export default function WorkspaceShareSection({ items }: Props) {
  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-share-heading">
      <h2 id="workspace-share-heading" className="creator-workspace__section-title">
        Ready to share
      </h2>
      <p className="creator-workspace__section-lede">
        See what is ready before this content can go live.
      </p>

      <ul className="creator-workspace__readiness">
        {items.map((item) => (
          <li key={item.id} className={`creator-workspace__readiness-item creator-workspace__readiness-item--${item.state}`}>
            <span className="creator-workspace__readiness-label">{item.label}</span>
            <span className="creator-workspace__readiness-state">
              {item.state === 'complete' ? '✓ ' : ''}
              {readinessLabel(item.state)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
