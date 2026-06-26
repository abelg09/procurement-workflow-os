const LIVE_STATE_ROW_ID = "default";
const DEFAULT_DASHBOARD_URL = "https://abelg09.github.io/procurement-workflow-os/";
const OVERDUE_REQUEST_HOURS = 24;
const DAILY_REMINDER_ROLES = ["Mona", "Rashid", "Dr. Majed", "Amro", "Edlyn", "Aileen"];

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
};

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = required("RESEND_API_KEY");
const reminderFrom = required("REMINDER_EMAIL_FROM");
const dashboardUrl = process.env.PROCUREMENT_DASHBOARD_URL || DEFAULT_DASHBOARD_URL;

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

function parseEmailOverrides() {
  return Object.fromEntries(
    (process.env.REMINDER_EMAIL_OVERRIDES ?? "")
      .split(",")
      .map((pair) => pair.trim())
      .filter(Boolean)
      .map((pair) => {
        const [key, ...valueParts] = pair.split(":");
        return [key.trim().toLowerCase(), valueParts.join(":").trim()];
      })
      .filter(([key, value]) => key && value),
  );
}

function isClosed(status) {
  return (
    status === "Completed" ||
    status === "Rashid Declined" ||
    status === "Sent Back for Clarification"
  );
}

function isOverdue(request, referenceDate = new Date()) {
  if (isClosed(request.status)) {
    return false;
  }

  return (
    referenceDate.getTime() - new Date(request.updatedAt).getTime() >
    OVERDUE_REQUEST_HOURS * 60 * 60 * 1000
  );
}

function activeAssignedRequests(state, user) {
  return state.requests.filter(
    (request) => request.assigneeId === user.id && !isClosed(request.status),
  );
}

function reminderRecipients(state) {
  return DAILY_REMINDER_ROLES.map((role) =>
    state.users.find((user) => user.role === role && user.active),
  ).filter(Boolean);
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function recipientEmail(user, overrides) {
  return (
    overrides[String(user.role).toLowerCase()] ||
    overrides[String(user.name).toLowerCase()] ||
    user.email
  );
}

function isPlaceholderEmail(email) {
  return String(email).toLowerCase().endsWith("@example.com");
}

function buildEmail(state, user, overrides) {
  const activeRequests = activeAssignedRequests(state, user);
  const overdueRequests = activeRequests.filter((request) => isOverdue(request));
  const activeIds = activeRequests.map((request) => request.id);
  const overdueIds = overdueRequests.map((request) => request.id);
  const activeText = activeIds.length > 0 ? activeIds.join(", ") : "No active tasks";
  const overdueText = overdueIds.length > 0 ? overdueIds.join(", ") : "None";
  const subject =
    overdueRequests.length > 0
      ? `Procurement dashboard reminder: ${overdueRequests.length} overdue task(s)`
      : "Procurement dashboard reminder";
  const text = [
    `Hi ${user.name},`,
    "",
    "Please check the Procurement Workflow OS dashboard today.",
    `Role queue: ${user.role}`,
    `Active assigned tasks: ${activeRequests.length} (${activeText})`,
    `Over 24 hours: ${overdueRequests.length} (${overdueText})`,
    "",
    `Dashboard: ${dashboardUrl}`,
  ].join("\n");
  const html = [
    `<p>Hi ${htmlEscape(user.name)},</p>`,
    "<p>Please check the Procurement Workflow OS dashboard today.</p>",
    "<ul>",
    `<li><strong>Role queue:</strong> ${htmlEscape(user.role)}</li>`,
    `<li><strong>Active assigned tasks:</strong> ${activeRequests.length} (${htmlEscape(activeText)})</li>`,
    `<li><strong>Over 24 hours:</strong> ${overdueRequests.length} (${htmlEscape(overdueText)})</li>`,
    "</ul>",
    `<p><a href="${htmlEscape(dashboardUrl)}">Open Procurement Workflow OS</a></p>`,
  ].join("");

  return {
    email: recipientEmail(user, overrides),
    name: user.name,
    subject,
    text,
    html,
  };
}

async function fetchState() {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/procurement_app_state?id=eq.${LIVE_STATE_ROW_ID}&select=state`,
    { headers },
  );

  if (!response.ok) {
    throw new Error(`Supabase state fetch failed: ${response.status} ${await response.text()}`);
  }

  const rows = await response.json();
  if (!rows[0]?.state) {
    throw new Error("No procurement_app_state row found for daily reminders.");
  }

  return rows[0].state;
}

async function sendEmail(email) {
  if (!email.email || isPlaceholderEmail(email.email)) {
    return {
      email: email.email,
      name: email.name,
      status: "skipped",
      message: "No deliverable email configured.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: reminderFrom,
      to: email.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
    }),
  });

  if (!response.ok) {
    return {
      email: email.email,
      name: email.name,
      status: "failed",
      message: await response.text(),
    };
  }

  return {
    email: email.email,
    name: email.name,
    status: "sent",
    message: "Email sent.",
  };
}

const state = await fetchState();
const overrides = parseEmailOverrides();
const emails = reminderRecipients(state).map((user) => buildEmail(state, user, overrides));
const results = await Promise.all(emails.map(sendEmail));
const failed = results.filter((result) => result.status === "failed");

console.log(JSON.stringify({ results }, null, 2));

if (failed.length > 0) {
  throw new Error(`${failed.length} reminder email(s) failed.`);
}
