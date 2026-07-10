const LIVE_STATE_ROW_ID = "default";
const DEFAULT_DASHBOARD_URL = "https://procurement.sulmi.ai/";
const OVERDUE_REQUEST_HOURS = 24;
const DAILY_REMINDER_ROLES = ["Mona", "Rashid", "Dr. Majed", "Amro", "Edlyn", "Aileen"];
const ROLE_DISPLAY_NAMES = {
  Mona: "Mona",
  Rashid: "Rashid",
  "Dr. Majed": "Dr. Majed",
  Amro: "Amro",
  Edlyn: "Procure",
  Aileen: "Finance",
};

const required = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
};

const optional = (name) => process.env[name]?.trim() ?? "";

const supabaseUrl = required("NEXT_PUBLIC_SUPABASE_URL").replace(/\/$/, "");
const serviceRoleKey = required("SUPABASE_SERVICE_ROLE_KEY");
const resendApiKey = optional("RESEND_API_KEY");
const reminderFrom = optional("REMINDER_EMAIL_FROM");
const slackWebhookUrl = optional("SLACK_WEBHOOK_URL");
const dashboardUrl = process.env.PROCUREMENT_DASHBOARD_URL || DEFAULT_DASHBOARD_URL;

const headers = {
  apikey: serviceRoleKey,
  Authorization: `Bearer ${serviceRoleKey}`,
  "Content-Type": "application/json",
};

function parseOverrides(envName) {
  return Object.fromEntries(
    (process.env[envName] ?? "")
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
    status === "Department Declined" ||
    status === "Cancelled" ||
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
  const roleLabel = roleLabelFor(user);
  return (
    overrides[String(user.role).toLowerCase()] ||
    overrides[String(roleLabel).toLowerCase()] ||
    overrides[String(user.name).toLowerCase()] ||
    user.email
  );
}

function isPlaceholderEmail(email) {
  return String(email).toLowerCase().endsWith("@example.com");
}

function roleLabelFor(user) {
  return ROLE_DISPLAY_NAMES[user.role] ?? user.role;
}

function buildReminderSummary(state, user) {
  const activeRequests = activeAssignedRequests(state, user);
  const overdueRequests = activeRequests.filter((request) => isOverdue(request));
  const activeIds = activeRequests.map((request) => request.id);
  const overdueIds = overdueRequests.map((request) => request.id);
  const activeText = activeIds.length > 0 ? activeIds.join(", ") : "No active tasks";
  const overdueText = overdueIds.length > 0 ? overdueIds.join(", ") : "None";

  return {
    user,
    roleLabel: roleLabelFor(user),
    activeRequests,
    overdueRequests,
    activeIds,
    overdueIds,
    activeText,
    overdueText,
  };
}

function buildEmail(summary, overrides) {
  const { user, roleLabel, activeRequests, overdueRequests, activeText, overdueText } = summary;
  const subject =
    overdueRequests.length > 0
      ? `Procurement dashboard reminder: ${overdueRequests.length} overdue task(s)`
      : "Procurement dashboard reminder";
  const text = [
    `Hi ${user.name},`,
    "",
    "Please check the Procurement Workflow OS dashboard today.",
    `Role queue: ${roleLabel}`,
    `Active assigned tasks: ${activeRequests.length} (${activeText})`,
    `Over 24 hours: ${overdueRequests.length} (${overdueText})`,
    "",
    `Dashboard: ${dashboardUrl}`,
  ].join("\n");
  const html = [
    `<p>Hi ${htmlEscape(user.name)},</p>`,
    "<p>Please check the Procurement Workflow OS dashboard today.</p>",
    "<ul>",
    `<li><strong>Role queue:</strong> ${htmlEscape(roleLabel)}</li>`,
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

function slackRecipient(summary, overrides) {
  const { user, roleLabel } = summary;

  return (
    overrides[String(user.role).toLowerCase()] ||
    overrides[String(roleLabel).toLowerCase()] ||
    overrides[String(user.name).toLowerCase()] ||
    `*${user.name}*`
  );
}

function slackEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildSlackMessage(summaries, mentionOverrides) {
  const totalActive = summaries.reduce(
    (total, summary) => total + summary.activeRequests.length,
    0,
  );
  const totalOverdue = summaries.reduce(
    (total, summary) => total + summary.overdueRequests.length,
    0,
  );
  const fields = summaries.map((summary) => {
    const recipient = slackRecipient(summary, mentionOverrides);
    const activeText =
      summary.activeIds.length > 0 ? summary.activeIds.join(", ") : "none";
    const overdueText =
      summary.overdueIds.length > 0 ? summary.overdueIds.join(", ") : "none";

    return {
      type: "mrkdwn",
      text: [
        `${recipient} (*${slackEscape(summary.roleLabel)}*)`,
        `Active: *${summary.activeRequests.length}* (${slackEscape(activeText)})`,
        `Over 24h: *${summary.overdueRequests.length}* (${slackEscape(overdueText)})`,
      ].join("\n"),
    };
  });
  const text = [
    "Procurement dashboard reminder",
    `Active tasks: ${totalActive}`,
    `Over 24 hours: ${totalOverdue}`,
    dashboardUrl,
  ].join(" | ");
  const blocks = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text:
          totalOverdue > 0
            ? `Procurement reminder: ${totalOverdue} overdue task(s)`
            : "Procurement dashboard reminder",
        emoji: false,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `Please check the dashboard today. <${dashboardUrl}|Open Procurement Workflow OS>`,
      },
    },
  ];

  if (fields.length > 0) {
    blocks.push({
      type: "section",
      fields,
    });
  }

  return {
    text,
    blocks,
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
  if (!resendApiKey || !reminderFrom) {
    return {
      email: email.email,
      name: email.name,
      status: "skipped",
      message: "Email provider is not configured.",
    };
  }

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

async function sendSlackReminder(message) {
  if (!slackWebhookUrl) {
    return {
      channel: "slack",
      status: "skipped",
      message: "SLACK_WEBHOOK_URL is not configured.",
    };
  }

  const response = await fetch(slackWebhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    return {
      channel: "slack",
      status: "failed",
      message: await response.text(),
    };
  }

  return {
    channel: "slack",
    status: "sent",
    message: "Slack reminder sent.",
  };
}

const state = await fetchState();
const emailOverrides = parseOverrides("REMINDER_EMAIL_OVERRIDES");
const slackMentionOverrides = parseOverrides("SLACK_MENTION_OVERRIDES");
const summaries = reminderRecipients(state).map((user) => buildReminderSummary(state, user));
const emails = summaries.map((summary) => buildEmail(summary, emailOverrides));
const emailResults = await Promise.all(emails.map(sendEmail));
const slackResult = await sendSlackReminder(
  buildSlackMessage(summaries, slackMentionOverrides),
);
const results = { emailResults, slackResult };
const failed = [...emailResults, slackResult].filter((result) => result.status === "failed");

console.log(JSON.stringify({ results }, null, 2));

if (failed.length > 0) {
  throw new Error(`${failed.length} reminder notification(s) failed.`);
}
