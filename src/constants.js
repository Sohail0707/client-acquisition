export const STATUSES = ["fresh", "message sent", "got reply", "hired"];

// LinkedIn activity tiers, set by eye from the client's Activity tab. Every tier also assumes 200+ connections.
export const ACTIVITY_LEVELS = [
  { value: "high", label: "High", hint: "Posted or commented in the last 3 months, active in 4+ of the last 6 months" },
  { value: "medium", label: "Medium", hint: "Reacts or reposts in 3+ of the last 6 months, latest within 6 weeks" },
  { value: "low", label: "Low", hint: "Any activity in 3+ of the last 12 months, latest within 3 months" },
];

export const cap = (s) => s[0].toUpperCase() + s.slice(1);
