import assert from "node:assert/strict";
import test from "node:test";

import { submitAdminReassignment } from "./admin-actions.ts";

test("manual reassignment uses the signed-in admin profile", async () => {
  const calls: unknown[][] = [];

  await submitAdminReassignment(
    async (...args) => {
      calls.push(args);
    },
    {
      requestId: "PR-165",
      assigneeId: "live-assignee-profile",
      actorId: "live-admin-profile",
      comment: "Covering the current assignee",
    },
  );

  assert.deepEqual(calls, [
    [
      "PR-165",
      {
        type: "admin-reassign",
        assigneeId: "live-assignee-profile",
        comment: "Covering the current assignee",
      },
      "live-admin-profile",
    ],
  ]);
});

test("manual reassignment rejects a missing signed-in actor", async () => {
  await assert.rejects(
    submitAdminReassignment(async () => undefined, {
      requestId: "PR-165",
      assigneeId: "live-assignee-profile",
      actorId: "",
      comment: "",
    }),
    /signed-in admin/i,
  );
});
