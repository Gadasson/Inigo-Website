import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { WorkspaceReadinessItem } from '@/components/studio/workspace/WorkspaceShareSection';
import {
  hasGuidedSessionCover,
  hasGuidedSessionPrimaryMedia,
} from '@/lib/studio/guidedSessionMedia';

export function buildGuidedSessionShareReadiness(
  session: StudioGuidedSession,
  metadataComplete: boolean,
): WorkspaceReadinessItem[] {
  const hasPrimaryMedia = hasGuidedSessionPrimaryMedia(session);
  const hasCover = hasGuidedSessionCover(session);

  return [
    {
      id: 'metadata',
      label: 'Metadata',
      state: metadataComplete ? 'complete' : 'waiting',
    },
    {
      id: 'primary-media',
      label: 'Audio or video',
      state: hasPrimaryMedia ? 'complete' : 'waiting',
    },
    {
      id: 'cover',
      label: 'Cover image',
      state: hasCover ? 'complete' : 'waiting',
    },
    {
      id: 'preview',
      label: 'Preview',
      state: 'coming',
    },
  ];
}
