export function canMoveCharacterToAnotherGroup(params: {
  activeGroupsTotal: number;
  activeGroupsHasMore: boolean;
  archivedGroupsTotal: number;
  archivedGroupsHasMore: boolean;
  loadedActiveGroupIds: string[];
  loadedArchivedGroupIds: string[];
  currentGroupId: string;
}): boolean {
  const {
    activeGroupsTotal,
    activeGroupsHasMore,
    archivedGroupsTotal,
    archivedGroupsHasMore,
    loadedActiveGroupIds,
    loadedArchivedGroupIds,
    currentGroupId,
  } = params;

  if (activeGroupsTotal + archivedGroupsTotal > 1) {
    return true;
  }

  if (activeGroupsHasMore || archivedGroupsHasMore) {
    return true;
  }

  const allLoadedGroupIds = [...loadedActiveGroupIds, ...loadedArchivedGroupIds];
  return allLoadedGroupIds.some((id) => id !== currentGroupId);
}
