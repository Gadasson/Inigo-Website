import {
  CHALLENGES_CAPABILITY,
  GUIDED_SESSIONS_CAPABILITY,
  RECIPES_CAPABILITY,
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
  titleKey: 'create.guidedSessionTitle' | 'create.challengeTitle' | 'create.recipeTitle';
  descriptionKey: 'create.guidedSessionDesc' | 'create.challengeDesc' | 'create.recipeDesc';
  actionKey: 'create.guidedSessionAction' | 'create.challengeAction' | 'create.recipeAction';
  manageLabelKey: 'home.tabSessions' | 'home.tabChallenges' | 'home.tabRecipes';
};

export type StudioHomeTab = 'create' | 'sessions' | 'challenges' | 'recipes';

/** Home tab in the URL. Create is the address without a tab parameter. */
export function studioHomeHref(tab: StudioHomeTab = 'create'): string {
  if (tab === 'create') return '/studio';
  return `/studio?tab=${tab}`;
}

export const STUDIO_AREAS: readonly StudioAreaDefinition[] = [
  {
    capability: GUIDED_SESSIONS_CAPABILITY,
    createHref: '/studio/guided-sessions/new',
    manageHref: studioHomeHref('sessions'),
    titleKey: 'create.guidedSessionTitle',
    descriptionKey: 'create.guidedSessionDesc',
    actionKey: 'create.guidedSessionAction',
    manageLabelKey: 'home.tabSessions',
  },
  {
    capability: CHALLENGES_CAPABILITY,
    createHref: '/studio/challenges/new',
    manageHref: studioHomeHref('challenges'),
    titleKey: 'create.challengeTitle',
    descriptionKey: 'create.challengeDesc',
    actionKey: 'create.challengeAction',
    manageLabelKey: 'home.tabChallenges',
  },
  {
    capability: RECIPES_CAPABILITY,
    createHref: '/studio/recipes/new',
    manageHref: studioHomeHref('recipes'),
    titleKey: 'create.recipeTitle',
    descriptionKey: 'create.recipeDesc',
    actionKey: 'create.recipeAction',
    manageLabelKey: 'home.tabRecipes',
  },
];

const HOME_TAB_CAPABILITY = {
  sessions: GUIDED_SESSIONS_CAPABILITY,
  challenges: CHALLENGES_CAPABILITY,
  recipes: RECIPES_CAPABILITY,
} as const satisfies Record<Exclude<StudioHomeTab, 'create'>, StudioCapabilityId>;

/**
 * The requested tab opens only when that area is in STUDIO_AREAS and the user
 * may load it. Any other value, including a missing or unknown parameter, is Create.
 */
export function resolveStudioHomeTab(
  requested: string | null | undefined,
  access: Pick<ParsedStudioAccess, 'enabled' | 'capabilities'> | null | undefined,
): StudioHomeTab {
  if (requested === 'sessions' || requested === 'challenges' || requested === 'recipes') {
    if (shouldLoadStudioArea(HOME_TAB_CAPABILITY[requested], access)) return requested;
  }
  return 'create';
}

export function studioAreaManageHref(capability: StudioCapabilityId): string {
  return STUDIO_AREAS.find((area) => area.capability === capability)?.manageHref ?? '/studio';
}

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
  showRecipeList: boolean;
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
      showRecipeList: false,
      showNeutralEmpty: false,
    };
  }
  const areas = areasForCapabilities(access.capabilities);
  return {
    areas,
    showSessionList: areas.some((area) => area.capability === GUIDED_SESSIONS_CAPABILITY),
    showChallengeList: areas.some((area) => area.capability === CHALLENGES_CAPABILITY),
    showRecipeList: areas.some((area) => area.capability === RECIPES_CAPABILITY),
    showNeutralEmpty: areas.length === 0,
  };
}
