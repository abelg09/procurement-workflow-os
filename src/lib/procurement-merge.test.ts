import assert from "node:assert/strict";
import test from "node:test";

import {
  initialState,
  mergeProcurementStates,
  type ProcurementState,
  type UserProfile,
} from "./procurement.ts";

const baseUser: UserProfile = {
  id: "user-mona",
  name: "Mona",
  email: "mona@sulmi.ai",
  role: "Mona",
  department: "Operations",
  active: true,
};

const stateWithUser = (user: UserProfile): ProcurementState => ({
  ...initialState,
  users: [user],
});

const mergedUser = (remote: UserProfile, local: UserProfile): UserProfile => {
  const merged = mergeProcurementStates(stateWithUser(remote), stateWithUser(local));
  const found = merged.users.find((candidate) => candidate.id === remote.id);
  assert.ok(found, "expected the merged user to exist");
  return found;
};

// The reported bug: a browser tab opened before the Slack IDs were added saves
// its cached (blank) user list back over the freshly-set IDs. Neither copy is
// stamped, so a blank must never overwrite a set value.
test("a stale tab cannot wipe a Slack ID that was set elsewhere", () => {
  const remote: UserProfile = { ...baseUser, slackUserId: "U0A7CGTUGEQ" };
  const staleLocal: UserProfile = { ...baseUser, slackUserId: undefined };

  assert.equal(mergedUser(remote, staleLocal).slackUserId, "U0A7CGTUGEQ");
  // ...regardless of which side is "remote" vs "local".
  assert.equal(mergedUser(staleLocal, remote).slackUserId, "U0A7CGTUGEQ");
});

// A genuine admin edit carries a fresh updatedAt and must win outright.
test("a stamped admin edit sets the Slack ID and wins the merge", () => {
  const remote: UserProfile = { ...baseUser, slackUserId: undefined };
  const edited: UserProfile = {
    ...baseUser,
    slackUserId: "U062E8EBX9T",
    updatedAt: "2026-07-24T10:00:00.000Z",
  };

  assert.equal(mergedUser(remote, edited).slackUserId, "U062E8EBX9T");
});

// The fix must not become a one-way ratchet: an admin has to be able to
// deliberately clear a Slack ID. The newer stamp wins even when it is blank.
test("a newer stamped edit can deliberately clear a Slack ID", () => {
  const older: UserProfile = {
    ...baseUser,
    slackUserId: "U0A7CGTUGEQ",
    updatedAt: "2026-07-24T09:00:00.000Z",
  };
  const cleared: UserProfile = {
    ...baseUser,
    slackUserId: undefined,
    updatedAt: "2026-07-24T11:00:00.000Z",
  };

  assert.equal(mergedUser(older, cleared).slackUserId, undefined);
});

// A role/availability change saved on the server must survive a stale tab that
// still holds the old role, because the server copy carries the newer stamp.
test("a newer stamped role change survives a stale tab", () => {
  const serverEdit: UserProfile = {
    ...baseUser,
    role: "Rashid",
    updatedAt: "2026-07-24T12:00:00.000Z",
  };
  const staleTab: UserProfile = {
    ...baseUser,
    role: "Mona",
    updatedAt: "2026-07-24T08:00:00.000Z",
  };

  // Merge with the server copy as the authoritative "remote" side.
  assert.equal(mergedUser(serverEdit, staleTab).role, "Rashid");
});
