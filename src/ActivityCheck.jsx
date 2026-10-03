import { useEffect, useRef, useState } from "react";
import { CATEGORIES, classify, recentMonths, todayISO } from "./linkedin.js";

const LEVEL_TITLE = ["No activity", "Reacted / reposted", "Posted / commented"];
const EMPTY = { months: {}, lastActive: "", connections200: false };

function ago(days) {
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? "1 month ago" : `${months} months ago`;
}

export default function ActivityCheck({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const result = classify(value);
  const li = value || EMPTY;

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Every edit counts as a fresh check, so "checked … ago" reflects the last time you looked.
  const save = (patch) => onChange({ ...EMPTY, ...li, ...patch, checkedAt: todayISO() });

  const cycleMonth = (key) => {
    const next = ((li.months[key] || 0) + 1) % 3;
    const months = { ...li.months };
    if (next) months[key] = next;
    else delete months[key];
    save({ months });
  };

  const months = recentMonths(12).reverse(); // oldest → newest, left to right
  const cat = CATEGORIES[result.key];
  const badgeTitle = result.checks ? `${cat.label} · checked ${ago(result.checkedDaysAgo)}` : "Record their LinkedIn activity";

  return (
    <div className="li-check" ref={ref}>
      <button className={`li-badge ${result.key}`} title={badgeTitle} onClick={() => setOpen((o) => !o)}>
        {cat.label}
      </button>

      {open && (
        <div className="li-pop" role="dialog" aria-label="LinkedIn activity">
          <div className="li-pop-head">
            <strong>LinkedIn activity</strong>
            {result.checks && <span>checked {ago(result.checkedDaysAgo)}</span>}
          </div>
          <p className="li-hint">
            On their profile open <b>Activity</b>. Click a month once if they reacted or reposted, twice if they posted or commented.
          </p>

          <div className="li-months">
            {months.map((m) => {
              const level = li.months[m.key] || 0;
              return (
                <button
                  key={m.key}
                  className={`li-month l${level}`}
                  title={`${m.label} ${m.year}: ${LEVEL_TITLE[level]}`}
                  onClick={() => cycleMonth(m.key)}
                >
                  <span>{m.label}</span>
                  {m.month === 0 && <small>{m.year}</small>}
                </button>
              );
            })}
          </div>
          <div className="li-legend">
            <span><i className="l1" /> Reacted / reposted</span>
            <span><i className="l2" /> Posted / commented</span>
          </div>

          <div className="li-fields">
            <label>
              Latest activity
              <input type="date" max={todayISO()} value={li.lastActive} onChange={(e) => save({ lastActive: e.target.value })} />
            </label>
            <label className="li-check-box">
              <input type="checkbox" checked={li.connections200} onChange={(e) => save({ connections200: e.target.checked })} />
              200+ connections
            </label>
          </div>

          {result.checks ? (
            <div className="li-result">
              <div className={`li-badge static ${result.key}`}>{cat.label}</div>
              <p className="li-approach">{cat.approach}</p>
              {["engaged", "regular", "periodic"].map((k) => (
                <div key={k} className={`li-rule${k === result.key ? " match" : ""}`}>
                  <b>{CATEGORIES[k].label}</b>
                  {result.checks[k].map((c) => (
                    <span key={c.text} className={c.ok ? "ok" : "no"}>{c.ok ? "✓" : "✗"} {c.text}</span>
                  ))}
                </div>
              ))}
              <button className="li-clear" onClick={() => onChange(null)}>Clear check</button>
            </div>
          ) : (
            <p className="li-hint">Mark the months they were active to get a category.</p>
          )}
        </div>
      )}
    </div>
  );
}
