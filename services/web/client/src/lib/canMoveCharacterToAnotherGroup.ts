export function canMoveCharacterToAnotherGroup(params: {
  isArchivedSection: boolean;
  activeGroupsTotal: number;
  activeGroupsHasMore: boolean;
  loadedActiveGroupIds: string[];
  currentGroupId: string;
}): boolean {
  const { isArchivedSection, activeGroupsTotal, activeGroupsHasMore, loadedActiveGroupIds, currentGroupId } =
    params;

  if (isArchivedSection) {
    return activeGroupsTotal > 0 || activeGroupsHasMore;
  }

  if (activeGroupsTotal > 1) {
    return true;
  }

  if (activeGroupsHasMore) {
    return true;
  }

  return loadedActiveGroupIds.some((id) => id !== currentGroupId);
}
