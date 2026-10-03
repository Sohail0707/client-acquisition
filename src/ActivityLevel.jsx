import { useEffect, useRef, useState } from "react";
import { ACTIVITY_LEVELS } from "./constants.js";

// One-click LinkedIn activity level. Each option carries a short reminder of its criteria.
export default function ActivityLevel({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = ACTIVITY_LEVELS.find((l) => l.value === value);

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

  const pick = (v) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="activity" ref={ref}>
      <button className={`activity-badge ${current?.value || "unset"}`} title={current?.hint} onClick={() => setOpen((o) => !o)}>
        {current ? `${current.label} activity` : "Activity: not set"}
      </button>
      {open && (
        <div className="activity-menu" role="menu">
          {ACTIVITY_LEVELS.map((l) => (
            <button key={l.value} role="menuitem" className={`activity-option${l.value === value ? " on" : ""}`} onClick={() => pick(l.value)}>
              <span className={`activity-dot ${l.value}`} />
              <span>
                <b>{l.label}</b>
                <small>{l.hint}</small>
              </span>
            </button>
          ))}
          <div className="activity-foot">
            All tiers: 200+ connections.
            {value && <button onClick={() => pick("")}>Clear</button>}
          </div>
        </div>
      )}
    </div>
  );
}
