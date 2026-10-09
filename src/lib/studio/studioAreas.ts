import {
  CHALLENGES_CAPABILITY,
  GUIDED_SESSIONS_CAPABILITY,
  hasStudioCapability,
  type ParsedStudioAccess,
  type StudioCapabilities,
  type StudioCapabilityId,
} from '@/lib/api/studioBootstrap';

/**
 * Known Studio areas. A future area is added here with its capability id.
 * Screens read this list instead of copying permission checks.
 */
export type StudioAreaDefinition = {
  capability: StudioCapabilityId;
  createHref: string;
  manageHref: string;
  titleKey: 'create.guidedSessionTitle' | 'create.challengeTitle';
  descriptionKey: 'create.guidedSessionDesc' | 'create.challengeDesc';
  actionKey: 'create.guidedSessionAction' | 'create.challengeAction';
  manageLabelKey: 'home.tabSessions' | 'home.tabChallenges';
};

export const STUDIO_AREAS: readonly StudioAreaDefinition[] = [
  {
    capability: GUIDED_SESSIONS_CAPABILITY,
    createHref: '/studio/guided-sessions/new',
    manageHref: '/studio?tab=sessions',
    titleKey: 'create.guidedSessionTitle',
    descriptionKey: 'create.guidedSessionDesc',
    actionKey: 'create.guidedSessionAction',
    manageLabelKey: 'home.tabSessions',
  },
  {
    capability: CHALLENGES_CAPABILITY,
    createHref: '/studio/challenges/new',
    manageHref: '/studio/challenges',
    titleKey: 'create.challengeTitle',
    descriptionKey: 'create.challengeDesc',
    actionKey: 'create.challengeAction',
    manageLabelKey: 'home.tabChallenges',
  },
];

export function areasForCapabilities(capabilities: StudioCapabilities): StudioAreaDefinition[] {
  return STUDIO_AREAS.filter((area) => capabilities[area.capability] === true);
}

export function shouldLoadStudioArea(
  capability: StudioCapabilityId,
  access: Pick<ParsedStudioAccess, 'enabled' | 'capabilities'> | null | undefined,
): boolean {
  return hasStudioCapability(access, capability);
}

export type StudioHomeView = {
  areas: StudioAreaDefinition[];
  showSessionList: boolean;
  showChallengeList: boolean;
  showNeutralEmpty: boolean;
};

/** Home rendering. Unauthorized areas are omitted, not shown as active. */
export function studioHomeView(
  access: Pick<ParsedStudioAccess, 'enabled' | 'capabilities'> | null | undefined,
): StudioHomeView {
  if (!access?.enabled) {
    return {
      areas: [],
      showSessionList: false,
      showChallengeList: false,
      showNeutralEmpty: false,
    };
  }
  const areas = areasForCapabilities(access.capabilities);
  return {
    areas,
    showSessionList: areas.some((area) => area.capability === GUIDED_SESSIONS_CAPABILITY),
    showChallengeList: areas.some((area) => area.capability === CHALLENGES_CAPABILITY),
    showNeutralEmpty: areas.length === 0,
  };
}
