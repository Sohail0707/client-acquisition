import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api, UnauthorizedError } from "./api.js";
import { ACTIVITY, STATUSES, cap } from "./constants.js";
import ClientRow from "./ClientRow.jsx";
import Lightbox from "./Lightbox.jsx";

const CSV_COLS = ["name", "profile", "email", "website", "industry", "status", "activity", "message", "remarks"];

export default function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [activityFilter, setActivityFilter] = useState("all");
  const [focusId, setFocusId] = useState(null);
  // The last row interacted with stays highlighted, so it's easy to find after visiting a link.
  const [selectedId, setSelectedId] = useState(null);
  const [user, setUser] = useState(null);
  const [signedOut, setSignedOut] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const timers = useRef({});
  // Latest clients, so back-to-back edits (e.g. two uploads finishing together) build on each other.
  const clientsRef = useRef(clients);
  clientsRef.current = clients;
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const fail = (e, prefix = "") => (e instanceof UnauthorizedError ? setSignedOut(true) : setError(prefix + e.message));

  useEffect(() => {
    Promise.all([api.me(), api.list()])
      .then(([me, list]) => {
        setUser(me.login);
        setClients(list);
      })
      .catch(fail)
      .finally(() => setLoading(false));
  }, []);

  // Dropping a file outside a remarks box would otherwise navigate away from the app.
  useEffect(() => {
    const block = (e) => e.dataTransfer && [...e.dataTransfer.types].includes("Files") && e.preventDefault();
    window.addEventListener("dragover", block);
    window.addEventListener("drop", block);
    return () => {
      window.removeEventListener("dragover", block);
      window.removeEventListener("drop", block);
    };
  }, []);

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return clients.filter(
      (c) =>
        (!filter || c.status === filter) &&
        (activityFilter === "all" || (c.activity ?? "") === activityFilter) &&
        (!q || [c.name, c.profile, c.email, c.website, c.industry, c.message, c.remarks].join(" ").toLowerCase().includes(q))
    );
  }, [clients, query, filter, activityFilter]);

  function update(id, field, value, delay = 400) {
    clientsRef.current = clientsRef.current.map((c) => (c.id === id ? { ...c, [field]: value } : c));
    setClients(clientsRef.current);
    const key = id + field;
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      api.update(id, { [field]: value }).catch((e) => fail(e, "Save failed: "));
    }, delay);
  }

  const imagesOf = (id) => clientsRef.current.find((c) => c.id === id)?.images || [];
  const addImages = (id, ids) => update(id, "images", [...imagesOf(id), ...ids], 0);
  const removeImage = (id, imageId) => update(id, "images", imagesOf(id).filter((i) => i !== imageId), 0);

  async function add() {
    try {
      const c = await api.create();
      setQuery("");
      setFilter("");
      setActivityFilter("all");
      setClients((cs) => [c, ...cs]);
      setFocusId(c.id);
      setSelectedId(c.id);
    } catch (e) {
      fail(e);
    }
  }

  async function remove(id) {
    if (!confirm("Delete this client?")) return;
    try {
      await api.remove(id);
      setClients((cs) => cs.filter((c) => c.id !== id));
    } catch (e) {
      fail(e);
    }
  }

  function exportCsv() {
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [CSV_COLS.join(","), ...clients.map((c) => CSV_COLS.map((k) => esc(c[k])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "clients.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  if (signedOut) {
    return (
      <div className="signin">
        <h1>Client Tracker</h1>
        <p>Sign in to continue.</p>
        <a className="button" href="/auth/login">Sign in with GitHub</a>
      </div>
    );
  }

  return (
    <main>
      <header>
        <h1>
          Clients<small>{visible.length} of {clients.length}</small>
        </h1>
        <input className="control search" type="search" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="control" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{cap(s)}</option>
          ))}
        </select>
        <select className="control" value={activityFilter} onChange={(e) => setActivityFilter(e.target.value)}>
          <option value="all">All activity</option>
          {ACTIVITY.map((a) => (
            <option key={a.value} value={a.value}>{a.value ? a.label : "Not checked"}</option>
          ))}
        </select>
        <button className="ghost" onClick={exportCsv}>Export CSV</button>
        <button onClick={add}>+ Add client</button>
        {user && (
          <a className="signout" href="/auth/logout" title={`Signed in as ${user}`}>Sign out</a>
        )}
      </header>

      {error && <div className="error" onClick={() => setError("")}>{error}</div>}

      <div className="list">
        <div className="list-head">
          <div>Client</div><div>Contact</div><div>Status</div><div>Draft message</div><div>Remarks</div>
        </div>
        {visible.map((c) => (
          <ClientRow
            key={c.id}
            client={c}
            autoFocus={c.id === focusId}
            selected={c.id === selectedId}
            onSelect={setSelectedId}
            onChange={update}
            onAddImages={addImages}
            onRemoveImage={removeImage}
            onOpenImage={(images, index) => setLightbox({ images, index })}
            onError={fail}
            onDelete={remove}
          />
        ))}
        {!loading && visible.length === 0 && (
          <div className="empty">{clients.length ? "No clients match." : "No clients yet. Click “Add client”."}</div>
        )}
      </div>

      {lightbox && <Lightbox images={lightbox.images} start={lightbox.index} onClose={closeLightbox} />}
    </main>
  );
}
