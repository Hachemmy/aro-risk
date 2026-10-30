import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader.jsx';
import { INCIDENT_TYPES, PLATFORMS, REGIONS } from '../data/reference.js';
import { api } from '../lib/api.js';

// Détection optionnelle de traces personnelles dans le texte libre
// (numéro malgache, e-mail) — simple rappel gentil, jamais de blocage.
const PII_PHONE = /(\+?261|\b0)[3-5][\d\s.-]{7,11}/;
const PII_MAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const MAX_NOTE = 2000;

export default function Report() {
  const [types, setTypes] = useState(() => new Set());
  const [note, setNote] = useState('');
  const [platforms, setPlatforms] = useState(() => new Set());
  const [region, setRegion] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const doneCount = (types.size ? 1 : 0) + (note.trim().length ? 1 : 0) + (platforms.size ? 1 : 0) + (region ? 1 : 0);
  const remaining = 4 - doneCount;
  const piiSpotted = useMemo(
    () => (PII_PHONE.test(note) || PII_MAIL.test(note) ? true : false),
    [note]
  );
  const canSend = doneCount >= 3 && types.size > 0 && region && !sending;

  const toggle = (set, val, setter) => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    setter(next);
  };

  async function submit() {
    if (!canSend) return;
    setSending(true); setError(null);
    try {
      const res = await api.sendReport({
        types: [...types],
        platforms: [...platforms],
        region,
        note: note.trim(),
      });
      setResult(res);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.status === 429
        ? 'Trop d\'envois d\'un coup. Attends un moment puis réessaie.'
        : 'Impossible d\'envoyer pour l\'instant. Vérifie ta connexion internet.');
    } finally {
      setSending(false);
    }
  }

  // ── Écran de confirmation (aucune donnée conservée en local) ──
  if (result) {
    return (
      <div className="min-h-full bg-skyform">
        <PublicHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-100 sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </div>
            <h1 className="text-center text-2xl font-bold text-brand-800">Signal envoyé, anonymement 🛡️</h1>
            <p className="mt-2 text-center text-ink/70">
              Ton signalement est enregistré sans aucun nom, numéro, ni adresse.
              Il rejoint maintenant la carte des zones à risque pour protéger d'autres jeunes.
            </p>

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
                <dt className="font-semibold text-brand-700">Référence</dt>
                <dd className="font-mono text-ink">{result.reference}</dd>
              </div>
              <div className="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
                <dt className="font-semibold text-brand-700">Relais externe</dt>
                <dd className="text-ink">
                  {result.alert
                    ? <span className="font-semibold text-orange-600">Alerte transmise (cas grave)</span>
                    : 'Non nécessaire pour ce type de cas'}
                </dd>
              </div>
            </dl>

            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              ⚠️ {result.hint}
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link to="/confort" className="flex-1 rounded-xl bg-brand-700 px-4 py-3 text-center font-semibold text-white hover:bg-brand-800">
                Prendre un moment pour toi →
              </Link>
              <Link to="/" className="rounded-xl bg-white px-4 py-3 text-center font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
                Nouveau signalement
              </Link>
            </div>
            <p className="mt-4 text-center text-xs text-ink/50">
              Rien n'a été enregistré sur ce téléphone : effacer ton historique n'est pas nécessaire.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-skyform">
      <PublicHeader />

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:pb-16">
        {/* Titre de page */}
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-500">Sécurisé · Anonyme</p>
          <h1 className="text-2xl font-bold text-brand-800 sm:text-3xl">Signalisation Sécurisée</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/70">
            Utilisez ce formulaire sécurisé pour signaler ce que vous vivez ou avez vu. Il n'y a pas de mauvais mot — parler est déjà un grand pas. Le formulaire est pensé pour tout le monde, dès 12 ans, et ne recueille rien de personnel : ni nom, ni e-mail, ni téléphone, ni géolocalisation.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* ─────────── Colonne principale : 4 sections ─────────── */}
          <div className="space-y-4">
            {/* ÉTAPE 1 */}
            <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <legend className="sr-only">Étape 1 — ce qui vous arrive</legend>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-800">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">01</span>
                  Qu'est-ce qui vous arrive ?
                </h2>
                <span className="text-xs font-medium text-ink/50">Sélection unique ou multiple</span>
              </div>
              <p className="mb-4 ml-9 text-xs text-ink/50">Cochez tout ce qui se rapproche de votre situation.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {INCIDENT_TYPES.map((t) => (
                  <label key={t.id}
                    className={'flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 text-sm transition '
                      + (types.has(t.id) ? 'border-brand-500 bg-brand-50 font-semibold text-brand-800' : 'border-brand-100 bg-white text-ink/80 hover:border-brand-300')}>
                    <input type="checkbox" className="mt-0.5 h-4 w-4 accent-brand-700"
                      checked={types.has(t.id)} onChange={() => toggle(types, t.id, setTypes)} />
                    <span>{t.label}</span>
                  </label>
                ))}
              </div>
              {types.size === 0 && <p className="mt-2 ml-9 text-xs text-red-600">* Cette étape est obligatoire.</p>}
            </fieldset>

            {/* ÉTAPE 2 — se vider */}
            <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <legend className="sr-only">Étape 2 — se vider</legend>
              <h2 className="text-lg font-bold text-brand-800">
                <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">02</span>
                Se vider
                <span className="ml-2 text-xs font-medium text-ink/50">Facultatif</span>
              </h2>
              <p className="mb-3 ml-9 text-xs text-ink/50">Écrivez ici votre histoire, à votre façon — sans mot obligatoire.</p>

              <div className="rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
                ⚠️ Pour votre sécurité, <strong>n'indiquez pas de nom, ni d'adresse, ni d'école / université, ni d'identifiants personnels</strong> (téléphone, e-mail, mot de passe, etc.).
                Nous n'avons besoin que de ce que vous ressentez.
              </div>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE))}
                rows={5}
                maxLength={MAX_NOTE}
                placeholder="Prends ton temps, cet espace est à toi et rien qu'à toi."
                className="mt-3 w-full resize-y rounded-xl border border-brand-100 p-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              />
              <div className="flex items-center justify-between text-xs text-ink/50">
                <span>{piiSpotted ? '💡 petit conseil : un numéro ou un e-mail semble présent — tu peux le retirer, tu n\'as rien à prouver.' : 'Ton récit est chiffré avant d\'être stocké.'}</span>
                <span>{note.length} / {MAX_NOTE}</span>
              </div>
            </fieldset>

            {/* ÉTAPE 3 — plateformes */}
            <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <legend className="sr-only">Étape 3 — plateformes</legend>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-800">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">03</span>
                  Sur quelle plateforme ?
                </h2>
                <span className="text-xs font-medium text-ink/50">Sélection multiple</span>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {PLATFORMS.map((p) => (
                  <label key={p.id}
                    className={'flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-sm transition '
                      + (platforms.has(p.id) ? 'border-brand-500 bg-brand-50 font-semibold text-brand-800' : 'border-brand-100 hover:border-brand-300')}>
                    <input type="checkbox" className="h-4 w-4 accent-brand-700"
                      checked={platforms.has(p.id)} onChange={() => toggle(platforms, p.id, setPlatforms)} />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {/* ÉTAPE 4 — région */}
            <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <legend className="sr-only">Étape 4 — région</legend>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-800">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">04</span>
                  Dans quelle région ?
                </h2>
                <span className="text-xs font-medium text-ink/50">Sélection unique</span>
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-white p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                <option value="">Choisir une région…</option>
                {REGIONS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
              <p className="mt-2 text-xs text-ink/50">
                La région sert uniquement à cartographier les zones à risque — jamais pour te localiser.
              </p>
            </fieldset>

            {/* Envoi */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <ul className="mb-4 grid gap-1.5 text-xs text-ink/60">
                <li>📤 Aucune conservation de l'adresse : ton signalement est envoyé puis plus rien ne reste sur cet appareil.</li>
                <li>🔒 Pas de nom ni d'e-mail demandé, pas de géolocalisation.</li>
                <li>🛡️ Ton texte est chiffré (AES-256) et isolé des autres réponses.</li>
                <li>🗣️ Écris en malagasy ou en français, comme tu veux.</li>
              </ul>
              {error && <p className="mb-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}
              <button type="button" onClick={submit} disabled={!canSend}
                className={'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-bold transition '
                  + (canSend ? 'bg-brand-700 text-white hover:bg-brand-800' : 'cursor-not-allowed bg-brand-100 text-brand-700/50')}>
                {sending ? 'Envoi sécurisé…' : '✈ Envoyer de façon anonyme et sécurisée'}
              </button>
              <p className="mt-2 text-center text-xs text-ink/50">En envoyant, tu acceptes que ces infos techniques servent à protéger d'autres jeunes.</p>
            </div>
          </div>

          {/* ─────────── Colonne droite : aide pendant le remplissage ─────────── */}
          <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl bg-brand-700 p-4 text-white shadow-sm">
              <p className="text-2xl font-bold">{remaining === 0 ? '🎉' : remaining}</p>
              <p className="text-sm text-brand-100">{remaining === 0 ? 'Tu peux envoyer maintenant' : `étape${remaining > 1 ? 's' : ''} avant envoi`}</p>
              <ul className="mt-3 space-y-1.5 text-xs text-brand-100/90">
                <li>· Téléphone partagé ? Pense à fermer l'onglet après l'envoi, ou appuie sur « Quitter ».</li>
                <li>· Rien n'est installé sur cet appareil, ni suivi à distance.</li>
                <li>· Envoi remplace l'historique : on ne garde aucune trace de cette page.</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
              <p className="mb-1 text-sm font-bold text-brand-800">Utilises-tu un appareil partagé ?</p>
              <p className="text-xs leading-relaxed text-ink/70">
                Après l'envoi, appuie sur <strong>Quitter</strong> : cette page sera remplacée par une page neutre (météo), sans garder d'historique.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink/70">
                Tu peux aussi appuyer 3 fois sur <kbd className="rounded bg-brand-50 px-1">Échap</kbd> en moins d'une seconde et demie.
              </p>
            </div>

            <div className="rounded-2xl bg-sand p-4 shadow-sm ring-1 ring-amber-200">
              <p className="text-sm font-bold text-amber-900">Tu as déjà fait le plus dur.</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-900/80">
                Si tout se bouscule en toi, c'est normal : l'écran Confort est un espace calme, rien que pour toi — à ton rythme.
              </p>
              <Link to="/confort" className="mt-2 inline-block text-xs font-bold text-brand-700 underline underline-offset-2">
                Confort &amp; retour au calme →
              </Link>
            </div>
          </aside>
        </div>

        <footer className="mt-10 border-t border-brand-100 pt-4 text-center text-xs text-ink/50">
          ARO · Signalement sécurisé pour les jeunes à Madagascar &nbsp;·&nbsp;
          <Link to="/confort" className="underline">Confort</Link>
          &nbsp;·&nbsp;
          <Link to="/admin" className="underline">Espace administrateur</Link>
        </footer>
      </main>
    </div>
  );
}
