import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type NotificationDecision = "none" | "reminder" | "streak-risk";

// Hand-kept in sync with src/lib/notificationSchedule.ts's decideNotification
// (unit-tested there via Jest) — Edge Functions deploy standalone and can't
// import from the React Native app's src/lib.
function decideNotification(lastCompletedDate: string | null, todayStr: string): NotificationDecision {
  if (lastCompletedDate === todayStr) return "none";
  if (lastCompletedDate === null) return "streak-risk";

  const daysSince = daysBetween(lastCompletedDate, todayStr);
  if (daysSince >= 2) return "streak-risk";
  return "reminder";
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00Z`).getTime();
  const to = new Date(`${toDateStr}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86400000);
}

const MESSAGES: Record<Exclude<NotificationDecision, "none">, { title: string; body: string }> = {
  reminder: { title: "FitPro", body: "Ta séance du jour t'attend." },
  "streak-risk": { title: "FitPro", body: "Ça fait 2 jours — une petite séance aujourd'hui ?" },
};

Deno.serve(async (_req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const todayStr = new Date().toISOString().slice(0, 10);

  const { data: tokenRows, error: tokensError } = await supabase
    .from("push_tokens")
    .select("user_id, token");
  if (tokensError) {
    return new Response(JSON.stringify({ error: tokensError.message }), { status: 500 });
  }

  const { data: completionRows, error: completionsError } = await supabase
    .from("workout_completions")
    .select("user_id, completed_date")
    .order("completed_date", { ascending: false });
  if (completionsError) {
    return new Response(JSON.stringify({ error: completionsError.message }), { status: 500 });
  }

  // Rows are ordered newest-first, so the first row seen per user is their
  // most recent completion — a single pass gives "last completion per user"
  // without a second query per user.
  const lastCompletionByUser = new Map<string, string>();
  for (const row of completionRows ?? []) {
    if (!lastCompletionByUser.has(row.user_id)) {
      lastCompletionByUser.set(row.user_id, row.completed_date);
    }
  }

  const messages: { to: string; title: string; body: string }[] = [];
  const messageUserIds: string[] = [];

  for (const row of tokenRows ?? []) {
    const lastCompletedDate = lastCompletionByUser.get(row.user_id) ?? null;
    const decision = decideNotification(lastCompletedDate, todayStr);
    if (decision === "none") continue;

    messages.push({ to: row.token, ...MESSAGES[decision] });
    messageUserIds.push(row.user_id);
  }

  const invalidUserIds: string[] = [];
  let sendFailed = false;

  if (messages.length > 0) {
    try {
      const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(messages),
      });
      const pushResult = await pushResponse.json();
      const tickets = Array.isArray(pushResult?.data) ? pushResult.data : [];

      tickets.forEach((ticket: { status: string; details?: { error?: string } }, index: number) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          invalidUserIds.push(messageUserIds[index]);
        }
      });
    } catch (err) {
      // This function is invoked fire-and-forget by pg_net.http_post, so an
      // uncaught throw here would fail the daily cron run silently with zero
      // signal anywhere. Log it and degrade gracefully instead.
      console.error("send-reminders: push send failed", err);
      sendFailed = true;
    }
  }

  if (invalidUserIds.length > 0) {
    await supabase.from("push_tokens").delete().in("user_id", invalidUserIds);
  }

  return new Response(
    JSON.stringify({ notified: sendFailed ? 0 : messages.length, cleaned: invalidUserIds.length }),
    { headers: { "Content-Type": "application/json" } }
  );
});
