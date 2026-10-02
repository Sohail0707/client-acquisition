async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`/api/${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export const api = {
  list: () => request("clients"),
  create: (data = {}) => request("clients", { method: "POST", body: data }),
  update: (id, patch) => request(`clients/${id}`, { method: "PATCH", body: patch }),
  remove: (id) => request(`clients/${id}`, { method: "DELETE" }),
};
