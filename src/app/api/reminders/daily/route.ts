import { NextResponse } from "next/server";
import {
  createDailyReminderNotifications,
  getDailyReminderEmailPayloads,
  initialState,
  nowIso,
} from "@/lib/procurement";
import type { DailyReminderEmail, ProcurementState } from "@/lib/procurement";
import { getSupabaseServiceClient } from "@/lib/supabase";

const LIVE_STATE_ROW_ID = "default";
const DEFAULT_DASHBOARD_URL = "https://procurement.sulmi.ai/";

type EmailResult = {
  email: string;
  name: string;
  status: "sent" | "skipped" | "failed";
  message: string;
};

type SlackResult = {
  channel: "slack";
  status: "sent" | "skipped" | "failed";
  message: string;
};

function dashboardUrl() {
  return (
    process.env.PROCUREMENT_DASHBOARD_URL ||
    process.env.NEXT_PUBLIC_DASHBOARD_URL ||
    DEFAULT_DASHBOARD_URL
  );
}

function parseOverrides(envName: string) {
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

function resolvedRecipientEmail(payload: DailyReminderEmail, overrides: Record<string, string>) {
  return (
    overrides[payload.role.toLowerCase()] ||
    overrides[payload.roleLabel.toLowerCase()] ||
    overrides[payload.name.toLowerCase()] ||
    payload.email
  );
}

function isPlaceholderEmail(email: string) {
  return email.toLowerCase().endsWith("@example.com");
}

function slackEscape(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function resolvedSlackMention(
  payload: DailyReminderEmail,
  overrides: Record<string, string>,
) {
  return (
    overrides[payload.role.toLowerCase()] ||
    overrides[payload.roleLabel.toLowerCase()] ||
    overrides[payload.name.toLowerCase()] ||
    `*${payload.name}*`
  );
}

function buildSlackMessage(
  payloads: DailyReminderEmail[],
  overrides: Record<string, string>,
) {
  const totalActive = payloads.reduce((total, payload) => total + payload.activeCount, 0);
  const totalOverdue = payloads.reduce((total, payload) => total + payload.overdueCount, 0);
  const fields = payloads.map((payload) => {
    const mention = resolvedSlackMention(payload, overrides);
    const activeText =
      payload.activeRequestIds.length > 0
        ? payload.activeRequestIds.join(", ")
        : "none";
    const overdueText =
      payload.overdueRequestIds.length > 0
        ? payload.overdueRequestIds.join(", ")
        : "none";

    return {
      type: "mrkdwn",
      text: [
        `${mention} (*${slackEscape(payload.roleLabel)}*)`,
        `Active: *${payload.activeCount}* (${slackEscape(activeText)})`,
        `Over 24h: *${payload.overdueCount}* (${slackEscape(overdueText)})`,
      ].join("\n"),
    };
  });
  const messageBlocks: Array<Record<string, unknown>> = [
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
        text: `Please check the dashboard today. <${dashboardUrl()}|Open Procurement Workflow OS>`,
      },
    },
  ];

  if (fields.length > 0) {
    messageBlocks.push({
      type: "section",
      fields,
    });
  }

  return {
    text: [
      "Procurement dashboard reminder",
      `Active tasks: ${totalActive}`,
      `Over 24 hours: ${totalOverdue}`,
      dashboardUrl(),
    ].join(" | "),
    blocks: messageBlocks,
  };
}

async function sendReminderEmail(
  payload: DailyReminderEmail,
  overrides: Record<string, string>,
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REMINDER_EMAIL_FROM;
  const email = resolvedRecipientEmail(payload, overrides);

  if (!apiKey || !from) {
    return {
      email,
      name: payload.name,
      status: "skipped",
      message: "RESEND_API_KEY or REMINDER_EMAIL_FROM is not configured.",
    };
  }

  if (!email || isPlaceholderEmail(email)) {
    return {
      email,
      name: payload.name,
      status: "skipped",
      message: "No deliverable reminder email is configured for this role.",
    };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: email,
      subject: payload.subject,
      text: payload.text,
      html: payload.html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      email,
      name: payload.name,
      status: "failed",
      message: errorText || `Resend returned HTTP ${response.status}.`,
    };
  }

  return {
    email,
    name: payload.name,
    status: "sent",
    message: "Email sent.",
  };
}

async function sendSlackReminder(
  payloads: DailyReminderEmail[],
  overrides: Record<string, string>,
): Promise<SlackResult> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      channel: "slack",
      status: "skipped",
      message: "SLACK_WEBHOOK_URL is not configured.",
    };
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildSlackMessage(payloads, overrides)),
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

export async function POST() {
  const supabase = getSupabaseServiceClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "Supabase service credentials are not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable scheduled reminders.",
      },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("procurement_app_state")
    .select("state")
    .eq("id", LIVE_STATE_ROW_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const currentState = (data?.state ?? initialState) as ProcurementState;
  const nextState = createDailyReminderNotifications(currentState);
  const inserted = nextState.notifications.length - currentState.notifications.length;
  const { error: upsertError } = await supabase.from("procurement_app_state").upsert({
    id: LIVE_STATE_ROW_ID,
    state: nextState,
    updated_at: nowIso(),
  });

  if (upsertError) {
    return NextResponse.json(
      { ok: false, error: upsertError.message },
      { status: 500 },
    );
  }

  const overrides = parseOverrides("REMINDER_EMAIL_OVERRIDES");
  const slackMentionOverrides = parseOverrides("SLACK_MENTION_OVERRIDES");
  const emailPayloads = getDailyReminderEmailPayloads(currentState, dashboardUrl());
  const emailResults = await Promise.all(
    emailPayloads.map((payload) => sendReminderEmail(payload, overrides)),
  );
  const slackResult = await sendSlackReminder(emailPayloads, slackMentionOverrides);
  const failed = [...emailResults, slackResult].filter(
    (result) => result.status === "failed",
  );

  return NextResponse.json(
    {
      ok: failed.length === 0,
      inserted,
      schedule: "Daily at 3:00 PM Asia/Dubai",
      emailResults,
      slackResult,
    },
    { status: failed.length === 0 ? 200 : 502 },
  );
}
