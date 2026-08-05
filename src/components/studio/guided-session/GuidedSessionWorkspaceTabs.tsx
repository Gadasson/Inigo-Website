'use client';

import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import type { CreatorWorkspaceSection } from '@/lib/studio/creatorWorkspaceSections';
import type { WorkspaceReadiness } from '@/lib/studio/workspaceReadiness';
import type { OnGuidedSessionMediaUpdated } from '@/lib/studio/guidedSessionMediaTypes';
import type { GuidedSessionMediaActivity } from '@/lib/studio/guidedSessionMedia';
import GuidedSessionMediaSection from '@/components/studio/guided-session/GuidedSessionMediaSection';
import GuidedSessionPreviewSection from '@/components/studio/guided-session/GuidedSessionPreviewSection';
import GuidedSessionShareSection from '@/components/studio/guided-session/GuidedSessionShareSection';

type Props = {
  activeSection: CreatorWorkspaceSection;
  session: StudioGuidedSession;
  form: GuidedSessionEditorForm;
  sessionId: number;
  status: string;
  readiness: WorkspaceReadiness;
  isEditable: boolean;
  onSessionUpdated: OnGuidedSessionMediaUpdated;
  onSessionPublished: (session: StudioGuidedSession) => void;
  onMediaActivityChange?: (activity: GuidedSessionMediaActivity) => void;
};

/**
 * Client-only workspace tabs (media, preview, share).
 * Media stays mounted while the lazy chunk is open so in-flight upload /
 * attach-pending state survives Preview ↔ Publish navigation.
 */
export default function GuidedSessionWorkspaceTabs({
  activeSection,
  session,
  form,
  sessionId,
  status,
  readiness,
  isEditable,
  onSessionUpdated,
  onSessionPublished,
  onMediaActivityChange,
}: Props) {
  const showMediaPane =
    activeSection === 'media' || activeSection === 'preview' || activeSection === 'share';

  return (
    <>
      {showMediaPane ? (
        <div hidden={activeSection !== 'media'}>
          <GuidedSessionMediaSection
            session={session}
            isEditable={isEditable}
            onSessionUpdated={onSessionUpdated}
            onMediaActivityChange={onMediaActivityChange}
          />
        </div>
      ) : null}

      {activeSection === 'preview' ? (
        <GuidedSessionPreviewSection session={session} form={form} />
      ) : null}

      {activeSection === 'share' ? (
        <GuidedSessionShareSection
          sessionId={sessionId}
          sessionSlug={session.session_id}
          status={status}
          isAvailable={session.is_available ?? false}
          readiness={readiness}
          onSessionPublished={onSessionPublished}
        />
      ) : null}
    </>
  );
}
