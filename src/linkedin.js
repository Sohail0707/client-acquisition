// LinkedIn activity check. The user records what they see on a client's Activity tab
// (which months had activity, the latest activity date, 200+ connections), and the
// category is derived from that against today's date, so it decays as activity ages.
//
// Stored on the client as `linkedin`:
//   { months: { "2026-09": 2, ... }, lastActive: "2026-09-20", connections200: true, checkedAt: "2026-10-03" }
// Month level: 1 = reacted / reposted, 2 = posted / commented.

export const REACTED = 1;
export const TALKED = 2;

export const CATEGORIES = {
  engaged: {
    label: "Engaged",
    approach: "Connection request with a short note about their specific website problem.",
  },
  regular: {
    label: "Regular",
    approach:
      "Connection request with a one-line note. After they accept, follow up with a short message showing their website problem.",
  },
  periodic: {
    label: "Periodic",
    approach:
      "Personal note with the request. They get less outreach, so it stands out, but expect a slower reply (they check every month or two).",
  },
  low: { label: "Low activity", approach: "Doesn't meet any category. Skip LinkedIn; use email if you have it." },
  unchecked: { label: "LinkedIn: not checked", approach: "" },
};

export const CATEGORY_ORDER = ["engaged", "regular", "periodic", "low", "unchecked"];

const pad = (n) => String(n).padStart(2, "0");
export const todayISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

// The last `n` calendar months including the current one, newest first.
export function recentMonths(n = 12, today = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    return { key: monthKey(d), label: d.toLocaleString("en", { month: "short" }), year: d.getFullYear(), month: d.getMonth() };
  });
}

// Whole days between two YYYY-MM-DD dates (both parsed as UTC, so time of day never matters).
const daysBetween = (fromISO, toISO) => Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86400e3);

// Latest known activity: the exact date if entered. If a newer month is marked than that date
// (or there's no date), estimate the middle of the newest marked month, capped at today.
function latestActivity(li, todayStr) {
  const newest = Object.keys(li.months || {}).filter((k) => li.months[k] > 0).sort().pop();
  if (li.lastActive && (!newest || li.lastActive.slice(0, 7) >= newest)) return li.lastActive;
  if (!newest) return "";
  const midMonth = `${newest}-15`;
  return midMonth > todayStr ? todayStr : midMonth;
}

export function classify(li, today = new Date()) {
  if (!li?.checkedAt) return { key: "unchecked", checks: null };

  const months = recentMonths(12, today);
  const level = (m) => li.months?.[m.key] || 0;
  const active6 = months.slice(0, 6).filter((m) => level(m) > 0).length;
  const active12 = months.filter((m) => level(m) > 0).length;
  const talkedLast3 = months.slice(0, 3).some((m) => level(m) === TALKED);
  const todayStr = todayISO(today);
  const latest = latestActivity(li, todayStr);
  const daysSince = latest ? daysBetween(latest, todayStr) : Infinity;

  const checks = {
    engaged: [
      { ok: talkedLast3, text: "Posted or commented in the last 3 months" },
      { ok: active6 >= 4, text: `Active in 4+ of the last 6 months (${active6})` },
    ],
    regular: [
      { ok: active6 >= 3, text: `Active in 3+ of the last 6 months (${active6})` },
      { ok: daysSince <= 42, text: "Latest activity within 6 weeks" },
    ],
    periodic: [
      { ok: active12 >= 3, text: `Active in 3+ of the last 12 months (${active12})` },
      { ok: daysSince <= 92, text: "Latest activity within 3 months" },
      { ok: !!li.connections200, text: "200+ connections" },
    ],
  };

  const key = ["engaged", "regular", "periodic"].find((k) => checks[k].every((c) => c.ok)) || "low";
  return { key, checks, daysSince, checkedDaysAgo: daysBetween(li.checkedAt, todayStr) };
}
