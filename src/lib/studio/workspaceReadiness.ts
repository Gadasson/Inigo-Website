import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import type { CreatorWorkspaceSection } from './creatorWorkspaceSections';
import { isValidEstimatedDurationMmSs } from '@/lib/studio/formatDuration';
import {
  hasGuidedSessionCover,
  hasGuidedSessionPrimaryMediaConflict,
  hasValidGuidedSessionPrimaryMedia,
} from '@/lib/studio/guidedSessionMedia';

export type WorkspaceReadinessItemState =
  | 'complete'
  | 'waiting'
  | 'recommended'
  | 'coming';

export type WorkspaceReadinessItemKind = 'required' | 'recommended' | 'informational';

export type WorkspaceReadinessItem = {
  id: string;
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
  return (
    form.title.trim().length >= 2 &&
    form.description.trim().length >= 10 &&
    isValidEstimatedDurationMmSs(form.durationMm, form.durationSs) &&
    form.practice.trim().length >= 1 &&
    form.focus.trim().length >= 1 &&
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

/** Guided Session V1 — reusable by Share and future Publish. */
export function buildGuidedSessionWorkspaceReadiness(
  session: StudioGuidedSession,
  form: GuidedSessionEditorForm,
): WorkspaceReadiness {
  const detailsComplete = isGuidedSessionDetailsComplete(form);
  const hasPrimaryMedia = hasValidGuidedSessionPrimaryMedia(session);
  const hasCover = hasGuidedSessionCover(session);

  const items: WorkspaceReadinessItem[] = [
    {
      id: 'details',
      state: detailsComplete ? 'complete' : 'waiting',
      kind: 'required',
    },
    {
      id: 'primary-media',
      state: hasPrimaryMedia ? 'complete' : 'waiting',
      kind: 'required',
    },
    {
      id: 'cover',
      state: hasCover ? 'complete' : 'waiting',
      kind: 'required',
    },
  ];

  return partitionReadiness(items);
}

export type CreationProgressStep = {
  id: string;
  section: CreatorWorkspaceSection;
  readinessId: string;
};

export const CREATION_PROGRESS_STEPS: CreationProgressStep[] = [
  { id: 'details', section: 'content', readinessId: 'details' },
  { id: 'media', section: 'media', readinessId: 'primary-media' },
  { id: 'publish', section: 'share', readinessId: 'publish' },
];

export function sectionForReadinessItem(readinessId: string): CreatorWorkspaceSection | null {
  switch (readinessId) {
    case 'details':
      return 'content';
    case 'primary-media':
    case 'cover':
      return 'media';
    default:
      return null;
  }
}

export function getReadinessItemById(
  readiness: WorkspaceReadiness,
  id: string,
): WorkspaceReadinessItem | undefined {
  return readiness.items.find((item) => item.id === id);
}

export function getCreationStepState(
  readiness: WorkspaceReadiness,
  step: CreationProgressStep,
): WorkspaceReadinessItemState {
  if (step.readinessId === 'publish') {
    return readiness.publishable ? 'complete' : 'waiting';
  }
  if (step.id === 'media') {
    const primary = getReadinessItemById(readiness, 'primary-media');
    const cover = getReadinessItemById(readiness, 'cover');
    if (primary?.state === 'complete' && cover?.state === 'complete') {
      return 'complete';
    }
    return 'waiting';
  }
  const item = getReadinessItemById(readiness, step.readinessId);
  return item?.state ?? 'waiting';
}

export const CREATION_NAV_SEQUENCE: CreatorWorkspaceSection[] = [
  'overview',
  'content',
  'media',
  'share',
];

export function getNextCreationSection(readiness: WorkspaceReadiness): CreatorWorkspaceSection | null {
  const details = getReadinessItemById(readiness, 'details');
  if (details?.state !== 'complete') return 'content';
  const primary = getReadinessItemById(readiness, 'primary-media');
  const cover = getReadinessItemById(readiness, 'cover');
  if (primary?.state !== 'complete' || cover?.state !== 'complete') return 'media';
  return 'share';
}

export function isMediaStepComplete(readiness: WorkspaceReadiness): boolean {
  return (
    getReadinessItemById(readiness, 'primary-media')?.state === 'complete' &&
    getReadinessItemById(readiness, 'cover')?.state === 'complete'
  );
}

export function isDetailsStepComplete(readiness: WorkspaceReadiness): boolean {
  return getReadinessItemById(readiness, 'details')?.state === 'complete';
}

export function getPreviousCreationSection(
  current: CreatorWorkspaceSection,
): CreatorWorkspaceSection | null {
  if (current === 'preview') return 'media';

  const index = CREATION_NAV_SEQUENCE.indexOf(current);
  if (index <= 0) return null;
  return CREATION_NAV_SEQUENCE[index - 1];
}

export function getForwardCreationSection(
  current: CreatorWorkspaceSection,
): CreatorWorkspaceSection | null {
  if (current === 'preview') return 'share';

  const index = CREATION_NAV_SEQUENCE.indexOf(current);
  if (index === -1 || index >= CREATION_NAV_SEQUENCE.length - 1) return null;
  return CREATION_NAV_SEQUENCE[index + 1];
}

export function creationSectionLabelKey(section: CreatorWorkspaceSection): string {
  switch (section) {
    case 'content':
      return 'stepDetails';
    case 'media':
      return 'stepMedia';
    case 'share':
      return 'stepPublish';
    default:
      return section;
  }
}

