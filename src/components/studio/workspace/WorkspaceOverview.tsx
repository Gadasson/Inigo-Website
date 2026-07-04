type Props = {
  title: string;
  description: string;
  statusLabel: string;
  lastUpdated: string | null;
  creator: string;
};

export default function WorkspaceOverview({
  title,
  description,
  statusLabel,
  lastUpdated,
  creator,
}: Props) {
  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-overview-heading">
      <h2 id="workspace-overview-heading" className="creator-workspace__section-title">
        Overview
      </h2>
      <p className="creator-workspace__section-lede">
        A quick read on what you are creating — details live in Content.
      </p>

      <dl className="creator-workspace__overview">
        <div className="creator-workspace__overview-item">
          <dt>Title</dt>
          <dd>{title.trim() || 'Untitled'}</dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>Description</dt>
          <dd>{description.trim() || 'No description yet.'}</dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>Status</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>Last updated</dt>
          <dd>{lastUpdated ?? '—'}</dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>Creator</dt>
          <dd>{creator.trim() || '—'}</dd>
        </div>
      </dl>
    </section>
  );
}
