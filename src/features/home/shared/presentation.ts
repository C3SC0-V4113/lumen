type ContentStatus = { fallback: boolean; stale: boolean };

export function getHomePresentation<T extends ContentStatus>(
  home: ContentStatus | null,
  team: readonly T[]
) {
  const teamPreview = team.slice(0, 4);

  return {
    teamPreview,
    fallback: !home || home.fallback || teamPreview.some((member) => member.fallback),
    stale: (home?.stale ?? false) || teamPreview.some((member) => member.stale),
  };
}
