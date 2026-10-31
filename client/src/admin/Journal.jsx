import { useEffect, useMemo, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { REGIONS, THREAT_COLORS, LEVEL_OF, typeLabel } from '../data/reference.js';

// ─────────────────────────────────────────────────────────────────────────────
// Onglet 2 — Journal des incidents.
// Signalements ANONYMISÉS (l'horodatage, types, plateformes, région, gravité).
// Le récit chiffré de la victime est déchiffré UNIQUEMENT à la demande, et le
// module de suivi des alertes externes (transmission) est intégré.
// ─────────────────────────────────────────────────────────────────────────────

function sevBadge(s) {
  if (s >= 3) return { t: 'Haute', cls: 'bg-red-50 text-red-700 ring-red-200' };
  if (s === 2) return { t: 'Moyenne', cls: 'bg-orange-50 text-orange-700 ring-orange-200' };
  return { t: 'Faible', cls: 'bg-green-50 text-green-700 ring-green-200' };
}

export default function Journal() {
  const [reports, setReports] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // filtres
  const [region, setRegion] = useState('');
  const [severity, setSeverity] = useState('');
  const [status, setStatus] = useState('');

  // panneau de consultation
  const [sel, setSel] = useState(null);
  const [note, setNote] = useState(null);
  const [noteLoading, setNoteLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [r, a] = await Promise.all([api.admin('/reports'), api.admin('/alerts')]);
      setReports(r.reports ?? []);
      setAlerts(a.alerts ?? []);
      setErr(null);
    } catch {
      setErr('Impossible de charger le journal.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const alertsByReport = useMemo(() => {
    const m = new Map();
    for (const a of alerts) {
      if (!m.has(a.reportId)) m.set(a.reportId, a);
    }
    return m;
  }, [alerts]);

  const filtered = useMemo(() => reports.filter((r) =>
    (!region || r.region === region) &&
    (!severity || r.severity === Number(severity)) &&
    (!status || r.alertStatus === status)
  ), [reports, region, severity, status]);

  async function open(r) {
    setSel(r);
    setNote(null);
    setNoteLoading(true);
    try {
      const d = await api.admin(`/reports/${r.id}/note`);
      setNote(d.note);
    } catch {
      setNote('Récit non lisible (chiffrement scellé). Patientez ou vérifiez la clé serveur.');
    } finally {
      setNoteLoading(false);
    }
  }

  // Suivi de l'alerte externe : route dédiée /admin/alerts/:id/status + dispatch.
  async function dispatchFor(reportId) {
    const a = alertsByReport.get(reportId);
    if (!a) return;
    setDispatching(true);
    try {
      const before = await api.admin(`/alerts/${a.id}/status`);
      if (before.status !== 'sent') {
        await api.adminPost(`/alerts/${a.id}/dispatch`);
      }
      const after = await api.admin(`/alerts/${a.id}/status`);
      setAlerts((prev) => prev.map((x) => (x.id === after.id ? { ...x, status: after.status } : x)));
      setReports((prev) => prev.map((x) => (x.id === after.reportId ? { ...x, alertStatus: after.status } : x)));
      setSel((s) => (s && s.id === after.reportId ? { ...s, alertStatus: after.status } : s));
    } catch {
      /* l'état local reste cohérent avec le serveur au prochain rechargement */
    } finally {
      setDispatching(false);
    }
  }

  return (
    <div className="space-y-4">
      {sel ? (
        /* ── Consultation consolidée d'un signalement ── */
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-brand-800">{sel.id}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${sevBadge(sel.severity).cls}`}>
                  {sevBadge(sel.severity).t}
                </span>
                <span className={sel.hasNote ? 'inline-flex items-center gap-1 text-xs font-semibold text-brand-600' : 'text-xs text-ink/40'}>
                  {sel.hasNote && <Icon name="lock" size={12} />}
                  {sel.hasNote ? 'Récit chiffré disponible' : 'Aucun récit'}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink/50">Horodatage : {new Date(sel.createdAt).toLocaleString('fr-FR')}</p>
            </div>
            <button type="button" onClick={() => { setSel(null); setNote(null); }}
              className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">
              <Icon name="arrowLeft" size={12} />
              Retour / Fermer
            </button>
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
            <div className="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
              <dt className="text-xs font-semibold text-brand-700">Région</dt>
              <dd className="text-ink">{sel.region}</dd>
            </div>
            <div className="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
              <dt className="text-xs font-semibold text-brand-700">Plateformes</dt>
              <dd className="text-ink">{sel.platforms.join(', ') || '—'}</dd>
            </div>
            <div className="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
              <dt className="text-xs font-semibold text-brand-700">Types cochés</dt>
              <dd className="text-ink">{sel.types.map((t) => typeLabel(t)).join(' · ')}</dd>
            </div>
          </dl>

          <div className="mt-4 rounded-xl border border-brand-100 bg-white p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">Texte libre de la victime (déchiffré à la demande)</p>
            <div
              role="status"
              aria-live="polite"
              className={
                'rounded-lg p-3 text-sm leading-relaxed ring-1 '
                + (sel.hasNote ? 'bg-amber-50 ring-amber-200 text-amber-950' : 'bg-brand-50 ring-brand-100 text-ink/60')
              }
            >
              {noteLoading
                ? 'Déchiffrement en cours…'
                : (note ? note : 'Aucun récit conservé pour ce signalement.')}
            </div>
            <p className="mt-2 flex items-start gap-1.5 text-xs text-ink/50">
              <Icon name="alert" size={13} className="mt-0.5 shrink-0" />
              <span>Ne tentez pas de contacter la victime : c'est elle qui choisit une structure via l'annuaire. Conservez l'information pour l'action de prévention par région.</span>
            </p>
          </div>

          {/* Suivi de transmission des alertes externes */}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-brand-50 p-3 text-sm ring-1 ring-brand-100">
              <p className="text-xs font-semibold text-brand-700">Statut alerte externe</p>
              <p className="mt-1 flex items-center gap-1.5 text-ink">
                {sel.alertStatus === 'sent' ? (
                  <>
                    <Icon name="checkCircle" size={14} className="shrink-0 text-green-600" />
                    <span>Transmise — état vérifiable via /admin/alerts/:id/status</span>
                  </>
                ) : sel.alertStatus === 'queued' ? (
                  <>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />
                    <span>En file d'envoi</span>
                  </>
                ) : (
                  <span>— Sans objet (cas non grave)</span>
                )}
              </p>
              {(alertsByReport.get(sel.id) || sel.alertStatus === 'queued') && (
                <button type="button" onClick={() => dispatchFor(sel.id)} disabled={dispatching}
                  className="mt-2 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-800 disabled:opacity-60">
                  {dispatching ? 'Transmission…' : 'Escalader vers un relais (envoi)'}
                </button>
              )}
            </div>
            <div className="rounded-xl bg-sand text-amber-900 p-3 text-xs leading-relaxed ring-1 ring-amber-200">
              <p className="font-bold">Déontologie console</p>
              Toute action d'escalade est technique : elle n'ouvre jamais l'identité du signalisateur — elle existe uniquement. Le suivi porte uniquement l'état d'envoi.
            </div>
          </div>
        </section>
      ) : (
        /* ── Table du journal ── */
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-brand-100">
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-lg border border-brand-200 px-2 py-1.5 text-sm">
              <option value="">Toutes régions</option>
              {REGIONS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} className="rounded-lg border border-brand-200 px-2 py-1.5 text-sm">
              <option value="">Toute gravité</option>
              <option value="3">Haute</option>
              <option value="2">Moyenne</option>
              <option value="1">Faible</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-brand-200 px-2 py-1.5 text-sm">
              <option value="">Tous statuts d'alerte</option>
              <option value="none">Sans alerte</option>
              <option value="queued">En file</option>
              <option value="sent">Transmise</option>
            </select>
            <span className="ml-auto text-xs text-ink/50">{filtered.length} signalement(s) anonymisé(s)</span>
            <button type="button" onClick={load} className="flex items-center gap-1.5 rounded-full bg-brand-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-800">
              <Icon name="refresh" size={13} />
              Actualiser
            </button>
          </div>

          {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{err}</p>}

          <div className="rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="bg-brand-50 text-xs uppercase tracking-wide text-brand-700">
                    <th className="px-4 py-2">Réf.</th>
                    <th className="px-4 py-2">Horodatage</th>
                    <th className="px-4 py-2">Région</th>
                    <th className="px-4 py-2">Types</th>
                    <th className="px-4 py-2">Plateformes</th>
                    <th className="px-4 py-2">Gravité</th>
                    <th className="px-4 py-2">Alerte</th>
                    <th className="px-4 py-2">Récit</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr><td colSpan="8" className="px-4 py-8 text-center text-ink/50">Chargement…</td></tr>
                  )}
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan="8" className="px-4 py-8 text-center text-ink/50">Aucun signalement ne correspond aux filtres.</td></tr>
                  )}
                  {filtered.map((r) => {
                    const sev = sevBadge(r.severity);
                    const dotLevel = r.alertStatus === 'sent' ? 0 : r.alertStatus === 'queued' ? 2 : LEVEL_OF(r.severity);
                    return (
                      <tr key={r.id} className="cursor-pointer border-t border-brand-50 hover:bg-brand-50/50" onClick={() => open(r)}>
                        <td className="px-4 py-2.5 font-mono text-xs font-bold text-brand-800">{r.id}</td>
                        <td className="px-4 py-2.5 whitespace-nowrap text-xs text-ink/70">
                          {new Date(r.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-ink/80">
                            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: THREAT_COLORS[dotLevel] }} />
                            {r.region}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-ink/70">
                          {r.types.map((t) => typeLabel(t)).slice(0, 2).join(', ')}
                          {r.types.length > 2 ? ` +${r.types.length - 2}` : ''}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-ink/70">{r.platforms.join(', ') || '—'}</td>
                        <td className="px-4 py-2.5">
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${sev.cls}`}>{sev.t}</span>
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {r.alertStatus === 'sent' && <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold text-green-700 ring-1 ring-green-200">Transmise</span>}
                          {r.alertStatus === 'queued' && <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold text-orange-700 ring-1 ring-orange-200">En file</span>}
                          {r.alertStatus === 'none' && <span className="text-ink/40">—</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {r.hasNote ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-brand-700">
                              <Icon name="lock" size={12} />
                              Consulter
                            </span>
                          ) : <span className="text-ink/40">Aucun récit</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {reports.length > filtered.length && (
              <p className="px-4 py-2 text-xs text-ink/50">Les filtres masquent {reports.length - filtered.length} ligne(s) — précise-les pour affiner.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
