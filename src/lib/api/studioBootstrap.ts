import { studioFetch } from '@/lib/api/studioApiClient';

/** Django bootstrap endpoint — verifies Firebase token and reports Studio access. */
export const STUDIO_BOOTSTRAP_PATH = '/api/me/bootstrap/';

/** Studio capabilities the product implements today. */
export const GUIDED_SESSIONS_CAPABILITY = 'guided_sessions' as const;
export const CHALLENGES_CAPABILITY = 'challenges' as const;

export type StudioCapabilityId =
  | typeof GUIDED_SESSIONS_CAPABILITY
  | typeof CHALLENGES_CAPABILITY;

export type StudioCapabilities = Record<StudioCapabilityId, boolean>;

export type StudioPublishingLimits = {
  /** Null means the server did not set a cooldown. */
  creator_publish_cooldown_hours: number | null;
  /** Null means the server did not set a live-session cap. */
  creator_max_live_guided_sessions: number | null;
};

export type StudioAccessContract = 'capabilities' | 'legacy' | 'invalid';

/**
 * One parsed view of `studio_access` for the whole Studio UI.
 * Only `enabled` opens the Studio. Only a capability that is boolean true
 * opens that area.
 */
export type ParsedStudioAccess = {
  contract: StudioAccessContract;
  enabled: boolean;
  capabilities: StudioCapabilities;
  publishingLimits: StudioPublishingLimits;
};

export type StudioAccessInfo = {
  enabled?: unknown;
  is_studio_creator?: unknown;
  capabilities?: unknown;
  creator_publish_cooldown_hours?: unknown;
  creator_max_live_guided_sessions?: unknown;
};

/**
 * Bootstrap returns 200 for every authenticated user. Studio access is carried
 * in `studio_access`, not by the HTTP status.
 */
export type StudioBootstrapResponse = {
  studio_access?: StudioAccessInfo;
} & Record<string, unknown>;

const EMPTY_CAPABILITIES: StudioCapabilities = {
  guided_sessions: false,
  challenges: false,
};

const EMPTY_LIMITS: StudioPublishingLimits = {
  creator_publish_cooldown_hours: null,
  creator_max_live_guided_sessions: null,
};

export function emptyStudioCapabilities(): StudioCapabilities {
  return { ...EMPTY_CAPABILITIES };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseOptionalLimit(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
}

function publishingLimitsFrom(access: Record<string, unknown>): StudioPublishingLimits {
  return {
    creator_publish_cooldown_hours: parseOptionalLimit(access.creator_publish_cooldown_hours),
    creator_max_live_guided_sessions: parseOptionalLimit(access.creator_max_live_guided_sessions),
  };
}

function capabilitiesFromMap(value: unknown): StudioCapabilities {
  const source = isRecord(value) ? value : null;
  return {
    guided_sessions: source?.guided_sessions === true,
    challenges: source?.challenges === true,
  };
}

function denied(contract: StudioAccessContract, limits: StudioPublishingLimits = EMPTY_LIMITS): ParsedStudioAccess {
  return {
    contract,
    enabled: false,
    capabilities: emptyStudioCapabilities(),
    publishingLimits: limits,
  };
}

/**
 * Parse bootstrap `studio_access`.
 *
 * New contract (`capabilities` is present, including null or a non-object):
 * - `enabled === true` is the only general entry.
 * - `capabilities.guided_sessions === true` grants guided sessions.
 * - `capabilities.challenges === true` grants challenges. Nothing else does.
 * - A missing capability key is false.
 * - Unknown capability keys do not open a screen.
 * - `is_studio_creator` is ignored.
 * - A malformed `capabilities` value grants nothing.
 * - A missing or non-boolean `enabled` denies entry.
 *
 * Legacy contract (`capabilities` is absent entirely):
 * - `is_studio_creator === true` grants entry and `guided_sessions` only.
 * - Challenges stay closed. The old flag never grants them.
 */
export function parseStudioAccess(
  bootstrap: StudioBootstrapResponse | null | undefined,
): ParsedStudioAccess {
  const access = bootstrap?.studio_access;
  if (!isRecord(access)) return denied('invalid');

  const limits = publishingLimitsFrom(access);

  if (!Object.prototype.hasOwnProperty.call(access, 'capabilities')) {
    const legacyCreator = access.is_studio_creator === true;
    return {
      contract: 'legacy',
      enabled: legacyCreator,
      capabilities: { guided_sessions: legacyCreator, challenges: false },
      publishingLimits: limits,
    };
  }

  const capabilities = capabilitiesFromMap(access.capabilities);
  return {
    contract: 'capabilities',
    enabled: access.enabled === true,
    capabilities: access.enabled === true ? capabilities : emptyStudioCapabilities(),
    publishingLimits: limits,
  };
}

/**
 * General Studio entry. Does not by itself grant guided sessions.
 * Fails closed when `studio_access` is missing or malformed.
 */
export function isApprovedStudioCreator(
  bootstrap: StudioBootstrapResponse | null | undefined,
): boolean {
  return parseStudioAccess(bootstrap).enabled;
}

export function hasStudioCapability(
  access: Pick<ParsedStudioAccess, 'enabled' | 'capabilities'> | null | undefined,
  capability: StudioCapabilityId,
): boolean {
  if (!access?.enabled) return false;
  return access.capabilities[capability] === true;
}

export async function fetchStudioBootstrap(token: string): Promise<StudioBootstrapResponse> {
  return studioFetch<StudioBootstrapResponse>(STUDIO_BOOTSTRAP_PATH, { token });
}
