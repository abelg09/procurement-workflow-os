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
const DEFAULT_DASHBOARD_URL = "https://abelg09.github.io/procurement-workflow-os/";

type EmailResult = {
  email: string;
  name: string;
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

  const overrides = parseEmailOverrides();
  const emailPayloads = getDailyReminderEmailPayloads(currentState, dashboardUrl());
  const emailResults = await Promise.all(
    emailPayloads.map((payload) => sendReminderEmail(payload, overrides)),
  );
  const failed = emailResults.filter((result) => result.status === "failed");

  return NextResponse.json(
    {
      ok: failed.length === 0,
      inserted,
      schedule: "Daily at 3:00 PM Asia/Dubai",
      emailResults,
    },
    { status: failed.length === 0 ? 200 : 502 },
  );
}
