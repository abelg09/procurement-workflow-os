type LiveStateRefreshInput = {
  remoteUpdatedAt: string | null | undefined;
  loadedUpdatedAt: string | null | undefined;
  hasUnsavedLocalChanges: boolean;
  writeInProgress: boolean;
};

export function shouldRefreshLiveState({
  remoteUpdatedAt,
  loadedUpdatedAt,
  hasUnsavedLocalChanges,
  writeInProgress,
}: LiveStateRefreshInput) {
  return Boolean(
    remoteUpdatedAt &&
      remoteUpdatedAt !== loadedUpdatedAt &&
      !hasUnsavedLocalChanges &&
      !writeInProgress,
  );
}
