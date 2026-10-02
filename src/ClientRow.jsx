import { useLayoutEffect, useRef } from "react";
import { STATUSES, cap } from "./constants.js";
import Remarks from "./Remarks.jsx";

const toHref = (v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);

function Field({ value, onChange, type = "text", autoFocus }) {
  return <input type={type} value={value} placeholder="—" autoFocus={autoFocus} onChange={(e) => onChange(e.target.value)} />;
}

function LinkField({ value, onChange }) {
  return (
    <div className="link">
      <Field value={value} onChange={onChange} />
      <a href={value ? toHref(value) : undefined} target="_blank" rel="noopener noreferrer" className={value ? "on" : ""} title="Open link">↗</a>
    </div>
  );
}

const MESSAGE_MAX_HEIGHT = 180;

// Grows with its content up to MESSAGE_MAX_HEIGHT, then scrolls.
function MessageField({ value, onChange }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const t = ref.current;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, MESSAGE_MAX_HEIGHT)}px`;
    t.style.overflowY = t.scrollHeight > MESSAGE_MAX_HEIGHT ? "auto" : "hidden";
  }, [value]);
  return <textarea ref={ref} rows={1} value={value} placeholder="Outreach draft…" onChange={(e) => onChange(e.target.value)} />;
}

export default function ClientRow({ client: c, autoFocus, onChange, onAddImages, onRemoveImage, onOpenImage, onError, onDelete }) {
  const set = (field) => (value) => onChange(c.id, field, value);
  return (
    <tr>
      <td><Field value={c.name} onChange={set("name")} autoFocus={autoFocus} /></td>
      <td><LinkField value={c.profile} onChange={set("profile")} /></td>
      <td><Field type="email" value={c.email} onChange={set("email")} /></td>
      <td><LinkField value={c.website} onChange={set("website")} /></td>
      <td><Field value={c.industry} onChange={set("industry")} /></td>
      <td>
        <select className="status" data-s={c.status} value={c.status} onChange={(e) => set("status")(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{cap(s)}</option>
          ))}
        </select>
      </td>
      <td className="message"><MessageField value={c.message ?? ""} onChange={set("message")} /></td>
      <td className="remarks">
        <Remarks
          text={c.remarks}
          images={c.images}
          onText={set("remarks")}
          onAddImages={(ids) => onAddImages(c.id, ids)}
          onRemoveImage={(imageId) => onRemoveImage(c.id, imageId)}
          onOpen={onOpenImage}
          onError={onError}
        />
      </td>
      <td><button className="del" title="Delete" onClick={() => onDelete(c.id)}>✕</button></td>
    </tr>
  );
}
