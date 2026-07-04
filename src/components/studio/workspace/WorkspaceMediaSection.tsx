const MEDIA_SLOTS = [
  { id: 'audio', label: 'Audio', note: 'Coming next' },
  { id: 'cover', label: 'Cover image', note: 'Coming next' },
  { id: 'video', label: 'Video', note: 'Coming next' },
] as const;

export default function WorkspaceMediaSection() {
  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-media-heading">
      <h2 id="workspace-media-heading" className="creator-workspace__section-title">
        Media
      </h2>
      <p className="creator-workspace__section-lede">
        Audio, cover art, and supporting media will live here.
      </p>

      <ul className="creator-workspace__slot-list">
        {MEDIA_SLOTS.map((slot) => (
          <li key={slot.id} className="creator-workspace__slot">
            <div className="creator-workspace__slot-main">
              <span className="creator-workspace__slot-label">{slot.label}</span>
              <span className="creator-workspace__slot-note">{slot.note}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
