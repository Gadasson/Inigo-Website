/** Generic Creator Workspace sections — content-type agnostic except `content`. */
export const CREATOR_WORKSPACE_SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'content', label: 'Content' },
  { id: 'media', label: 'Media' },
  { id: 'preview', label: 'Preview' },
  // `share` id kept for URL/query stability; labelled "Publish" per Studio V1 publish flow.
  { id: 'share', label: 'Publish' },
] as const;

export type CreatorWorkspaceSection = (typeof CREATOR_WORKSPACE_SECTIONS)[number]['id'];

const SECTION_IDS = new Set<string>(CREATOR_WORKSPACE_SECTIONS.map((s) => s.id));

export function parseCreatorWorkspaceSection(
  value: string | null,
  fallback: CreatorWorkspaceSection = 'overview',
): CreatorWorkspaceSection {
  if (value && SECTION_IDS.has(value)) {
    return value as CreatorWorkspaceSection;
  }
  return fallback;
}
