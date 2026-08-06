export type NotificationDecision = 'none' | 'reminder' | 'streak-risk';

const STREAK_RISK_THRESHOLD_DAYS = 2;

export function decideNotification(lastCompletedDate: string | null, todayStr: string): NotificationDecision {
  if (lastCompletedDate === todayStr) return 'none';
  if (lastCompletedDate === null) return 'streak-risk';

  const daysSince = daysBetween(lastCompletedDate, todayStr);
  if (daysSince >= STREAK_RISK_THRESHOLD_DAYS) return 'streak-risk';
  return 'reminder';
}

function daysBetween(fromDateStr: string, toDateStr: string): number {
  const from = new Date(`${fromDateStr}T00:00:00Z`).getTime();
  const to = new Date(`${toDateStr}T00:00:00Z`).getTime();
  return Math.round((to - from) / 86400000);
}
