import assert from "node:assert/strict";
import test from "node:test";

import { shouldRefreshLiveState } from "./live-state-sync.ts";

test("refreshes when another session has saved a newer state", () => {
  assert.equal(
    shouldRefreshLiveState({
      remoteUpdatedAt: "2026-07-22T10:00:00.000Z",
      loadedUpdatedAt: "2026-07-22T09:00:00.000Z",
      hasUnsavedLocalChanges: false,
      writeInProgress: false,
    }),
    true,
  );
});

test("does not refresh an unchanged state", () => {
  assert.equal(
    shouldRefreshLiveState({
      remoteUpdatedAt: "2026-07-22T10:00:00.000Z",
      loadedUpdatedAt: "2026-07-22T10:00:00.000Z",
      hasUnsavedLocalChanges: false,
      writeInProgress: false,
    }),
    false,
  );
});

test("does not overwrite unsaved local work", () => {
  assert.equal(
    shouldRefreshLiveState({
      remoteUpdatedAt: "2026-07-22T10:00:00.000Z",
      loadedUpdatedAt: "2026-07-22T09:00:00.000Z",
      hasUnsavedLocalChanges: true,
      writeInProgress: false,
    }),
    false,
  );
});

test("does not refresh while a live write is in progress", () => {
  assert.equal(
    shouldRefreshLiveState({
      remoteUpdatedAt: "2026-07-22T10:00:00.000Z",
      loadedUpdatedAt: "2026-07-22T09:00:00.000Z",
      hasUnsavedLocalChanges: false,
      writeInProgress: true,
    }),
    false,
  );
});

test("post-commit tasks do not block committed workflow actions", async () => {
  const liveStateSync = await import("./live-state-sync.ts");
  const runPostCommitTask = Reflect.get(liveStateSync, "runPostCommitTask");

  assert.equal(typeof runPostCommitTask, "function");
  if (typeof runPostCommitTask !== "function") {
    return;
  }

  let releaseTask: (() => void) | undefined;
  const pendingTask = new Promise<void>((resolve) => {
    releaseTask = resolve;
  });
  let started = false;
  let completed = false;

  const result = runPostCommitTask(async () => {
    started = true;
    await pendingTask;
    completed = true;
  });

  assert.equal(result, undefined);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(started, true);
  assert.equal(completed, false);

  releaseTask?.();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(completed, true);
});

test("does not refresh without a remote timestamp", () => {
  assert.equal(
    shouldRefreshLiveState({
      remoteUpdatedAt: null,
      loadedUpdatedAt: "2026-07-22T09:00:00.000Z",
      hasUnsavedLocalChanges: false,
      writeInProgress: false,
    }),
    false,
  );
});
