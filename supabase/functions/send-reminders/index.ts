import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

type NotificationDecision = "none" | "reminder" | "streak-risk";

// Hand-kept in sync with src/lib/notificationSchedule.ts's decideNotification
// (unit-tested there via Jest) — Edge Functions deploy standalone and can't
// import from the React Native app's src/lib. Drift between the two copies
// is caught automatically by
// src/__tests__/notificationScheduleSync.test.ts, which extracts this exact
// function's source and cross-checks it against the app copy — update both
// together, the sync test will fail otherwise.
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

// Expo's push API rejects a request with more than 100 messages — send-in
// chunks so the daily run degrades to "slower" rather than "fails outright"
// once the user base passes that count.
const EXPO_PUSH_BATCH_SIZE = 100;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

// PostgREST caps unbounded selects at a project-configured default (commonly
// 1000 rows) with no error — rows beyond that are silently dropped. Page
// through with .range() so this function still sees every row once either
// table outgrows that cap.
const PAGE_SIZE = 1000;

async function fetchAllRows<T>(
  page: (from: number, to: number) => Promise<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await page(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

export async function handleRequest(req: Request): Promise<Response> {
  // supabase/migrations/0025_notifications_cron.sql configures the only
  // legitimate caller (pg_cron via pg_net) to send the project's real
  // service_role key as the Bearer token. Supabase's platform-level
  // verify_jwt (the default, and not overridden anywhere in this repo) only
  // checks that the Authorization header is SOME validly-signed JWT for this
  // project — the public anon key shipped in the app bundle passes that
  // check just as easily as the service_role key. This function does
  // privileged work (reads every user's push token and workout history,
  // mass-sends notifications, deletes push_tokens rows) using its own
  // service-role client regardless of who called it, so it must check the
  // caller's actual key itself rather than trusting platform-level verify_jwt.
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.headers.get("Authorization") !== `Bearer ${serviceRoleKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceRoleKey);

  const todayStr = new Date().toISOString().slice(0, 10);

  let tokenRows: { user_id: string; token: string }[];
  let completionRows: { user_id: string; completed_date: string }[];
  try {
    tokenRows = await fetchAllRows((from, to) =>
      supabase.from("push_tokens").select("user_id, token").range(from, to)
    );
    completionRows = await fetchAllRows((from, to) =>
      supabase
        .from("workout_completions")
        .select("user_id, completed_date")
        .order("completed_date", { ascending: false })
        .range(from, to)
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }

  // Rows are ordered newest-first, so the first row seen per user is their
  // most recent completion — a single pass gives "last completion per user"
  // without a second query per user.
  const lastCompletionByUser = new Map<string, string>();
  for (const row of completionRows) {
    if (!lastCompletionByUser.has(row.user_id)) {
      lastCompletionByUser.set(row.user_id, row.completed_date);
    }
  }

  const messages: { to: string; title: string; body: string }[] = [];
  const messageUserIds: string[] = [];

  for (const row of tokenRows) {
    const lastCompletedDate = lastCompletionByUser.get(row.user_id) ?? null;
    const decision = decideNotification(lastCompletedDate, todayStr);
    if (decision === "none") continue;

    messages.push({ to: row.token, ...MESSAGES[decision] });
    messageUserIds.push(row.user_id);
  }

  const invalidUserIds: string[] = [];
  let notified = 0;
  let sendFailed = false;

  const messageBatches = chunk(messages, EXPO_PUSH_BATCH_SIZE);
  const userIdBatches = chunk(messageUserIds, EXPO_PUSH_BATCH_SIZE);

  for (let batchIndex = 0; batchIndex < messageBatches.length; batchIndex++) {
    const batchMessages = messageBatches[batchIndex];
    const batchUserIds = userIdBatches[batchIndex];

    try {
      const pushResponse = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(batchMessages),
      });
      const pushResult = await pushResponse.json();
      const tickets = Array.isArray(pushResult?.data) ? pushResult.data : [];

      tickets.forEach((ticket: { status: string; details?: { error?: string } }, index: number) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          invalidUserIds.push(batchUserIds[index]);
        }
      });
      notified += batchMessages.length;
    } catch (err) {
      // This function is invoked fire-and-forget by pg_net.http_post, so an
      // uncaught throw here would fail the daily cron run silently with zero
      // signal anywhere. Log it and degrade gracefully instead — a failure
      // in one batch does not stop the remaining batches from sending.
      console.error("send-reminders: push send failed for a batch", err);
      sendFailed = true;
    }
  }

  if (invalidUserIds.length > 0) {
    await supabase.from("push_tokens").delete().in("user_id", invalidUserIds);
  }

  return new Response(
    JSON.stringify({ notified, cleaned: invalidUserIds.length, sendFailed }),
    { headers: { "Content-Type": "application/json" } }
  );
}

// Only start the server when this file is actually run by Deno (a real
// deploy) — not when it's imported (e.g. by the Jest sync test, which reads
// decideNotification/daysBetween from this same file's source under Node).
if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  Deno.serve(handleRequest);
}
