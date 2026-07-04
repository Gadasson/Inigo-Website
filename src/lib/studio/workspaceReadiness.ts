import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import {
  hasGuidedSessionCover,
  hasGuidedSessionPrimaryMedia,
} from '@/lib/studio/guidedSessionMedia';

export type WorkspaceReadinessItemState =
  | 'complete'
  | 'waiting'
  | 'recommended'
  | 'coming';

export type WorkspaceReadinessItemKind = 'required' | 'recommended' | 'informational';

export type WorkspaceReadinessItem = {
  id: string;
  label: string;
  state: WorkspaceReadinessItemState;
  kind: WorkspaceReadinessItemKind;
};

export type WorkspaceReadiness = {
  items: WorkspaceReadinessItem[];
  blockingItems: WorkspaceReadinessItem[];
  recommendedItems: WorkspaceReadinessItem[];
  publishable: boolean;
};

function isGuidedSessionDetailsComplete(form: GuidedSessionEditorForm): boolean {
  const minutes = Number(form.durationMinutes);

  return (
    form.title.trim().length >= 2 &&
    form.description.trim().length >= 10 &&
    Number.isFinite(minutes) &&
    minutes >= 1 &&
    minutes <= 180 &&
    form.instructor.trim().length >= 1 &&
    form.environment.trim().length >= 1 &&
    form.backgroundMusic.trim().length >= 1
  );
}

function partitionReadiness(items: WorkspaceReadinessItem[]): WorkspaceReadiness {
  const blockingItems = items.filter(
    (item) => item.kind === 'required' && item.state !== 'complete',
  );
  const recommendedItems = items.filter(
    (item) => item.kind === 'recommended' && item.state !== 'complete',
  );

  return {
    items,
    blockingItems,
    recommendedItems,
    publishable: blockingItems.length === 0,
  };
}

/** Guided Session V1 — reusable by Share, Preview, and future Publish. */
export function buildGuidedSessionWorkspaceReadiness(
  session: StudioGuidedSession,
  form: GuidedSessionEditorForm,
): WorkspaceReadiness {
  const detailsComplete = isGuidedSessionDetailsComplete(form);
  const hasPrimaryMedia = hasGuidedSessionPrimaryMedia(session);
  const hasCover = hasGuidedSessionCover(session);

  const items: WorkspaceReadinessItem[] = [
    {
      id: 'details',
      label: 'Details',
      state: detailsComplete ? 'complete' : 'waiting',
      kind: 'required',
    },
    {
      id: 'primary-media',
      label: 'Audio or video',
      state: hasPrimaryMedia ? 'complete' : 'waiting',
      kind: 'required',
    },
    {
      id: 'cover',
      label: 'Cover image',
      state: hasCover ? 'complete' : 'recommended',
      kind: 'recommended',
    },
    {
      id: 'preview',
      label: 'Preview',
      state: 'coming',
      kind: 'informational',
    },
  ];

  return partitionReadiness(items);
}

export function workspaceReadinessLabel(state: WorkspaceReadinessItemState): string {
  switch (state) {
    case 'complete':
      return 'Complete';
    case 'waiting':
      return 'Waiting';
    case 'recommended':
      return 'Recommended';
    case 'coming':
      return 'Coming next';
  }
}
