// ─────────────────────────────────────────────────────────────────────────────
// ARO — client HTTP minimal. Pas d'identification, pas de localStorage :
// la session admin vit dans un cookie éphémère HttpOnly côté serveur.
// ─────────────────────────────────────────────────────────────────────────────
async function toJson(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(data.message || `HTTP ${res.status}`);
    e.status = res.status;
    throw e;
  }
  return data;
}

export const api = {
  meta: () => fetch('/api/meta').then(toJson),
  stats: () => fetch('/api/stats').then(toJson),
  resources: (region) =>
    fetch('/api/resources' + (region ? `?region=${encodeURIComponent(region)}` : '')).then(toJson),
  sendReport: (payload) =>
    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(toJson),

  // Console administrateur (cookie HttpOnly escrow côté serveur)
  login: (user, password) =>
    fetch('/api/admin/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, password }),
    }).then(toJson),
  logout: () =>
    fetch('/api/admin/logout', { method: 'POST', credentials: 'include' }).then(toJson),
  admin: (path) => fetch(`/api/admin${path}`, { credentials: 'include' }).then(toJson),
  adminPost: (path, body) =>
    fetch(`/api/admin${path}`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    }).then(toJson),
};
