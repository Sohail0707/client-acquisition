export class UnauthorizedError extends Error {}

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`/api/${path}`, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new UnauthorizedError("Not signed in");
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
  return res.json();
}

export const api = {
  me: () => request("me"),
  list: () => request("clients"),
  create: (data = {}) => request("clients", { method: "POST", body: data }),
  update: (id, patch) => request(`clients/${id}`, { method: "PATCH", body: patch }),
  remove: (id) => request(`clients/${id}`, { method: "DELETE" }),
  uploadImage: async (blob) => {
    const res = await fetch("/api/images", { method: "POST", headers: { "content-type": blob.type }, body: blob });
    if (res.status === 401) throw new UnauthorizedError("Not signed in");
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText);
    return (await res.json()).id;
  },
};

export const imageUrl = (id) => `/api/images/${id}`;
