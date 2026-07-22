export type AdminReassignmentAction = {
  type: "admin-reassign";
  assigneeId: string;
  comment?: string;
};

type AdminReassignmentHandler = (
  requestId: string,
  action: AdminReassignmentAction,
  actorId?: string,
) => void | Promise<void>;

export async function submitAdminReassignment(
  handler: AdminReassignmentHandler,
  command: {
    requestId: string;
    assigneeId: string;
    actorId: string;
    comment?: string;
  },
): Promise<void> {
  const requestId = command.requestId.trim();
  const assigneeId = command.assigneeId.trim();
  const actorId = command.actorId.trim();

  if (!requestId) {
    throw new Error("Select a request to reassign.");
  }

  if (!assigneeId) {
    throw new Error("Select an assignee.");
  }

  if (!actorId) {
    throw new Error("A signed-in admin is required to reassign requests.");
  }

  const comment = command.comment?.trim();

  await handler(
    requestId,
    {
      type: "admin-reassign",
      assigneeId,
      ...(comment ? { comment } : {}),
    },
    actorId,
  );
}
