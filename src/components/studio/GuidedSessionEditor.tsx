'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGuidedSession,
  updateGuidedSessionDraft,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { StudioApiError } from '@/lib/api/studioApiClient';
import { getStudioApiFieldErrors, getStudioApiErrorCode, parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import {
  buildGuidedSessionPatch,
  sessionToEditorForm,
  type GuidedSessionEditorForm,
} from '@/lib/studio/guidedSessionEditorForm';
import {
  parseCreatorWorkspaceSection,
  type CreatorWorkspaceSection,
} from '@/lib/studio/creatorWorkspaceSections';
import { formatSessionDate } from '@/lib/studio/formatSessionDate';
import { buildGuidedSessionWorkspaceReadiness } from '@/lib/studio/workspaceReadiness';
import {
  isGuidedSessionMediaBlockingPublish,
  type GuidedSessionMediaActivity,
} from '@/lib/studio/guidedSessionMedia';
import { normalizeTimeSuitability, type TimeSuitabilityValue } from '@/lib/studio/timeSuitability';
import {
  guidedSessionDurationDisplayLabel,
  isGuidedSessionDurationFromMedia,
  guidedSessionDurationMediaSource,
} from '@/lib/studio/guidedSessionDuration';
import type { OnGuidedSessionMediaUpdated } from '@/lib/studio/guidedSessionMediaTypes';
import { useGuidedSessionTaxonomy } from '@/hooks/useGuidedSessionTaxonomy';
import { useGuidedSessionVideoOptimizationPolling } from '@/hooks/useGuidedSessionVideoOptimizationPolling';
import { useLiveMediaReplacementPolling } from '@/hooks/useLiveMediaReplacementPolling';
import { studioSessionPhase } from '@/lib/studio/guidedSessionPhase';
import {
  isGuidedSessionFieldDisabled,
  studioEditorCapabilities,
} from '@/lib/studio/guidedSessionCapabilities';
import {
  buildLiveGuidedSessionPatch,
  liveAutosaveDecision,
  livePatchPayloadKey,
} from '@/lib/studio/liveGuidedSessionPatch';
import { applyPracticeSelectionToForm } from '@/lib/studio/guidedSessionTaxonomy';
import GuidedSessionFormFields from '@/components/studio/GuidedSessionFormFields';
import CreatorWorkspace from '@/components/studio/workspace/CreatorWorkspace';
import WorkspaceOverview from '@/components/studio/workspace/WorkspaceOverview';

const GuidedSessionWorkspaceTabs = dynamic(
  () => import('@/components/studio/guided-session/GuidedSessionWorkspaceTabs'),
  {
    ssr: false,
    loading: () => <GuidedSessionEditorLoading />,
  },
);

function GuidedSessionEditorLoading() {
  const t = useTranslations('editor');
  return (
    <p className="studio-form-page__status" role="status">
      {t('loading')}
    </p>
  );
}

const STATUS_PHASE_KEYS = {
  draft: 'draft',
  awaiting_approval: 'awaitingApproval',
  live: 'live',
  archived: 'archived',
} as const;

const LAZY_WORKSPACE_SECTIONS = new Set(['media', 'preview', 'share']);

type Props = {
  sessionId: number;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_MS = 700;

export default function GuidedSessionEditor({ sessionId }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { getIdToken } = useAuth();
  const locale = useLocale();
  const t = useTranslations('editor');
  const ts = useTranslations('status');
  const tSessions = useTranslations('sessions');
  const { taxonomy, loading: taxonomyLoading, error: taxonomyError } =
    useGuidedSessionTaxonomy();
  const [session, setSession] = useState<StudioGuidedSession | null>(null);
  const [form, setForm] = useState<GuidedSessionEditorForm | null>(null);
  const [baseline, setBaseline] = useState<GuidedSessionEditorForm | null>(null);
  const baselineRef = useRef<GuidedSessionEditorForm | null>(null);
  const [status, setStatus] = useState<string>('draft');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [timeSuitabilityError, setTimeSuitabilityError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [mediaActivity, setMediaActivity] = useState<GuidedSessionMediaActivity>({
    uploading: false,
    attachPending: false,
  });

  const activeSection = parseCreatorWorkspaceSection(searchParams.get('section'));

  const capabilities = studioEditorCapabilities(
    session ? { status: session.status, is_available: session.is_available } : { status },
  );
  const canEditDraft = capabilities.canEditDraft;
  const canEditLiveMetadata = capabilities.canEditLiveMetadata;
  const isEditable = capabilities.canEditDraft;
  const isLive = capabilities.canReplaceLiveMedia;
  const saveMode = canEditDraft ? 'draft' : canEditLiveMetadata ? 'live' : 'none';
  const blockedLivePatchRef = useRef<string | null>(null);

  const setActiveSection = useCallback(
    (section: CreatorWorkspaceSection) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete('welcome');
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

  const dismissWelcome = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`studio-welcome-dismissed-${sessionId}`, '1');
    }
    setWelcomeVisible(false);
    const params = new URLSearchParams(searchParams.toString());
    params.delete('welcome');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, sessionId]);

  const onSessionUpdated = useCallback<OnGuidedSessionMediaUpdated>((updated, meta) => {
    setSession(updated);
    setStatus(updated.status);

    if (meta?.durationDetected) {
      const nextForm = sessionToEditorForm(updated);
      setForm((prev) =>
        prev
          ? {
              ...prev,
              durationMm: nextForm.durationMm,
              durationSs: nextForm.durationSs,
            }
          : nextForm,
      );
      setBaseline((prev) => {
        const merged = prev
          ? {
              ...prev,
              durationMm: nextForm.durationMm,
              durationSs: nextForm.durationSs,
            }
          : nextForm;
        baselineRef.current = merged;
        return merged;
      });
    }
  }, []);

  useGuidedSessionVideoOptimizationPolling({
    session,
    enabled: isEditable,
    getIdToken,
    onSessionUpdated: (updated) => {
      onSessionUpdated(updated);
    },
  });

  useLiveMediaReplacementPolling({
    session,
    enabled: isLive,
    getIdToken,
    onSessionUpdated: (updated) => {
      onSessionUpdated(updated);
    },
  });

  const onSessionPublished = useCallback((updated: StudioGuidedSession) => {
    const nextForm = sessionToEditorForm(updated);
    setSession(updated);
    setStatus(updated.status);
    setForm(nextForm);
    setBaseline(nextForm);
    baselineRef.current = nextForm;
    setSaveState('idle');
    setSaveError(null);
    setTimeSuitabilityError(null);
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
      setTimeSuitabilityError(null);

      try {
        const token = await getIdToken();
        const data = await getGuidedSession(sessionId, token);
        if (cancelled) return;

        const initial = sessionToEditorForm(data);
        setSession(data);
        setStatus(data.status);
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

  useEffect(() => {
    if (searchParams.get('welcome') !== '1') {
      setWelcomeVisible(false);
      return;
    }
    if (typeof window === 'undefined') return;
    const dismissed = sessionStorage.getItem(`studio-welcome-dismissed-${sessionId}`);
    setWelcomeVisible(!dismissed);
  }, [searchParams, sessionId]);

  const onFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      if (name === 'practice' && !canEditDraft) return;
      setForm((prev) => {
        if (!prev) return prev;
        const next =
          name === 'practice'
            ? applyPracticeSelectionToForm(prev, value, taxonomy)
            : { ...prev, [name]: value };
        return next;
      });
      setSaveError(null);
      if (saveState === 'saved' || saveState === 'error') {
        setSaveState('idle');
      }
    },
    [saveState, taxonomy, canEditDraft],
  );

  const onTimeSuitabilityChange = useCallback(
    (next: TimeSuitabilityValue[]) => {
      setForm((prev) =>
        prev
          ? { ...prev, timeSuitability: normalizeTimeSuitability(next) }
          : prev,
      );
      setTimeSuitabilityError(null);
      setSaveError(null);
      if (saveState === 'saved' || saveState === 'error') {
        setSaveState('idle');
      }
    },
    [saveState],
  );

  useEffect(() => {
    if (!isReady || saveMode === 'none' || !form || !baseline) return;

    const patch =
      saveMode === 'draft'
        ? buildGuidedSessionPatch(form, baseline)
        : buildLiveGuidedSessionPatch(form, baseline);
    if (liveAutosaveDecision(patch, saveMode === 'live' ? blockedLivePatchRef.current : null) !== 'save') {
      return;
    }

    const timer = window.setTimeout(async () => {
      const currentBaseline = baselineRef.current;
      if (!currentBaseline) return;

      const pendingPatch =
        saveMode === 'draft'
          ? buildGuidedSessionPatch(form, currentBaseline)
          : buildLiveGuidedSessionPatch(form, currentBaseline);
      if (
        liveAutosaveDecision(
          pendingPatch,
          saveMode === 'live' ? blockedLivePatchRef.current : null,
        ) !== 'save'
      ) {
        return;
      }

      setSaveState('saving');
      setSaveError(null);
      setTimeSuitabilityError(null);

      try {
        const token = await getIdToken();
        const updated = await updateGuidedSessionDraft(sessionId, pendingPatch, token);
        const nextBaseline = sessionToEditorForm(updated);
        baselineRef.current = nextBaseline;
        blockedLivePatchRef.current = null;
        setBaseline(nextBaseline);
        setSession(updated);
        setStatus(updated.status);
        if (pendingPatch.time_suitability) {
          setForm((prev) =>
            prev
              ? { ...prev, timeSuitability: nextBaseline.timeSuitability }
              : prev,
          );
        }
        setSaveState('saved');
      } catch (err) {
        const fieldErrors = getStudioApiFieldErrors(err);
        const code = getStudioApiErrorCode(err);
        if (code === 'live_field_read_only') {
          blockedLivePatchRef.current = livePatchPayloadKey(pendingPatch);
          setSaveError(t('liveFieldReadOnly'));
          setSaveState('error');
          try {
            const token = await getIdToken();
            const fresh = await getGuidedSession(sessionId, token);
            const reconciled = sessionToEditorForm(fresh);
            baselineRef.current = reconciled;
            blockedLivePatchRef.current = null;
            setBaseline(reconciled);
            setForm(reconciled);
            setSession(fresh);
            setStatus(fresh.status);
          } catch {
            /* Keep the rejected payload blocked so autosave does not loop. */
          }
          return;
        }
        if (fieldErrors.time_suitability) {
          setTimeSuitabilityError(fieldErrors.time_suitability);
          setSaveError(null);
        } else if (err instanceof StudioApiError && (err.status === 403 || err.status === 404)) {
          setSaveError(t('noAccessEdit'));
        } else {
          setSaveError(parseStudioApiError(err));
        }
        setSaveState('error');
      }
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
  }, [form, baseline, isReady, saveMode, sessionId, getIdToken, t]);

  const sessionPhase = studioSessionPhase(
    session ? { status: session.status, is_available: session.is_available } : { status },
  );
  const statusLabel =
    sessionPhase === 'unknown'
      ? status
      : ts(STATUS_PHASE_KEYS[sessionPhase]);

  const sessionTimestampDisplay = useMemo(() => {
    if (!session) return null;
    const formatted = formatSessionDate(session.updated_at ?? session.created_at, locale);
    if (!formatted) return null;
    return session.updated_at
      ? tSessions('updated', { date: formatted })
      : tSessions('created', { date: formatted });
  }, [session, locale, tSessions]);

  const updatedAtDisplay = useMemo(
    () => formatSessionDate(session?.updated_at ?? session?.created_at, locale),
    [session, locale],
  );

  const lastSavedLabel = useMemo(() => {
    if (isGuidedSessionMediaBlockingPublish(mediaActivity)) {
      if (mediaActivity.uploading) return t('mediaSaving');
      return t('mediaPending');
    }
    if (saveState === 'saving') return t('saving');
    if (saveState === 'saved') return t('detailsSaved');
    if (saveState === 'error') return t('saveFailed');
    return sessionTimestampDisplay;
  }, [mediaActivity, saveState, sessionTimestampDisplay, t]);

  const workspaceReadiness = useMemo(() => {
    if (!session || !form) return null;
    return buildGuidedSessionWorkspaceReadiness(session, form, { mediaActivity });
  }, [session, form, mediaActivity]);

  if (loading) {
    return (
      <p className="studio-form-page__status" role="status">
        {t('loadingSession')}
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

  const durationFromMedia = isGuidedSessionDurationFromMedia(session);
  const durationMediaSource = guidedSessionDurationMediaSource(session);
  const durationLabel = guidedSessionDurationDisplayLabel(session, form);

  return (
    <CreatorWorkspace
      title={form.title}
      status={status}
      statusLabel={statusLabel}
      lastSavedLabel={lastSavedLabel}
      saveState={saveState}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      readiness={status === 'draft' ? workspaceReadiness : null}
      welcomeMessage={welcomeVisible && isEditable ? t('welcomeHint') : null}
      onDismissWelcome={dismissWelcome}
    >
      {activeSection === 'overview' ? (
        <WorkspaceOverview
          title={form.title}
          description={form.description}
          durationLabel={durationLabel}
          durationFromMedia={durationFromMedia}
          durationMediaSource={durationMediaSource}
          statusLabel={statusLabel}
          lastUpdated={updatedAtDisplay}
          creator={form.instructor}
          draftIncomplete={isEditable && workspaceReadiness ? !workspaceReadiness.publishable : false}
        />
      ) : null}

      {activeSection === 'content' ? (
        <section className="creator-workspace__section" aria-labelledby="workspace-content-heading">
          <h2 id="workspace-content-heading" className="visually-hidden">
            {t('contentAria')}
          </h2>
          {canEditDraft || canEditLiveMetadata ? (
            <p className="creator-workspace__section-lede">{t('contentAutosaved')}</p>
          ) : (
            <p className="creator-workspace__section-lede">{t('contentReadonly')}</p>
          )}
          {canEditLiveMetadata ? (
            <p className="creator-workspace__section-note">{t('liveDetailsNote')}</p>
          ) : null}
          {saveError ? (
            <p className="studio-form__error" role="alert">
              {saveError}
            </p>
          ) : null}
          <GuidedSessionFormFields
            form={form}
            durationFromMedia={durationFromMedia}
            durationMediaSource={durationMediaSource}
            taxonomy={taxonomy}
            taxonomyLoading={taxonomyLoading}
            taxonomyError={taxonomyError}
            disabled={!canEditDraft && !canEditLiveMetadata}
            isFieldDisabled={(field) => isGuidedSessionFieldDisabled(field, capabilities)}
            timeSuitabilityError={timeSuitabilityError}
            onChange={onFieldChange}
            onTimeSuitabilityChange={onTimeSuitabilityChange}
          />
        </section>
      ) : null}

      {LAZY_WORKSPACE_SECTIONS.has(activeSection) && workspaceReadiness ? (
        <GuidedSessionWorkspaceTabs
          activeSection={activeSection}
          session={session}
          form={form}
          sessionId={sessionId}
          status={status}
          readiness={workspaceReadiness}
          isEditable={isEditable}
          canReplaceLiveMedia={capabilities.canReplaceLiveMedia}
          canReplaceLiveCover={capabilities.canReplaceLiveCover}
          onSessionUpdated={onSessionUpdated}
          onSessionPublished={onSessionPublished}
          onMediaActivityChange={setMediaActivity}
        />
      ) : null}
    </CreatorWorkspace>
  );
}
