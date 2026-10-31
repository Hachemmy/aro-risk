import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader.jsx';
import Icon from '../components/Icon.jsx';
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

  // Seules deux étapes sont obligatoires (types + région) : le récit et les
  // plateformes restent facultatifs. La progression doit refléter cela.
  const requiredDone = (types.size ? 1 : 0) + (region ? 1 : 0);
  const remaining = 2 - requiredDone;
  const piiSpotted = useMemo(
    () => (PII_PHONE.test(note) || PII_MAIL.test(note) ? true : false),
    [note]
  );
  const canSend = types.size > 0 && Boolean(region) && !sending;
  const missing = [
    !types.size ? 'le type de situation' : null,
    !region ? 'ta région' : null,
  ].filter(Boolean);

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

  function startOver() {
    setResult(null);
    setTypes(new Set());
    setPlatforms(new Set());
    setRegion('');
    setNote('');
    setError(null);
    window.scrollTo({ top: 0 });
  }

  // ── Écran de confirmation (aucune donnée conservée en local) ──
  if (result) {
    return (
      <div className="min-h-full bg-skyform">
        <PublicHeader />
        <main className="mx-auto max-w-2xl px-4 py-10">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-100 sm:p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <Icon name="check" size={26} strokeWidth={2.5} className="text-green-700" />
            </div>
            <h1 className="text-center text-2xl font-bold text-brand-800">Signal envoyé, anonymement</h1>
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

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              <Icon name="alert" size={16} className="mt-0.5 shrink-0 text-amber-700" />
              <span>{result.hint}</span>
            </p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Link to="/confort" className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-3 text-center font-semibold text-white hover:bg-brand-800">
                Prendre un moment pour toi
                <Icon name="arrowRight" size={16} />
              </Link>
              <button type="button" onClick={startOver}
                className="rounded-xl bg-white px-4 py-3 text-center font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
                Nouveau signalement
              </button>
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
          <p className="text-xs font-bold uppercase tracking-wider text-brand-500">Anonyme · Sans compte · Sans trace</p>
          <h1 className="text-2xl font-bold text-brand-800 sm:text-3xl">Signale ce qui t'arrive</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/70">
            Ce formulaire est pour toi, au lycée ou en dehors. Raconte ce que tu vis ou ce que tu as vu :
            il n'y a pas de bonne ou de mauvaise réponse, et parler est déjà un grand pas.
            On ne te demande ni ton nom, ni ton e-mail, ni ton numéro, ni où tu te trouves.
          </p>
          <p className="mt-2 max-w-3xl text-xs leading-relaxed text-ink/55">
            <span className="font-semibold text-brand-700">Des exemples ?</span> Insultes dans le groupe de classe,
            photo partagée sans ton accord, faux compte à ton nom, menaces pour obtenir une photo…
          </p>
        </div>

        {/* Progression mobile : le panneau latéral est en bas sur téléphone. */}
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-brand-100 lg:hidden">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-100">
            <div className="h-full rounded-full bg-brand-700 transition-all" style={{ width: `${(requiredDone / 2) * 100}%` }} />
          </div>
          <span className="shrink-0 text-xs font-semibold text-brand-700">{requiredDone}/2 obligatoires</span>
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
                  Qu'est-ce qui t'arrive ?
                </h2>
                <span className="text-xs font-medium text-ink/50">Obligatoire · plusieurs choix possibles</span>
              </div>
              <p className="mb-4 ml-9 text-xs text-ink/50">Coche tout ce qui ressemble à ta situation.</p>
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
              {types.size === 0 && <p className="mt-2 ml-9 text-xs text-red-600">* Choisis au moins une case pour continuer.</p>}
            </fieldset>

            {/* ÉTAPE 2 — se vider */}
            <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <legend className="sr-only">Étape 2 — se vider</legend>
              <h2 className="text-lg font-bold text-brand-800">
                <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">02</span>
                Se vider
                <span className="ml-2 text-xs font-medium text-ink/50">Facultatif</span>
              </h2>
              <p className="mb-3 ml-9 text-xs text-ink/50">Écris ici ton histoire, comme tu veux — aucun mot n'est obligatoire.</p>

              <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
                <Icon name="alert" size={15} className="mt-0.5 shrink-0 text-amber-700" />
                <span>
                  Pour ta sécurité, <strong>n'indique pas ton nom, ton adresse, ton lycée, ni tes identifiants personnels</strong> (téléphone, e-mail, mot de passe, etc.).
                  On a seulement besoin de ce que tu ressens.
                </span>
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
                <span className="flex items-center gap-1.5">
                  {piiSpotted && <Icon name="lightbulb" size={13} className="shrink-0 text-amber-600" />}
                  {piiSpotted ? 'Petit conseil : un numéro ou un e-mail semble présent — tu peux le retirer, tu n\'as rien à prouver.' : 'Ton récit est chiffré avant d\'être stocké.'}
                </span>
                <span>{note.length} / {MAX_NOTE}</span>
              </div>
            </fieldset>

            {/* ÉTAPE 3 — plateformes */}
            <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <legend className="sr-only">Étape 3 — plateformes</legend>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-800">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">03</span>
                  C'est arrivé sur quelle plateforme ?
                </h2>
                <span className="text-xs font-medium text-ink/50">Facultatif · plusieurs choix possibles</span>
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
              <p className="mt-2 text-xs text-ink/50">Tu ne sais pas, ou tu préfères ne pas le dire ? Tu peux laisser vide.</p>
            </fieldset>

            {/* ÉTAPE 4 — région */}
            <fieldset className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <legend className="sr-only">Étape 4 — région</legend>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-lg font-bold text-brand-800">
                  <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">04</span>
                  Tu es dans quelle région ?
                </h2>
                <span className="text-xs font-medium text-ink/50">Obligatoire · un seul choix</span>
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="mt-2 w-full rounded-xl border border-brand-200 bg-white p-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
              >
                <option value="">Choisir une région…</option>
                {REGIONS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </select>
              {!region && <p className="mt-2 text-xs text-red-600">* Choisis une région pour continuer.</p>}
              <p className="mt-2 text-xs text-ink/50">
                La région sert seulement à voir où les jeunes ont besoin d'aide — jamais à te localiser.
              </p>
            </fieldset>

            {/* Envoi */}
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-brand-100">
              <ul className="mb-4 grid gap-1.5 text-xs text-ink/60">
                <li className="flex items-start gap-2">
                  <Icon name="send" size={14} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>Aucune conservation de l'adresse : ton signalement est envoyé puis plus rien ne reste sur cet appareil.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="lock" size={14} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>Pas de nom ni d'e-mail demandé, pas de géolocalisation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>Ton texte est chiffré (AES-256) et isolé des autres réponses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Icon name="message" size={14} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>Écris en malagasy ou en français, comme tu veux.</span>
                </li>
              </ul>
              {error && <p className="mb-3 rounded-lg bg-red-50 p-2.5 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}
              {!canSend && !sending && missing.length > 0 && (
                <p className="mb-2 text-sm font-semibold text-brand-700">
                  Il manque encore : {missing.join(' et ')}.
                </p>
              )}
              <button type="button" onClick={submit} disabled={!canSend}
                className={'flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-base font-bold transition '
                  + (canSend ? 'bg-brand-700 text-white hover:bg-brand-800' : 'cursor-not-allowed bg-brand-100 text-brand-700/50')}>
                <Icon name={sending ? 'refresh' : 'send'} size={16} className={sending ? 'animate-spin' : ''} />
                {sending ? 'Envoi sécurisé…' : 'Envoyer mon signalement (anonyme)'}
              </button>
              <p className="mt-2 text-center text-xs text-ink/50">En envoyant, tu aides à mieux protéger les jeunes de ta région. Rien de personnel n'est conservé.</p>
            </div>
          </div>

          {/* ─────────── Colonne droite : aide pendant le remplissage ─────────── */}
          <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl bg-brand-700 p-4 text-white shadow-sm">
              <p className="flex h-8 items-center text-2xl font-bold">
                {remaining === 0 ? <Icon name="checkCircle" size={26} strokeWidth={2.5} /> : remaining}
              </p>
              <p className="text-sm text-brand-100">
                {remaining === 0
                  ? 'Tu peux envoyer maintenant'
                  : `étape${remaining > 1 ? 's' : ''} obligatoire${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}`}
              </p>
              <p className="mt-1 text-[11px] text-brand-100/70">
                Le récit et les plateformes sont facultatifs.
              </p>
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
              <Link to="/confort" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-brand-700 underline underline-offset-2">
                Confort &amp; retour au calme
                <Icon name="arrowRight" size={12} />
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
