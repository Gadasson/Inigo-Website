import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CHALLENGES_CAPABILITY,
  GUIDED_SESSIONS_CAPABILITY,
  STUDIO_BOOTSTRAP_PATH,
  parseStudioAccess,
} from '@/lib/api/studioBootstrap';
import { shouldLoadStudioArea, studioHomeView } from '@/lib/studio/studioAreas';
import {
  applyStudioAccessFailure,
  applyStudioAccessSuccess,
  beginStudioAccessRefresh,
  createStudioAccessSession,
  planStudioForbiddenRefresh,
  shouldStartFocusRefresh,
  signOutStudioAccess,
} from '@/lib/studio/studioAccessSession';
import type { ParsedStudioAccess } from '@/lib/api/studioBootstrap';

function access(patch: {
  enabled?: unknown;
  is_studio_creator?: unknown;
  capabilities?: unknown;
  creator_publish_cooldown_hours?: unknown;
  creator_max_live_guided_sessions?: unknown;
}) {
  return parseStudioAccess({ studio_access: patch });
}

function granted(
  capabilities: Partial<ParsedStudioAccess['capabilities']>,
): ParsedStudioAccess {
  return {
    contract: 'capabilities',
    enabled: true,
    capabilities: {
      guided_sessions: false,
      challenges: false,
      recipes: false,
      ...capabilities,
    },
    publishingLimits: {
      creator_publish_cooldown_hours: null,
      creator_max_live_guided_sessions: null,
    },
  };
}

describe('new capability contract', () => {
  it('grants guided sessions only from boolean true', () => {
    const parsed = access({
      enabled: true,
      is_studio_creator: false,
      capabilities: { guided_sessions: true },
      creator_publish_cooldown_hours: 12,
      creator_max_live_guided_sessions: 2,
    });
    assert.equal(parsed.contract, 'capabilities');
    assert.equal(parsed.enabled, true);
    assert.equal(parsed.capabilities.guided_sessions, true);
    assert.equal(parsed.publishingLimits.creator_publish_cooldown_hours, 12);
    assert.equal(parsed.publishingLimits.creator_max_live_guided_sessions, 2);
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, parsed), true);
    assert.equal(parsed.capabilities.challenges, false);
  });

  it('grants challenges only from their own boolean and not from guided sessions', () => {
    const parsed = access({
      enabled: true,
      is_studio_creator: true,
      capabilities: { guided_sessions: true, challenges: true },
    });
    assert.equal(parsed.capabilities.challenges, true);
    assert.equal(shouldLoadStudioArea('challenges', parsed), true);
    assert.equal(studioHomeView(parsed).showChallengeList, true);

    const sessionsOnly = access({
      enabled: true,
      is_studio_creator: true,
      capabilities: { guided_sessions: true },
    });
    assert.equal(sessionsOnly.capabilities.challenges, false);
    assert.equal(shouldLoadStudioArea('challenges', sessionsOnly), false);
    assert.equal(studioHomeView(sessionsOnly).showChallengeList, false);
    assert.equal(studioHomeView(sessionsOnly).showNeutralEmpty, false);
  });

  it('does not grant guided sessions from false', () => {
    const parsed = access({
      enabled: true,
      capabilities: { guided_sessions: false },
    });
    assert.equal(parsed.enabled, true);
    assert.equal(parsed.capabilities.guided_sessions, false);
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, parsed), false);
    assert.equal(studioHomeView(parsed).showSessionList, false);
    assert.equal(studioHomeView(parsed).showNeutralEmpty, true);
  });

  it('does not let is_studio_creator override a false capability', () => {
    const parsed = access({
      enabled: true,
      is_studio_creator: true,
      capabilities: { guided_sessions: false },
    });
    assert.equal(parsed.contract, 'capabilities');
    assert.equal(parsed.capabilities.guided_sessions, false);
    assert.equal(studioHomeView(parsed).areas.length, 0);
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, parsed), false);
  });

  it('uses is_studio_creator only when capabilities is absent', () => {
    const creator = access({
      is_studio_creator: true,
      creator_max_live_guided_sessions: 3,
    });
    assert.equal(creator.contract, 'legacy');
    assert.equal(creator.enabled, true);
    assert.equal(creator.capabilities.guided_sessions, true);
    assert.equal(creator.publishingLimits.creator_max_live_guided_sessions, 3);
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, creator), true);

    const plain = access({ is_studio_creator: false });
    assert.equal(plain.contract, 'legacy');
    assert.equal(plain.enabled, false);
    assert.equal(plain.capabilities.guided_sessions, false);
    assert.equal(studioHomeView(plain).showNeutralEmpty, false);
    assert.equal(plain.capabilities.challenges, false);
    assert.equal(creator.capabilities.recipes, false);
    assert.equal(plain.capabilities.recipes, false);
  });

  it('rejects malformed capabilities instead of using the legacy flag', () => {
    for (const capabilities of [null, 'guided_sessions', ['guided_sessions'], 1]) {
      const parsed = access({
        enabled: true,
        is_studio_creator: true,
        capabilities,
      });
      assert.equal(parsed.contract, 'capabilities');
      assert.equal(parsed.enabled, true);
      assert.equal(parsed.capabilities.guided_sessions, false);
      assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, parsed), false);
    }
  });

  it('treats a missing capability key as false and ignores unknown keys', () => {
    const parsed = access({
      enabled: true,
      is_studio_creator: true,
      capabilities: { notes: true, challenges: true },
    });
    assert.equal(parsed.capabilities.guided_sessions, false);
    assert.equal(parsed.capabilities.challenges, true);
    assert.equal(parsed.capabilities.recipes, false);
    assert.equal(studioHomeView(parsed).areas.length, 1);
    assert.equal(studioHomeView(parsed).areas[0]?.capability, CHALLENGES_CAPABILITY);
    assert.equal(studioHomeView(parsed).showNeutralEmpty, false);
    assert.equal(studioHomeView(parsed).showSessionList, false);
    assert.equal(studioHomeView(parsed).showChallengeList, true);
    assert.equal(studioHomeView(parsed).showRecipeList, false);

    const unknownOnly = access({
      enabled: true,
      is_studio_creator: true,
      capabilities: { notes: true },
    });
    assert.equal(unknownOnly.capabilities.guided_sessions, false);
    assert.equal(unknownOnly.capabilities.challenges, false);
    assert.equal(unknownOnly.capabilities.recipes, false);
    assert.equal(studioHomeView(unknownOnly).areas.length, 0);
    assert.equal(studioHomeView(unknownOnly).showNeutralEmpty, true);
  });

  it('does not treat non-boolean capability values as grants', () => {
    for (const guided_sessions of ['true', 1, {}, []]) {
      const parsed = access({
        enabled: true,
        capabilities: { guided_sessions },
      });
      assert.equal(parsed.capabilities.guided_sessions, false);
    }
  });

  it('keeps enabled false closed even when guided sessions is true', () => {
    const parsed = access({
      enabled: false,
      is_studio_creator: true,
      capabilities: { guided_sessions: true },
    });
    assert.equal(parsed.enabled, false);
    assert.equal(parsed.capabilities.guided_sessions, false);
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, parsed), false);
    assert.equal(studioHomeView(parsed).showNeutralEmpty, false);
  });

  it('denies entry when enabled is missing or malformed on the new contract', () => {
    for (const enabled of [undefined, null, 'true', 1]) {
      const parsed = access({
        enabled,
        is_studio_creator: true,
        capabilities: { guided_sessions: true },
      });
      assert.equal(parsed.contract, 'capabilities');
      assert.equal(parsed.enabled, false);
      assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, parsed), false);
    }
  });

  it('fails closed when studio access itself is missing', () => {
    const parsed = parseStudioAccess({});
    assert.equal(parsed.contract, 'invalid');
    assert.equal(parsed.enabled, false);
    assert.equal(parsed.capabilities.guided_sessions, false);
    assert.equal(parsed.publishingLimits.creator_publish_cooldown_hours, null);
  });
});

describe('guided session screen gate', () => {
  it('does not load session content without the capability', () => {
    const parsed = access({
      enabled: true,
      capabilities: { guided_sessions: false },
    });
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, parsed), false);
    assert.equal(studioHomeView(parsed).showSessionList, false);
  });

  it('loads session content only for an enabled guided-sessions grant', () => {
    const parsed = access({
      enabled: true,
      capabilities: { guided_sessions: true },
    });
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, parsed), true);
    assert.equal(studioHomeView(parsed).showSessionList, true);
    assert.equal(studioHomeView(parsed).areas[0]?.createHref, '/studio/guided-sessions/new');
  });
});

describe('permission refresh', () => {
  it('drops guided sessions when a newer refresh revokes them but keeps general entry', () => {
    let state = createStudioAccessSession();
    state = beginStudioAccessRefresh(state, { userId: 'a', generation: 1, mode: 'initial' });
    state = applyStudioAccessSuccess(state, {
      userId: 'a',
      generation: 1,
      access: granted({ guided_sessions: true }),
    });
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, state.access), true);

    state = beginStudioAccessRefresh(state, { userId: 'a', generation: 2, mode: 'background' });
    assert.equal(state.phase, 'connected');
    assert.equal(state.access?.capabilities.guided_sessions, true);

    state = applyStudioAccessSuccess(state, {
      userId: 'a',
      generation: 2,
      access: granted({ guided_sessions: false }),
    });
    assert.equal(state.phase, 'connected');
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, state.access), false);
    assert.equal(studioHomeView(state.access).showNeutralEmpty, true);
    assert.equal(studioHomeView(state.access).showSessionList, false);
  });

  it('closes Studio when a newer refresh reports enabled false', () => {
    let state = beginStudioAccessRefresh(createStudioAccessSession(), {
      userId: 'a',
      generation: 1,
      mode: 'initial',
    });
    state = applyStudioAccessSuccess(state, {
      userId: 'a',
      generation: 1,
      access: granted({ guided_sessions: true }),
    });
    state = beginStudioAccessRefresh(state, { userId: 'a', generation: 2, mode: 'background' });
    state = applyStudioAccessSuccess(state, {
      userId: 'a',
      generation: 2,
      access: access({ enabled: false, capabilities: { guided_sessions: true } }),
    });
    assert.equal(state.phase, 'denied');
    assert.equal(state.access, null);
    assert.equal(shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, state.access), false);
  });

  it('starts one refresh for parallel 403s and ignores bootstrap 403', () => {
    let inFlight = false;
    let starts = 0;
    const observe = (path: string, method: string) => {
      const plan = planStudioForbiddenRefresh({ path, method, refreshInFlight: inFlight });
      assert.equal(plan.replay, false);
      if (plan.action === 'start') {
        inFlight = true;
        starts += 1;
      }
      return plan.action;
    };

    assert.equal(observe('/api/studio/guided-sessions/', 'GET'), 'start');
    assert.equal(observe('/api/studio/guided-sessions/1/', 'PATCH'), 'coalesce');
    assert.equal(observe('/api/studio/guided-sessions/1/publish/', 'POST'), 'coalesce');
    assert.equal(observe(STUDIO_BOOTSTRAP_PATH, 'GET'), 'ignore');
    assert.equal(starts, 1);
  });

  it('never replays write, publish, or media requests after a 403', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE'] as const) {
      const plan = planStudioForbiddenRefresh({
        path: '/api/studio/guided-sessions/4/publish/',
        method,
        refreshInFlight: false,
      });
      assert.equal(plan.action, 'start');
      assert.equal(plan.replay, false);
    }
  });

  it('ignores a stale success after logout or an account switch', () => {
    let state = beginStudioAccessRefresh(createStudioAccessSession(), {
      userId: 'a',
      generation: 1,
      mode: 'initial',
    });
    state = signOutStudioAccess(state, 2);
    state = applyStudioAccessSuccess(state, {
      userId: 'a',
      generation: 1,
      access: granted({ guided_sessions: true }),
    });
    assert.equal(state.phase, 'idle');
    assert.equal(state.userId, null);
    assert.equal(state.access, null);

    state = beginStudioAccessRefresh(createStudioAccessSession(), {
      userId: 'a',
      generation: 1,
      mode: 'initial',
    });
    state = applyStudioAccessSuccess(state, {
      userId: 'a',
      generation: 1,
      access: granted({ guided_sessions: true }),
    });
    state = beginStudioAccessRefresh(state, { userId: 'b', generation: 2, mode: 'initial' });
    assert.equal(state.phase, 'loading');
    assert.equal(state.access, null);
    state = applyStudioAccessSuccess(state, {
      userId: 'a',
      generation: 1,
      access: granted({ guided_sessions: true }),
    });
    assert.equal(state.phase, 'loading');
    assert.equal(state.access, null);
    state = applyStudioAccessSuccess(state, {
      userId: 'b',
      generation: 2,
      access: granted({ guided_sessions: false }),
    });
    assert.equal(state.userId, 'b');
    assert.equal(state.phase, 'connected');
    assert.equal(state.access?.capabilities.guided_sessions, false);
  });

  it('keeps the current grant when a background refresh cannot reach the server', () => {
    let state = beginStudioAccessRefresh(createStudioAccessSession(), {
      userId: 'a',
      generation: 1,
      mode: 'initial',
    });
    const current = granted({ guided_sessions: true });
    state = applyStudioAccessSuccess(state, {
      userId: 'a',
      generation: 1,
      access: current,
    });
    state = beginStudioAccessRefresh(state, { userId: 'a', generation: 2, mode: 'background' });
    state = applyStudioAccessFailure(state, {
      userId: 'a',
      generation: 2,
      mode: 'background',
      failure: 'network',
      message: 'offline',
    });
    assert.equal(state.phase, 'connected');
    assert.equal(state.access, current);
    assert.equal(state.access?.capabilities.guided_sessions, true);
  });

  it('refreshes on a visible focus return and skips hidden or in-flight checks', () => {
    assert.equal(
      shouldStartFocusRefresh({
        visibilityState: 'visible',
        signedIn: true,
        refreshInFlight: false,
        phase: 'connected',
      }),
      true,
    );
    assert.equal(
      shouldStartFocusRefresh({
        visibilityState: 'hidden',
        signedIn: true,
        refreshInFlight: false,
        phase: 'connected',
      }),
      false,
    );
    assert.equal(
      shouldStartFocusRefresh({
        visibilityState: 'visible',
        signedIn: true,
        refreshInFlight: true,
        phase: 'connected',
      }),
      false,
    );
  });
});
