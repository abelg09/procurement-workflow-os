import { createClient } from "npm:@supabase/supabase-js@2";

type OutboundNotificationStatus = "queued" | "sent" | "failed" | "skipped";

type OutboundNotificationLog = {
  id: string;
  notificationId: string;
  userId: string;
  requestId?: string | null;
  channel: "email" | "slack";
  eventType: string;
  title: string;
  body: string;
  requesterName?: string;
  itemName?: string;
  totalAed?: number;
  project?: string;
  department?: string;
  stageLabel?: string;
  pendingAction?: string;
  status: OutboundNotificationStatus;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  error?: string;
  providerMessageId?: string;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  slackUserId?: string;
  notificationsEnabled?: boolean;
  emailNotificationsEnabled?: boolean;
  slackNotificationsEnabled?: boolean;
};

type ProcurementState = {
  users: UserProfile[];
  outboundNotifications?: OutboundNotificationLog[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const stateRowId = "default";
const defaultAppBaseUrl = "https://procurement.sulmi.ai/";
const maxDeliveriesPerRun = 25;

function requiredEnv(name: string) {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function optionalEnv(name: string) {
  return Deno.env.get(name)?.trim() ?? "";
}

function slackEscape(value: string) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function requestUrl(appBaseUrl: string, requestId?: string | null) {
  const base = appBaseUrl.endsWith("/") ? appBaseUrl : `${appBaseUrl}/`;
  if (!requestId) {
    return base;
  }

  const params = new URLSearchParams({
    request: requestId,
    view: "work-queue",
  });
  return `${base}?${params.toString()}`;
}

function slackBlocks(delivery: OutboundNotificationLog, appBaseUrl: string) {
  const url = requestUrl(appBaseUrl, delivery.requestId);
  const fields = [
    delivery.requesterName ? `*Requested by:*\n${slackEscape(delivery.requesterName)}` : "",
    delivery.itemName ? `*Item:*\n${slackEscape(delivery.itemName)}` : "",
    Number.isFinite(delivery.totalAed)
      ? `*Amount:*\nAED ${delivery.totalAed?.toLocaleString()}`
      : "",
    delivery.stageLabel ? `*Stage:*\n${slackEscape(delivery.stageLabel)}` : "",
  ]
    .filter(Boolean)
    .map((text) => ({ type: "mrkdwn", text }));

  return [
    {
      type: "header",
      text: { type: "plain_text", text: delivery.title, emoji: false },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: slackEscape(delivery.body) },
    },
    ...(fields.length > 0 ? [{ type: "section", fields }] : []),
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Open request", emoji: false },
          url,
        },
      ],
    },
  ];
}

async function sendSlack(
  delivery: OutboundNotificationLog,
  user: UserProfile,
  appBaseUrl: string,
) {
  const botToken = optionalEnv("SLACK_BOT_TOKEN");
  const webhookUrl = optionalEnv("SLACK_WEBHOOK_URL");
  const text = `${delivery.title} | ${delivery.requestId ?? "Procurement"} | ${requestUrl(
    appBaseUrl,
    delivery.requestId,
  )}`;

  if (botToken && user.slackUserId) {
    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${botToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        channel: user.slackUserId,
        text,
        blocks: slackBlocks(delivery, appBaseUrl),
      }),
    });
    const responseJson = await response.json().catch(() => ({}));

    if (!response.ok || responseJson.ok === false) {
      return {
        status: "failed" as const,
        error:
          responseJson.error ??
          `Slack returned HTTP ${response.status}.`,
      };
    }

    return {
      status: "sent" as const,
      providerMessageId: responseJson.ts ? String(responseJson.ts) : "",
    };
  }

  if (webhookUrl) {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        blocks: slackBlocks(delivery, appBaseUrl),
      }),
    });

    if (!response.ok) {
      return {
        status: "failed" as const,
        error: await response.text(),
      };
    }

    return { status: "sent" as const };
  }

  return { status: "skipped" as const, error: "Slack provider is not configured." };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "Method not allowed." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 405,
    });
  }

  try {
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const appBaseUrl = optionalEnv("APP_BASE_URL") || optionalEnv("PROCUREMENT_DASHBOARD_URL") || defaultAppBaseUrl;
    const authorization = request.headers.get("Authorization") ?? "";
    const accessToken = authorization.replace(/^Bearer\s+/i, "");

    if (!accessToken) {
      return new Response(JSON.stringify({ ok: false, error: "Missing bearer token." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser(accessToken);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ ok: false, error: "Invalid session." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const body = await request.json().catch(() => ({}));
    const rowId = typeof body.stateId === "string" ? body.stateId : stateRowId;
    const { data, error } = await supabase
      .from("procurement_app_state")
      .select("state")
      .eq("id", rowId)
      .maybeSingle();

    if (error || !data?.state) {
      return new Response(
        JSON.stringify({ ok: false, error: error?.message ?? "Workspace state not found." }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        },
      );
    }

    const state = data.state as ProcurementState;
    const deliveries = [...(state.outboundNotifications ?? [])];
    const queued = deliveries
      .filter((delivery) => delivery.status === "queued")
      .slice(0, maxDeliveriesPerRun);
    const results = [];

    for (const delivery of queued) {
      const user = state.users.find((candidate) => candidate.id === delivery.userId);
      const updatedAt = new Date().toISOString();
      delivery.attempts = (delivery.attempts ?? 0) + 1;
      delivery.updatedAt = updatedAt;

      if (!user || user.notificationsEnabled === false) {
        delivery.status = "skipped";
        delivery.error = "Recipient notifications are disabled or user was not found.";
        results.push({ id: delivery.id, channel: delivery.channel, status: delivery.status });
        continue;
      }

      if (delivery.channel === "email") {
        delivery.status = "skipped";
        delivery.error = "Email notifications are disabled. Slack is the active channel.";
        results.push({ id: delivery.id, channel: delivery.channel, status: delivery.status });
        continue;
      }

      if (delivery.channel === "slack" && user.slackNotificationsEnabled === false) {
        delivery.status = "skipped";
        delivery.error = "Recipient Slack notifications are disabled.";
        results.push({ id: delivery.id, channel: delivery.channel, status: delivery.status });
        continue;
      }

      const result = await sendSlack(delivery, user, appBaseUrl);
      delivery.status = result.status;
      delivery.error = result.error;
      delivery.providerMessageId = result.providerMessageId;
      if (result.status === "sent") {
        delivery.sentAt = updatedAt;
      }
      results.push({ id: delivery.id, channel: delivery.channel, status: result.status });
    }

    state.outboundNotifications = deliveries;
    const { error: updateError } = await supabase.from("procurement_app_state").upsert({
      id: rowId,
      state,
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      return new Response(JSON.stringify({ ok: false, error: updateError.message }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    return new Response(JSON.stringify({ ok: true, processed: results.length, results, state }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown notification error.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
