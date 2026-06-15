import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase";

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

  const { data: pendingRequests, error } = await supabase
    .from("procurement_requests")
    .select("id, assignee_id, status")
    .in("status", ["Rashid Review", "Dr. Masjid Review"]);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const notifications =
    pendingRequests?.map((request) => ({
      user_id: request.assignee_id,
      request_id: request.id,
      title: "Daily approval reminder",
      body: `${request.id} is still pending your approval.`,
      type: "reminder",
      read: false,
    })) ?? [];

  if (notifications.length > 0) {
    const { error: insertError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: insertError.message },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: notifications.length,
    schedule: "Daily at 3:00 PM Asia/Dubai",
  });
}
