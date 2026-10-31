import { useEffect, useState } from 'react';
import Icon from '../components/Icon.jsx';
import { api } from '../lib/api.js';

// ─────────────────────────────────────────────────────────────────────────────
// Onglet 3 — Paramètres techniques (menu minimaliste, 3 onglets max).
// Outils : purge de rétention, export CSV,
// rappel des mesures d'anonymat actives côté serveur.
// ─────────────────────────────────────────────────────────────────────────────

const ANON_MEASURES = [
  'Aucune adresse IP persistée : les compteurs anti-abus sont éphémères, en RAM uniquement.',
  'Aucun pistage de cookie : un seul cookie HttpOnly SameSite=Lax (session console, 2 h max).',
  'Aucune indexation : en-têtes X-Robots-Tag noindex, nofollow, noarchive sur toutes les réponses.',
  'Aucune persistance locale : le stockage du navigateur (localStorage/IndexedDB) n\'est jamais utilisé.',
  'En-têtes no-store + no-referrer : rien des écrans ne reste sur un appareil partagé.',
  'Base de données : uniquement { types, plateformes, région, horodatage, gravité } + récit chiffré AES-256-GCM.',
];

export default function Parametres() {
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [db, setDb] = useState(null);

  useEffect(() => {
    api.admin('/db-info').then(setDb).catch(() => setDb(null));
  }, []);

  async function run(label, fn) {
    setBusy(label);
    setMsg(null);
    try {
      const res = await fn();
      setMsg({ ok: true, text: typeof res === 'string' ? res : JSON.stringify(res) });
    } catch (e) {
      setMsg({ ok: false, text: e.message || 'Erreur inconnue.' });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {msg && (
        <p className={'rounded-xl p-3 text-sm ring-1 ' + (msg.ok
          ? 'bg-green-50 text-green-800 ring-green-200'
          : 'bg-red-50 text-red-700 ring-red-200')}>
          {msg.text}
        </p>
      )}

      {/* Disponibilité des données */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Icon name="database" size={18} className="text-brand-600" />
            Protection des données
          </h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700 ring-1 ring-green-100">
            <Icon name="check" size={12} />
            {db?.keyExists ? 'Protection active' : 'En vérification'}
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-ink/60">
          Les informations enregistrées sont stockées de manière persistante et leurs contenus sensibles sont chiffrés.
        </p>

        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-brand-50 p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink/50">Signalements</dt>
            <dd className="text-xl font-bold text-brand-800">{db?.reports ?? '—'}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink/50">Alertes</dt>
            <dd className="text-xl font-bold text-brand-800">{db?.alerts ?? '—'}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 p-3">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink/50">Sauvegarde</dt>
            <dd className="mt-1 text-sm font-bold text-brand-800">Disponible</dd>
          </div>
        </dl>

        <a href="/api/admin/db-backup" download
           className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
          <Icon name="download" size={15} />
          Télécharger une sauvegarde
        </a>
      </section>

      {/* Mesures d'anonymat */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-lg font-bold text-ink">Mesures d'anonymat actives (serveur)</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-ink/75">
          {ANON_MEASURES.map((m) => (
            <li key={m} className="flex gap-2">
              <Icon name="check" size={14} className="mt-0.5 shrink-0 text-green-600" />
              <span>{m}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 rounded-lg bg-brand-50 p-3 text-xs leading-relaxed text-brand-800 ring-1 ring-brand-100">
          Clé du récit chiffré : stockée hors base (fichier <code className="font-mono">server/data/.textkey</code>) — même en cas de fuite de la base, les récits restent illisibles. Pour la production : secret manager (vault), HTTPS obligatoire + HSTS.
        </p>
      </section>
    </div>
  );
}
