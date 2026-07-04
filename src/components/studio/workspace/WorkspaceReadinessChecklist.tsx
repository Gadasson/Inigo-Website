import {
  workspaceReadinessLabel,
  type WorkspaceReadiness,
} from '@/lib/studio/workspaceReadiness';

type Props = {
  readiness: WorkspaceReadiness;
};

export default function WorkspaceReadinessChecklist({ readiness }: Props) {
  return (
    <ul className="creator-workspace__readiness">
      {readiness.items.map((item) => (
        <li
          key={item.id}
          className={`creator-workspace__readiness-item creator-workspace__readiness-item--${item.state}`}
        >
          <span className="creator-workspace__readiness-label">{item.label}</span>
          <span className="creator-workspace__readiness-state">
            {item.state === 'complete' ? '✓ ' : ''}
            {workspaceReadinessLabel(item.state)}
          </span>
        </li>
      ))}
    </ul>
  );
}
