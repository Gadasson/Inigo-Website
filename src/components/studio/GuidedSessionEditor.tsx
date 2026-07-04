'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGuidedSession,
  updateGuidedSessionDraft,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { StudioApiError } from '@/lib/api/studioApiClient';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import { guidedSessionStatusLabel } from '@/lib/studio/guidedSessionStatus';
import {
  buildGuidedSessionPatch,
  sessionToEditorForm,
  type GuidedSessionEditorForm,
} from '@/lib/studio/guidedSessionEditorForm';
import {
  parseCreatorWorkspaceSection,
  type CreatorWorkspaceSection,
} from '@/lib/studio/creatorWorkspaceSections';
import { formatSessionDate, sessionTimestampLabel } from '@/lib/studio/formatSessionDate';
import { buildGuidedSessionShareReadiness } from '@/lib/studio/guidedSessionShareReadiness';
import GuidedSessionFormFields from '@/components/studio/GuidedSessionFormFields';
import CreatorWorkspace from '@/components/studio/workspace/CreatorWorkspace';
import WorkspaceOverview from '@/components/studio/workspace/WorkspaceOverview';
import WorkspacePreviewSection from '@/components/studio/workspace/WorkspacePreviewSection';
import WorkspaceShareSection from '@/components/studio/workspace/WorkspaceShareSection';

const GuidedSessionMediaSection = dynamic(
  () => import('@/components/studio/guided-session/GuidedSessionMediaSection'),
  {
    ssr: false,
    loading: () => (
      <p className="studio-form-page__status" role="status">
        Loading media…
      </p>
    ),
  },
);

type Props = {
  sessionId: number;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_MS = 700;

function applySessionTimestamps(
  data: StudioGuidedSession,
  setLastUpdatedLabel: (value: string | null) => void,
  setUpdatedAtDisplay: (value: string | null) => void,
) {
  setLastUpdatedLabel(sessionTimestampLabel(data));
  setUpdatedAtDisplay(formatSessionDate(data.updated_at ?? data.created_at));
}

export default function GuidedSessionEditor({ sessionId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getIdToken } = useAuth();
  const [session, setSession] = useState<StudioGuidedSession | null>(null);
  const [form, setForm] = useState<GuidedSessionEditorForm | null>(null);
  const [baseline, setBaseline] = useState<GuidedSessionEditorForm | null>(null);
  const baselineRef = useRef<GuidedSessionEditorForm | null>(null);
  const [status, setStatus] = useState<string>('draft');
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState<string | null>(null);
  const [updatedAtDisplay, setUpdatedAtDisplay] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const activeSection = parseCreatorWorkspaceSection(searchParams.get('section'));

  const isEditable = status === 'draft';

  const setActiveSection = useCallback(
    (section: CreatorWorkspaceSection) => {
      const params = new URLSearchParams(searchParams.toString());
      if (section === 'overview') {
        params.delete('section');
      } else {
        params.set('section', section);
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const onSessionUpdated = useCallback((updated: StudioGuidedSession) => {
    setSession(updated);
    setStatus(updated.status);
    applySessionTimestamps(updated, setLastUpdatedLabel, setUpdatedAtDisplay);
  }, []);

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setIsReady(false);
      setSaveState('idle');
      setSaveError(null);

      try {
        const token = await getIdToken();
        const data = await getGuidedSession(sessionId, token);
        if (cancelled) return;

        const initial = sessionToEditorForm(data);
        setSession(data);
        setStatus(data.status);
        applySessionTimestamps(data, setLastUpdatedLabel, setUpdatedAtDisplay);
        setForm(initial);
        setBaseline(initial);
        baselineRef.current = initial;
        setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(parseStudioApiError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [sessionId, getIdToken]);

  const onFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
      setSaveError(null);
      if (saveState === 'saved' || saveState === 'error') {
        setSaveState('idle');
      }
    },
    [saveState],
  );

  useEffect(() => {
    if (!isReady || !isEditable || !form || !baseline) return;

    const patch = buildGuidedSessionPatch(form, baseline);
    if (Object.keys(patch).length === 0) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const currentBaseline = baselineRef.current;
      if (!currentBaseline) return;

      const pendingPatch = buildGuidedSessionPatch(form, currentBaseline);
      if (Object.keys(pendingPatch).length === 0) return;

      setSaveState('saving');
      setSaveError(null);

      try {
        const token = await getIdToken();
        const updated = await updateGuidedSessionDraft(sessionId, pendingPatch, token);
        const nextBaseline = sessionToEditorForm(updated);
        baselineRef.current = nextBaseline;
        setBaseline(nextBaseline);
        setSession(updated);
        setStatus(updated.status);
        applySessionTimestamps(updated, setLastUpdatedLabel, setUpdatedAtDisplay);
        setSaveState('saved');
      } catch (err) {
        if (err instanceof StudioApiError && (err.status === 403 || err.status === 404)) {
          setSaveError('You do not have access to edit this session.');
        } else {
          setSaveError(parseStudioApiError(err));
        }
        setSaveState('error');
      }
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
  }, [form, baseline, isReady, isEditable, sessionId, getIdToken]);

  const lastSavedLabel = useMemo(() => {
    if (saveState === 'saving') return 'Saving…';
    if (saveState === 'saved') return 'Saved';
    if (saveState === 'error') return 'Save failed';
    if (lastUpdatedLabel) return lastUpdatedLabel;
    return null;
  }, [saveState, lastUpdatedLabel]);

  const shareReadiness = useMemo(() => {
    if (!session || !form) return [];
    const metadataComplete =
      Boolean(form.title.trim()) && Boolean(form.description.trim());
    return buildGuidedSessionShareReadiness(session, metadataComplete);
  }, [session, form]);

  if (loading) {
    return (
      <p className="studio-form-page__status" role="status">
        Loading session…
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="studio-form__error" role="alert">
        {loadError}
      </p>
    );
  }

  if (!form || !session) {
    return null;
  }

  return (
    <CreatorWorkspace
      title={form.title}
      status={status}
      statusLabel={guidedSessionStatusLabel(status)}
      lastSavedLabel={lastSavedLabel}
      saveState={saveState}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
    >
      {activeSection === 'overview' ? (
        <WorkspaceOverview
          title={form.title}
          description={form.description}
          statusLabel={guidedSessionStatusLabel(status)}
          lastUpdated={updatedAtDisplay}
          creator={form.instructor}
        />
      ) : null}

      {activeSection === 'content' ? (
        <section className="creator-workspace__section" aria-labelledby="workspace-content-heading">
          <h2 id="workspace-content-heading" className="visually-hidden">
            Content
          </h2>
          {!isEditable ? (
            <p className="creator-workspace__section-lede">
              Published and archived sessions are read-only in Studio V1.
            </p>
          ) : (
            <p className="creator-workspace__section-lede">
              Changes are saved automatically.
            </p>
          )}
          {saveError ? (
            <p className="studio-form__error" role="alert">
              {saveError}
            </p>
          ) : null}
          <GuidedSessionFormFields
            form={form}
            disabled={!isEditable}
            onChange={onFieldChange}
          />
        </section>
      ) : null}

      {activeSection === 'media' ? (
        <GuidedSessionMediaSection
          session={session}
          isEditable={isEditable}
          onSessionUpdated={onSessionUpdated}
        />
      ) : null}

      {activeSection === 'preview' ? <WorkspacePreviewSection /> : null}
      {activeSection === 'share' ? <WorkspaceShareSection items={shareReadiness} /> : null}
    </CreatorWorkspace>
  );
}
