'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  CREATOR_WORKSPACE_SECTIONS,
  type CreatorWorkspaceSection,
} from '@/lib/studio/creatorWorkspaceSections';

type Props = {
  title: string;
  status: string;
  statusLabel: string;
  lastSavedLabel: string | null;
  saveState?: 'idle' | 'saving' | 'saved' | 'error';
  activeSection: CreatorWorkspaceSection;
  onSectionChange: (section: CreatorWorkspaceSection) => void;
  backHref?: string;
  children: ReactNode;
};

export default function CreatorWorkspace({
  title,
  status,
  statusLabel,
  lastSavedLabel,
  saveState = 'idle',
  activeSection,
  onSectionChange,
  backHref = '/studio?tab=sessions',
  children,
}: Props) {
  return (
    <div className="creator-workspace">
      <Link href={backHref} className="creator-workspace__back">
        ← Back to Studio
      </Link>

      <header className="creator-workspace__header">
        <div className="creator-workspace__title-row">
          <h1 className="creator-workspace__title">{title || 'Untitled'}</h1>
          <span
            className={`studio-editor__status-badge studio-editor__status-badge--${status}`}
          >
            {statusLabel}
          </span>
        </div>
        {lastSavedLabel ? (
          <p
            className={`creator-workspace__saved studio-editor__save-status${
              saveState !== 'idle' ? ` studio-editor__save-status--${saveState}` : ''
            }`}
            role="status"
            aria-live="polite"
          >
            {lastSavedLabel}
          </p>
        ) : null}
      </header>

      <nav className="creator-workspace__tabs" aria-label="Workspace sections">
        {CREATOR_WORKSPACE_SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={`creator-workspace__tab${
              activeSection === section.id ? ' creator-workspace__tab--active' : ''
            }`}
            aria-current={activeSection === section.id ? 'page' : undefined}
            onClick={() => onSectionChange(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <div className="creator-workspace__panel">{children}</div>
    </div>
  );
}
