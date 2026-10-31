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
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.admin('/db-info').then(setDb).catch(() => setDb(null));
  }, []);

  async function copyPath() {
    if (!db?.hostPath) return;
    try {
      await navigator.clipboard.writeText(db.hostPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* presse-papiers indisponible */ }
  }

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

      {/* Base de données : emplacement réel + sauvegarde */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <Icon name="database" size={18} className="text-brand-600" />
            Stockage de la base de données
          </h2>
          <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-700 ring-1 ring-brand-100">
            Moteur : {db?.engine ?? '…'}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-ink/60">
          Les données sont centralisées dans une base persistante et protégée par chiffrement.
        </p>

        <div className="mt-3 rounded-xl bg-ink/[0.04] p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-ink/50">Emplacement du stockage</p>
          <code className="mt-1 block break-all font-mono text-sm font-bold text-brand-800">
            {db?.hostPath ?? '…'}
          </code>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-ink/50">
            <span>Clé de chiffrement : <span className="font-mono">{db?.keyHostPath ?? '…'}</span></span>
            {db && (db.keyExists ? (
              <span className="inline-flex items-center gap-0.5 text-green-700">
                <Icon name="check" size={12} />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-red-600">
                <Icon name="alert" size={12} />
                Indisponible
              </span>
            ))}
          </p>
          {db?.inDocker && (
            <p className="mt-1 text-[11px] text-ink/50">
              Dans le conteneur, ce même dossier est monté — chemin interne : <span className="font-mono">{db.containerPath}</span>
            </p>
          )}
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-brand-50 p-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink/50">Signalements</dt>
            <dd className="text-xl font-bold text-brand-800">{db?.reports ?? '—'}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 p-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink/50">Alertes</dt>
            <dd className="text-xl font-bold text-brand-800">{db?.alerts ?? '—'}</dd>
          </div>
          <div className="rounded-xl bg-brand-50 p-2">
            <dt className="text-[10px] font-bold uppercase tracking-wide text-ink/50">Taille</dt>
            <dd className="text-xl font-bold text-brand-800">
              {db ? (db.sizeBytes / 1024).toFixed(0) + ' Ko' : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-3 flex flex-wrap gap-2">
          <a href="/api/admin/db-backup" download
             className="flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-2 text-sm font-bold text-white hover:bg-brand-800">
            <Icon name="download" size={15} />
            Télécharger une copie
          </a>
          <button type="button" onClick={copyPath}
            className="flex items-center gap-1.5 rounded-full bg-brand-50 px-4 py-2 text-sm font-bold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-100">
            <Icon name={copied ? 'check' : 'copy'} size={15} />
            {copied ? 'Chemin copié' : 'Copier le chemin'}
          </button>
        </div>
        {db?.platform === 'win32' ? (
          <p className="mt-2 text-[11px] leading-relaxed text-ink/50">
            Astuce Windows : appuie sur <kbd className="rounded bg-white px-1 ring-1 ring-brand-100">Win + R</kbd>,
            colle <span className="font-mono">{db?.hostDataDir ?? '…'}</span> et valide — le dossier s'ouvre dans l'Explorateur.
            Le fichier <span className="font-mono">.textkey</span> est masqué par Windows : active « Éléments masqués ».
          </p>
        ) : (
          <p className="mt-2 text-[11px] leading-relaxed text-ink/50">
            Astuce : ouvre ce dossier dans ton gestionnaire de fichiers, ou lance
            <span className="ml-1 font-mono">xdg-open {db?.hostDataDir ?? '…'}</span>.
            Le fichier <span className="font-mono">.textkey</span> est un fichier caché (Ctrl+H).
          </p>
        )}
      </section>

      {/* Rétention & purge */}
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-lg font-bold text-ink">Rétention des données anonymes</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink/60">
          Le cahier des charges impose un stockage minimum. Purger les signalements les plus âgés garde la base utile et réduit tout risque futur.
          Valeur recommandée en production : 30 jours.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[7, 30, 90].map((d) => (
            <button key={d} type="button" disabled={busy !== null}
              onClick={() => run('purge', () => api.adminPost('/purge', { days: d }).then((r) => `${r.deleted.reports} signalement(s) et ${r.deleted.alerts} alerte(s) supprimés (rétention ${d} j).`))}
              className="rounded-full bg-brand-700 px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-50">
              Purger &gt; {d} jours
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
        <h2 className="text-lg font-bold text-ink">Export des données</h2>
        <p className="mt-1 text-xs leading-relaxed text-ink/60">
          Télécharge tous les incidents enregistrés au format CSV, compatible avec Excel.
        </p>
        <a href="/api/admin/export" download="aro-incidents.csv" target="_blank" rel="noreferrer"
           className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-700 px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-800">
          <Icon name="download" size={14} />
Télécharger tous les incidents
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
