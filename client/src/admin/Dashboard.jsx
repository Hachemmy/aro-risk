import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ThreatMap from '../components/ThreatMap.jsx';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';
import { REGIONS, THREAT_LABELS, THREAT_COLORS, LEVEL_OF, typeLabel } from '../data/reference.js';

// ─────────────────────────────────────────────────────────────────────────────
// Onglet 1 — Tableau de bord & carte thermique.
// Agrégats temps réel (/api/admin/overview). Aucune donnée personnelle exposée.
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, hint, accent }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
      <p className="text-3xl font-bold text-ink">{value}</p>
      <p className="text-sm font-semibold text-brand-700">{label}</p>
      {hint && <p className="mt-1 text-xs text-ink/50">{hint}</p>}
      {accent && <p className={'mt-1 text-xs font-semibold ' + accent.cls}>{accent.txt}</p>}
    </div>
  );
}

function Donut({ byType, byRegion }) {
  // Donut de répartition par priorité : Haute (sev 3 agrégé approx.) / normale.
  const levels = useMemo(() => {
    let high = 0, mid = 0, low = 0;
    for (const r of byRegion || []) {
      const lvl = LEVEL_OF(r.count);
      if (lvl <= 1) low += r.count;
      else if (lvl === 2) mid += r.count;
      else high += r.count;
    }
    const total = high + mid + low;
    if (total === 0) return { parts: [], total: 0 };
    const parts = [
      { n: 'Haute priorité', v: high, c: '#ef4444' },
      { n: 'Surveillance accrue', v: mid, c: '#fb923c' },
      { n: 'Faible intensité', v: low, c: '#86efac' },
    ].filter((p) => p.v > 0);
    return { parts, total };
  }, [byRegion]);

  let acc = 0;
  const R = 42, C = 2 * Math.PI * R;

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" className="h-36 w-36 shrink-0" role="img" aria-label="Répartition des incidents">
        {levels.total === 0 && (
          <circle cx="60" cy="60" r={R} fill="none" stroke="#e5e7eb" strokeWidth="16" />
        )}
        {levels.parts.map((p) => {
          const frac = p.v / levels.total;
          const dash = `${frac * C} ${C}`;
          const offset = -acc * C;
          acc += frac;
          return (
            <circle key={p.n} cx="60" cy="60" r={R} fill="none"
                    stroke={p.c || '#2e6e78'} strokeWidth="16"
                    strokeDasharray={dash} strokeDashoffset={offset}
                    transform="rotate(-90 60 60)" />
          );
        })}
        <text x="60" y="56" textAnchor="middle" className="fill-ink" fontSize="18" fontWeight="800">{levels.total}</text>
        <text x="60" y="72" textAnchor="middle" fontSize="8" fill="#64748b">signalements</text>
      </svg>
      <ul className="flex-1 space-y-1.5 text-xs">
        {levels.parts.length === 0 && (
          <li className="text-ink/50">Aucun signalement pour l'instant.</li>
        )}
        {levels.parts.map((p) => (
          <li key={p.n} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-ink/80">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: p.c || '#2e6e78' }} />
              {p.n}
            </span>
            <span className="font-bold text-ink">{p.v}</span>
          </li>
        ))}
        {(byType || []).slice(0, 4).map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-2 border-t border-brand-50 pt-1 text-ink/60">
            <span className="truncate">{typeLabel(t.id).toLowerCase()}</span>
            <span className="font-semibold">{t.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Le libellé des types est calculé plus bas via `typeLabel()` dans le composant.

function RegionMiniTable({ byRegion }) {
  const top = [...byRegion].sort((a, b) => b.count - a.count).slice(0, 8);
  return (
    <ul className="space-y-1.5 text-sm">
      {top.map((r) => (
        <li key={r.region} className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-2">
            <span className="inline-block h-3 w-3 shrink-0 rounded-sm" style={{ background: THREAT_COLORS[LEVEL_OF(r.count)] }} />
            <span className="truncate text-ink/80">{r.region}</span>
          </span>
          <span className="font-bold text-ink">{r.count}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [region, setRegion] = useState('');
  const [err, setErr] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastLoaded, setLastLoaded] = useState(null);

  async function load() {
    setRefreshing(true);
    try {
      setOverview(await api.admin('/overview'));
      setLastLoaded(Date.now());
      setErr(null);
    } catch (e) {
      setErr('Impossible de charger la vue d\'ensemble.');
    } finally {
      setRefreshing(false);
    }
  }
  useEffect(() => { load(); }, []);

  const countsForMap = overview?.byRegion ?? [];
  const counts = new Map((overview?.byRegion ?? []).map((r) => [r.region, r.count]));
  const total = overview?.stats?.total ?? 0;
  const selectedCount = region ? counts.get(region) ?? 0 : null;
  const selectedLevel = region ? LEVEL_OF(selectedCount) : null;

  const sevLabel = (s) => (s >= 3 ? { t: 'Haute priorité', c: 'bg-red-50 text-red-700 ring-red-200' }
    : s === 2 ? { t: 'Priorité moyenne', c: 'bg-orange-50 text-orange-700 ring-orange-200' }
    : { t: 'À surveiller', c: 'bg-green-50 text-green-700 ring-green-200' });

  return (
    <div className="space-y-5">
      {/* Rappel anonymat */}
      <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
        <Icon name="lock" size={16} className="mt-0.5 shrink-0" />
        <span>Rappel anonymat : zéro log nominatif. Aucune trace locale, aucune navigation n'est enregistrée (détails dans « Paramètres »).</span>
      </div>

      {/* Cartes de stats */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Signalements totaux" value={total}
          hint="Signalements stockés, strictement anonymes" />
        <StatCard label="Incidents ouverts" value={overview?.stats?.openIncidents ?? '—'}
          hint="Alertes externes en attente" accent={{ txt: 'relai anti-cybercrime en attente', cls: 'text-orange-600' }} />
        <StatCard label="Alertes externes" value={(overview?.stats?.alertsSent ?? 0) + (overview?.stats?.alertsQueued ?? 0)}
          hint={`${overview?.stats?.alertsSent ?? 0} envoyées · ${overview?.stats?.alertsQueued ?? 0} en file`}
          accent={{ txt: 'émission réussie', cls: 'text-green-600' }} />
        <StatCard label="Zones sous surveillance" value={overview?.stats?.zonesWatch ?? '—'}
          hint="Régions en orange ou rouge" />
      </div>
      {err && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">{err}</p>}

      {/* Où concentrer les moyens ? */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-ink">Où concentrer les moyens ?</h2>
            <p className="text-xs text-ink/50">Agrégation temps réel · Dernier point : {lastLoaded ? new Date(lastLoaded).toLocaleTimeString('fr-FR') : '…'}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={load} disabled={refreshing}
              className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100">
              <Icon name="refresh" size={13} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Actualisation…' : 'Actualiser'}
            </button>
            <Link to="/admin/espace/journal"
              className="rounded-full bg-brand-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-800">
              Voir journal
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr_240px]">
          {/* Donut par priorité */}
          <Donut byType={overview?.byType} byRegion={overview?.byRegion} />

          {/* Carte schématique interactive */}
          <div>
            <ThreatMap counts={countsForMap} selected={region} onSelect={setRegion} compact />
          </div>

          {/* Sélecteur régional + répartition */}
          <div className="space-y-4">
            <div className="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-700">Région sélectionnée</p>
              <select value={region} onChange={(e) => setRegion(e.target.value)}
                className="mt-1 w-full rounded-lg border border-brand-200 bg-white px-2 py-1.5 text-sm">
                <option value="">Toutes les régions</option>
                {REGIONS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
              {region && (
                <div className="mt-2">
                  <p className="flex items-center gap-2 text-sm font-bold text-ink">
                    {region} · <span className="inline-block h-3 w-3 rounded-full" style={{ background: THREAT_COLORS[selectedLevel] }} />
                    {selectedCount} cas — {THREAT_LABELS[selectedLevel]}
                  </p>
                  <p className="mt-1 text-xs text-ink/60">
                    Priorité de déploiement d'écoute : {selectedLevel >= 2 ? 'moyenne à haute' : 'veille normale'}.
                  </p>
                </div>
              )}
            </div>
            <div className="rounded-xl bg-white p-3 ring-1 ring-brand-100">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-700">Répartition des incidents</p>
              <RegionMiniTable byRegion={overview?.byRegion ?? []} />
            </div>
          </div>
        </div>
      </section>

      {/* Journal des ajustements (aperçu) */}
      <section className="rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
          <h2 className="text-lg font-bold text-ink">Journal des signalements</h2>
          <Link to="/admin/espace/journal" className="flex items-center gap-1 text-xs font-bold text-brand-700 underline underline-offset-2">
            Voir tout (journal complet)
            <Icon name="arrowRight" size={13} />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="bg-brand-50 text-xs uppercase tracking-wide text-brand-700">
                <th className="px-5 py-2">Heure</th>
                <th className="px-5 py-2">Types signalés</th>
                <th className="px-5 py-2">Région</th>
                <th className="px-5 py-2">Priorité</th>
                <th className="px-5 py-2">Plateformes</th>
                <th className="px-5 py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {!overview && (
                <tr><td colSpan="6" className="px-5 py-6 text-center text-ink/50">Chargement des signalements anonymisés…</td></tr>
              )}
              {(overview?.recent ?? []).map((rJun) => {
                const sev = sevLabel(rJun.severity);
                return (
                  <tr key={rJun.id} className="border-t border-brand-50 hover:bg-brand-50/50">
                    <td className="px-5 py-2.5 whitespace-nowrap font-mono text-xs text-ink/70">
                      {new Date(rJun.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-2.5">
                      <span className="font-mono text-xs font-bold text-ink">{rJun.id}</span>
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-ink/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {rJun.types.map(typeLabel).join(', ')}
                      </span>
                      {rJun.hasNote && <span className="ml-1 text-xs text-brand-600">· récit chiffré</span>}
                    </td>
                    <td className="px-5 py-2.5">{rJun.region}</td>
                    <td className="px-5 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${sev.c}`}>{sev.t}</span>
                    </td>
                    <td className="px-5 py-2.5 text-xs text-ink/70">{rJun.platforms.join(', ') || '—'}</td>
                    <td className="px-5 py-2.5 text-xs">
                      {rJun.alertStatus === 'sent' && <span className="rounded-full bg-green-50 px-2 py-0.5 font-semibold ring-1 ring-green-200">Transmis</span>}
                      {rJun.alertStatus === 'queued' && <span className="rounded-full bg-orange-50 px-2 py-0.5 font-semibold ring-1 ring-orange-200">En attente</span>}
                      {rJun.alertStatus === 'none' && <span className="text-ink/40">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Relais externes */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-ink">Sollicitations — structures d'aide</h2>
            <p className="text-xs text-ink/50">Relais anonymes utilisables par les jeunes · statut de transmission vérifiable</p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-200">
            {(overview?.stats?.alertsQueued ?? 0)} en file · {(overview?.stats?.alertsSent ?? 0)} transmises
          </span>
        </div>
        <ul className="space-y-2">
          {(overview?.alerts ?? []).map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-brand-50/60 px-3 py-2 ring-1 ring-brand-100">
              <span className="text-sm text-ink">
                <span className="font-mono text-xs font-bold text-brand-700">{a.id}</span>
                <Icon name="arrowRight" size={12} className="mx-2 inline align-middle text-ink/40" />
                {a.resource}
                <span className="ml-2 text-xs text-ink/50">dossier {a.reportId}</span>
              </span>
              <span className={'rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 '
                + (a.status === 'sent' ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-orange-50 text-orange-700 ring-orange-200')}>
                {a.status === 'sent' ? 'Transmise' : "File d'attente"}
              </span>
            </li>
          ))}
          {(overview?.alerts ?? []).length === 0 && (
            <li className="text-sm text-ink/50">Aucune sollicitation externe en file pour l'instant.</li>
          )}
        </ul>
        <p className="mt-3 flex items-start gap-2 text-xs text-ink/50">
          <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
          <span>On ne déclenche d'alerte externe que pour les cas potentiellement graves (chantage, sextorsion, revenge porn). Le récit chiffré reste dans le journal jusqu'à l'accusé de réception.</span>
        </p>
      </section>
    </div>
  );
}
