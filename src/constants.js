export const STATUSES = ["fresh", "message sent", "got reply", "hired"];

// How recently the client posted or commented on LinkedIn. "" means not checked yet.
export const ACTIVITY = [
  { value: "", label: "Activity: not checked" },
  { value: "< 1 month", label: "Active < 1 month" },
  { value: "1-3 months", label: "Active 1–3 months" },
  { value: "3-6 months", label: "Active 3–6 months" },
];

export const cap = (s) => s[0].toUpperCase() + s.slice(1);
