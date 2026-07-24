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

type LiveStateRow = {
  state?: ProcurementState;
  updated_at?: string | null;
} | null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const stateRowId = "default";
const defaultAppBaseUrl = "https://procurement.sulmi.ai/";
const maxDeliveriesPerRun = 25;
// A transient Slack error (rate-limit, 5xx, network blip) marks a delivery
// "failed". Retry it a bounded number of times before giving up, instead of
// dropping it permanently on the first hiccup.
const maxSlackAttempts = 3;
// Persisting the send outcomes can hit the optimistic-lock (updated_at) guard
// when a client saved meanwhile. Retry the write (re-reading each time) so the
// "sent" status is recorded and the delivery is not re-sent as a duplicate.
const maxPersistAttempts = 6;

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

function deliveryUpdate(delivery: OutboundNotificationLog) {
  return {
    id: delivery.id,
    channel: delivery.channel,
    status: delivery.status,
    attempts: delivery.attempts,
    updatedAt: delivery.updatedAt,
    sentAt: delivery.sentAt,
    error: delivery.error,
    providerMessageId: delivery.providerMessageId,
  };
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
    const responseMode =
      body.responseMode === "delivery-updates" ? "delivery-updates" : "full-state";
    const { data, error } = await supabase
      .from("procurement_app_state")
      .select("state,updated_at")
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

    const liveStateRow = data as LiveStateRow;
    const state = liveStateRow?.state as ProcurementState;
    const deliveries = [...(state.outboundNotifications ?? [])];
    const queued = deliveries
      .filter(
        (delivery) =>
          delivery.status === "queued" ||
          (delivery.status === "failed" &&
            (delivery.attempts ?? 0) < maxSlackAttempts),
      )
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
        results.push(deliveryUpdate(delivery));
        continue;
      }

      if (delivery.channel === "email") {
        delivery.status = "skipped";
        delivery.error = "Email notifications are disabled. Slack is the active channel.";
        results.push(deliveryUpdate(delivery));
        continue;
      }

      if (delivery.channel === "slack" && user.slackNotificationsEnabled === false) {
        delivery.status = "skipped";
        delivery.error = "Recipient Slack notifications are disabled.";
        results.push(deliveryUpdate(delivery));
        continue;
      }

      const result = await sendSlack(delivery, user, appBaseUrl);
      delivery.status = result.status;
      delivery.error = result.error;
      delivery.providerMessageId = result.providerMessageId;
      if (result.status === "sent") {
        delivery.sentAt = updatedAt;
      }
      results.push(deliveryUpdate(delivery));
    }

    state.outboundNotifications = deliveries;

    // Slack was already delivered above. Record the send outcomes durably even
    // if the row changed while we were sending: on an optimistic-lock conflict,
    // re-read the latest state and re-apply ONLY our per-delivery results by id
    // (preserving every other concurrent change), then retry — rather than
    // dropping the batch, which would leave deliveries "queued" and re-send them
    // as duplicates on the next flush.
    const processedById = new Map(
      queued.map((delivery) => [delivery.id, delivery] as const),
    );
    const applyResults = (target: ProcurementState) => {
      target.outboundNotifications = (target.outboundNotifications ?? []).map((delivery) => {
        const processed = processedById.get(delivery.id);
        if (!processed) {
          return delivery;
        }
        return {
          ...delivery,
          status: processed.status,
          attempts: processed.attempts,
          updatedAt: processed.updatedAt,
          sentAt: processed.sentAt,
          error: processed.error,
          providerMessageId: processed.providerMessageId,
        };
      });
    };

    let persistState: ProcurementState = state;
    let lockUpdatedAt = liveStateRow?.updated_at ?? "";
    let updatedAt: string | null = null;
    let persistError: string | null = null;

    for (let attempt = 0; attempt < maxPersistAttempts; attempt++) {
      const { data: updatedRows, error: updateError } = await supabase
        .from("procurement_app_state")
        .update({
          state: persistState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rowId)
        .eq("updated_at", lockUpdatedAt)
        .select("updated_at");

      if (updateError) {
        persistError = updateError.message;
        break;
      }

      if (Array.isArray(updatedRows) && updatedRows.length > 0) {
        updatedAt = updatedRows[0]?.updated_at ?? null;
        break;
      }

      const { data: freshRow, error: refetchError } = await supabase
        .from("procurement_app_state")
        .select("state,updated_at")
        .eq("id", rowId)
        .maybeSingle();

      if (refetchError || !freshRow || !freshRow.state) {
        persistError =
          refetchError?.message ??
          "Workspace state was not found while recording notifications.";
        break;
      }

      const freshState = freshRow.state as ProcurementState;
      applyResults(freshState);
      persistState = freshState;
      lockUpdatedAt = freshRow.updated_at ?? "";
    }

    if (persistError) {
      return new Response(JSON.stringify({ ok: false, error: persistError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    if (updatedAt === null) {
      return new Response(
        JSON.stringify({
          ok: false,
          error:
            "Workspace state kept changing while recording notifications. The messages were sent; retry to record their status.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 409,
        },
      );
    }
    return new Response(
      JSON.stringify(
        responseMode === "delivery-updates"
          ? {
              ok: true,
              processed: results.length,
              deliveries: results,
              updatedAt,
            }
          : {
              ok: true,
              processed: results.length,
              results,
              state: persistState,
              updatedAt,
            },
      ),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
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
