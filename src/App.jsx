import { useEffect, useMemo, useRef, useState } from "react";
import { api, UnauthorizedError } from "./api.js";
import { STATUSES, cap } from "./constants.js";
import ClientRow from "./ClientRow.jsx";

const CSV_COLS = ["name", "profile", "email", "website", "industry", "status", "remarks"];

export default function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [focusId, setFocusId] = useState(null);
  const [user, setUser] = useState(null);
  const [signedOut, setSignedOut] = useState(false);
  const timers = useRef({});

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

  const visible = useMemo(() => {
    const q = query.toLowerCase();
    return clients.filter(
      (c) =>
        (!filter || c.status === filter) &&
        (!q || [c.name, c.profile, c.email, c.website, c.industry, c.remarks].join(" ").toLowerCase().includes(q))
    );
  }, [clients, query, filter]);

  function update(id, field, value) {
    setClients((cs) => cs.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
    const key = id + field;
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(() => {
      api.update(id, { [field]: value }).catch((e) => fail(e, "Save failed: "));
    }, 400);
  }

  async function add() {
    try {
      const c = await api.create();
      setQuery("");
      setFilter("");
      setClients((cs) => [c, ...cs]);
      setFocusId(c.id);
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
        <button className="ghost" onClick={exportCsv}>Export CSV</button>
        <button onClick={add}>+ Add client</button>
        {user && (
          <a className="signout" href="/auth/logout" title={`Signed in as ${user}`}>Sign out</a>
        )}
      </header>

      {error && <div className="error" onClick={() => setError("")}>{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Profile</th><th>Email</th><th>Website</th><th>Industry</th><th>Status</th><th>Remarks</th><th />
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => (
              <ClientRow key={c.id} client={c} autoFocus={c.id === focusId} onChange={update} onDelete={remove} />
            ))}
          </tbody>
        </table>
        {!loading && visible.length === 0 && (
          <div className="empty">{clients.length ? "No clients match." : "No clients yet. Click “Add client”."}</div>
        )}
      </div>
    </main>
  );
}
