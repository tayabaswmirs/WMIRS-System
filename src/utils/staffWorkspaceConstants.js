export const STAGE_CONFIGS = {
  "awaiting-review": {
    title: "Awaiting Review",
    icon: "mark_email_unread",
    statuses: ["submitted", "under review"],
    allowedStatusOptions: ["Submitted", "Under Review"],
    emptyText: "No reports awaiting review.",
    editable: true
  },
  "active-assignments": {
    title: "Active Assignments",
    icon: "assignment",
    statuses: ["assigned", "unresolved"],
    allowedStatusOptions: ["Open Assignment", "Unresolved"],
    emptyText: "No active assignments.",
    editable: false
  },
  "pending-verification": {
    title: "Pending Verification",
    icon: "pending_actions",
    statuses: ["resolved"],
    allowedStatusOptions: ["Pending Verification"],
    emptyText: "No reports pending verification.",
    editable: true
  },
  "completed-archive": {
    title: "Completed Archive",
    icon: "task_alt",
    statuses: ["verified", "pending completion", "completed"],
    allowedStatusOptions: ["Pending Completion", "Completed"],
    emptyText: "No archived records.",
    editable: false
  }
};
