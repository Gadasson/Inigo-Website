'use client';

import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import type { CreatorWorkspaceSection } from '@/lib/studio/creatorWorkspaceSections';
import type { WorkspaceReadiness } from '@/lib/studio/workspaceReadiness';
import type { OnGuidedSessionMediaUpdated } from '@/lib/studio/guidedSessionMediaTypes';
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
};

/** Client-only workspace tabs (media, preview, share) in one lazy chunk. */
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
}: Props) {
  if (activeSection === 'media') {
    return (
      <GuidedSessionMediaSection
        session={session}
        isEditable={isEditable}
        onSessionUpdated={onSessionUpdated}
      />
    );
  }

  if (activeSection === 'preview') {
    return <GuidedSessionPreviewSection session={session} form={form} />;
  }

  if (activeSection === 'share') {
    return (
      <GuidedSessionShareSection
        sessionId={sessionId}
        status={status}
        readiness={readiness}
        onSessionPublished={onSessionPublished}
      />
    );
  }

  return null;
}
