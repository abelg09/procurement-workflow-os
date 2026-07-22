type LiveStateRefreshInput = {
  remoteUpdatedAt: string | null | undefined;
  loadedUpdatedAt: string | null | undefined;
  hasUnsavedLocalChanges: boolean;
  writeInProgress: boolean;
};

export function runPostCommitTask(
  task: () => Promise<void>,
  onError: (error: unknown) => void = () => undefined,
): void {
  void Promise.resolve().then(task).catch(onError);
}

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
