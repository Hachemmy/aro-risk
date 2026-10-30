import { useEffect, useRef, useState } from 'react';
import PublicHeader from '../components/PublicHeader.jsx';
import { api } from '../lib/api.js';
import { REGIONS } from '../data/reference.js';

// ─────────────────────────────────────────────────────────────────────────────
// Écran 3 — Espace Réconfort & Divertissement.
// Modules : respiration guidée anti-stress + sons apaisants générés en direct
// par le navigateur (Web Audio) — aucun fichier téléchargé, aucune donnée
// stockée. Annuaire régional discret en bas de page (sans urgence imposée).
// ─────────────────────────────────────────────────────────────────────────────

const CITATIONS = [
  "Ce n'est pas ta faute. Tu as le droit d'en parler.",
  "Ce que tu ressens est légitime. Tu peux faire une pause, tout n'a pas besoin d'être réglé maintenant.",
  "Tu n'as pas besoin de prouver quoi que ce soit : être ici, c'est déjà du courage.",
  "Tu as le droit de dire non au bruit autour de toi et de choisir ton calme.",
  "Un pas lent reste un pas. Tu avances à ton rythme, pas à celui des autres.",
];

const ACTIONS = [
  {
    n: '01',
    t: 'Bloquer, c\u2019est se protéger',
    d: "Bloquer n'est pas se replier : c'est fermer la porte à ce qui blesse. Tu n'as pas l'obligation de répondre.",
  },
  {
    n: '02',
    t: 'Faire taire les notifications',
    d: "Archive ou Coupe les sons un moment : ça adoucit l'appareil et tu revois les messages quand TU choisis.",
  },
  {
    n: '03',
    t: 'Faire une pause, sans partir',
    d: "Partir définitivement, ce n'est pas ton unique option : une pause te laisse la force de repenser à ton rythme.",
  },
];

const SOUNDS = [
  { id: 'eau',    label: 'Eau légère',  kind: 'white' },
  { id: 'mer',    label: 'Mer calme',   kind: 'brown' },
  { id: 'pluvie', label: 'Pluie légère', kind: 'rain'  },
];

function useNoisePlayer() {
  const ctxRef = useRef(null);
  const nodesRef = useRef(null); // { src, filter, gain }
  const [playing, setPlaying] = useState(null);
  const [volume, setVolume] = useState(0.35);

  function stopAll() {
    if (nodesRef.current) {
      try { nodesRef.current.src.stop(); } catch { /* déjà arrêté */ }
      nodesRef.current = null;
    }
    setPlaying(null);
  }

  function play(id) {
    const sound = SOUNDS.find((s) => s.id === id);
    if (!sound) return;
    stopAll();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { setPlaying(id); return; } // environnement sans audio : démo visuelle
    if (!ctxRef.current) ctxRef.current = new AC();
    const ctx = ctxRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    // Bruit blanc / brun / pluie générés localement : rien n'est téléchargé.
    const dur = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < dur; i++) {
      if (sound.kind === 'brown') {
        const w = Math.random() * 2 - 1;
        last = (last + 0.02 * w) / 1.02;
        data[i] = last * 3.5;
      } else {
        data[i] = Math.random() * 2 - 1;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    if (sound.kind === 'rain')       { filter.type = 'bandpass'; filter.frequency.value = 1400; filter.Q.value = 0.6; }
    else if (sound.kind === 'brown') { filter.type = 'lowpass';  filter.frequency.value = 350; }
    else                             { filter.type = 'lowpass';  filter.frequency.value = 5200; }

    const gain = ctx.createGain();
    gain.gain.value = volume;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    nodesRef.current = { src, filter, gain };
    setPlaying(id);
  }

  function setVol(v) {
    setVolume(v);
    if (nodesRef.current?.gain) nodesRef.current.gain.gain.value = v;
  }

  useEffect(() => () => stopAll(), []);
  return { playing, play, stopAll, volume, setVol };
}

// ── Respiration guidée : inspire 4 s → garde 2 s → expire 6 s ──
function Breathing() {
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState('repos'); // repos | inspire | pause | expire
  const [cycles, setCycles] = useState(0);
  const timer = useRef(null);
  const startRef = useRef(0);

  useEffect(() => {
    if (!running) {
      clearTimeout(timer.current);
      return undefined;
    }
    const seq = [
      { name: 'inspire', ms: 4000 },
      { name: 'pause',   ms: 2000 },
      { name: 'expire',  ms: 6000 },
    ];
    let i = 0;
    const tick = () => {
      const p = seq[i % seq.length];
      if (p.name === 'inspire') {
        if (i > 0) setCycles((c) => c + 1);
      }
      setPhase(p.name);
      i++;
      timer.current = setTimeout(tick, p.ms);
    };
    startRef.current = Date.now();
    tick();
    return () => clearTimeout(timer.current);
  }, [running]);

  const circleClass = phase === 'inspire' ? 'breath-in' : phase === 'expire' ? 'breath-out' : 'breath-hold';
  const labels = {
    repos: 'Prêt·e quand tu veux',
    inspire: 'Inspire…',
    pause: "Garde l'air…",
    expire: 'Expire doucement…',
  };

  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Pause respiration</p>
        <button
          type="button"
          onClick={() => { setRunning(!running); if (!running) { setCycles(0); setPhase('inspire'); } else setPhase('repos'); }}
          className={'rounded-full px-4 py-1.5 text-sm font-bold transition '
            + (running ? 'bg-sand text-brand-800 ring-1 ring-amber-200' : 'bg-brand-700 text-white hover:bg-brand-800')}>
          {running ? '■ Arrêter' : '▶ Commencer'}
        </button>
      </div>
      <div className="mt-4 flex items-center gap-4">
        <div className="relative h-24 w-24 shrink-0">
          <div className={'absolute inset-0 rounded-full bg-brand-400/30 ' + circleClass} style={{ transformOrigin: 'center' }} />
          <div className={'absolute inset-3 rounded-full bg-brand-700 ' + circleClass} style={{ transformOrigin: 'center' }} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">{running ? labels[phase] : labels.repos}</p>
          <p className="text-xs text-ink/60">{running ? `Cycles terminés : ${cycles}` : 'Inspire 4 s · garde 2 s · expire 6 s.'}</p>
          <p className="text-xs text-ink/60">Installe-toi bien, les pieds au sol, sans forcer.</p>
        </div>
      </div>
    </div>
  );
}

export default function Comfort() {
  const [citationIdx, setCitationIdx] = useState(0);
  const [region, setRegion] = useState('Analamanga');
  const [resources, setResources] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const { playing, play, stopAll, volume, setVol } = useNoisePlayer();

  useEffect(() => {
    let ok = true;
    setLoadingRes(true);
    api.resources(region)
      .then((d) => { if (ok) setResources(d.resources || []); })
      .catch(() => { if (ok) setResources([]); })
      .finally(() => { if (ok) setLoadingRes(false); });
    return () => { ok = false; };
  }, [region]);

  return (
    <div className="min-h-full bg-cream">
      <PublicHeader />

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pb-16">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-500">Un espace à toi · sans jugement, sans compte, sans trace</p>
        <h1 className="mb-4 text-2xl font-bold text-brand-800 sm:text-3xl">Confort &amp; Divertissement</h1>

        {/* Message de validation et de déculpabilisation */}
        <section className="grid gap-5 sm:grid-cols-[1fr_290px]">
          <div className="relative overflow-hidden rounded-3xl bg-sand p-6 sm:p-8">
            <div className="max-w-lg">
              <h2 className="text-2xl font-bold text-ink">Ce n'est pas ta faute. Tu as le droit d'en parler.</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/70">
                Ce que tu ressens est légitime. Tu peux faire une pause, chercher de l'écoute, ou simplement prendre un moment pour toi.
              </p>
              <p className="mt-4 text-xs text-ink/60">👉 Une respiration lente, le temps de t'évader.</p>
            </div>
            <svg viewBox="0 0 160 160" className="pointer-events-none absolute -right-2 -top-4 h-40 w-40 opacity-90" aria-hidden="true">
              <circle cx="80" cy="80" r="70" fill="#e7d9c5" />
              <circle cx="110" cy="52" r="34" fill="#f6e8d2" />
              <path d="M20 130 Q 60 96 96 118 T 150 120 L150 160 L20 160 Z" fill="#9dbb8f" />
              <path d="M46 118 q 8 -26 24 -34 q -2 26 -16 40 z" fill="#65886a" />
            </svg>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Le savais-tu ?</p>
              <p className="mt-1 text-sm font-semibold text-ink">
                1 jeune sur 4 déclare avoir déjà vécu du harcèlement en ligne.
              </p>
              <p className="mt-2 text-xs text-ink/60">Tu n'es pas seul·e et ce n'est pas une faiblesse de le dire.</p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Sécurise tes comptes</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/65">
                Mot de passe unique, double validation d'accès, liste d'amis restreinte : de quoi passer une nuit sereine.
              </p>
            </div>
          </div>
        </section>

        {/* Reprendre le contrôle */}
        <section className="mt-8">
          <h3 className="mb-3 text-lg font-bold text-brand-800">Reprendre un peu de contrôle</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {ACTIONS.map((a) => (
              <article key={a.n} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-brand-100">
                <p className="text-xs font-bold text-brand-500">{a.n}</p>
                <h4 className="mt-1 font-bold text-ink">{a.t}</h4>
                <p className="mt-1 text-xs leading-relaxed text-ink/65">{a.d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Pause active : respiration + citation */}
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold text-brand-800">Prendre une pause active</h3>
            <p className="text-xs text-ink/50">Rien d'obligatoire : à ton rythme, comme tu veux.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
            <Breathing />

            <div className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
              <p className="text-xs font-bold uppercase tracking-wide text-brand-600">Une citation bienveillante</p>
              <div className="mt-3 rounded-lg bg-sand p-3 text-sm font-medium text-ink">
                « {CITATIONS[citationIdx]} »
              </div>
              <p className="mt-2 text-xs text-ink/60">Une phrase simple à te répéter quand la journée pèse.</p>
              <button
                type="button"
                onClick={() => setCitationIdx((i) => (i + 1) % CITATIONS.length)}
                className="mt-3 rounded-full bg-brand-700 px-4 py-1.5 text-sm font-bold text-white hover:bg-brand-800">
                ↺ Une citation bienveillante
              </button>
            </div>
          </div>
        </section>

        {/* Sons apaisants */}
        <section className="mt-8">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-lg font-bold text-brand-800">Sons apaisants</h3>
            <p className="text-xs text-ink/50">Aucun téléchargement : le bruit est créé par ton appareil, en direct.</p>
          </div>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
            <ul>
              {SOUNDS.map((s, vi) => (
                <li key={s.id}>
                  <div className={'flex items-center gap-3 p-3 ' + (vi > 0 ? 'border-t border-brand-100' : '')}>
                    <button
                      type="button"
                      onClick={() => (playing === s.id ? stopAll() : play(s.id))}
                      className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition '
                        + (playing === s.id ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700 ring-1 ring-brand-200 hover:bg-brand-100')}
                      aria-label={(playing === s.id ? 'Arrêter ' : 'Écouter ') + s.label}>
                      {playing === s.id ? '■' : '▶'}
                    </button>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-ink">{s.label}</p>
                      <p className="text-xs text-ink/50">{playing === s.id ? 'En lecture — règle le volume à droite' : 'Prends le temps qu\'il te faut'}</p>
                    </div>
                    <input
                      type="range" min="0" max="1" step="0.01" value={volume}
                      onChange={(e) => setVol(Number(e.target.value))}
                      className="w-28 accent-brand-700"
                      aria-label={'Volume ' + s.label}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-2 text-xs text-ink/50">Ton niveau de volume n'est pas enregistré : aucune trace après ta visite.</p>
        </section>

        {/* Annuaire régional discret */}
        <section className="mt-10">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-lg font-bold text-brand-800">Annuaire régional — si tu choisis d'en parler à quelqu'un</h3>
              <p className="text-xs text-ink/50">Personne ne viendra vers toi sans ton accord. Consulter cette liste ne crée aucun signalement.</p>
            </div>
            <select value={region} onChange={(e) => setRegion(e.target.value)}
              className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm">
              {REGIONS.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {loadingRes && <p className="text-sm text-ink/60">Chargement…</p>}
            {!loadingRes && resources.length === 0 && (
              <p className="text-sm text-ink/60">
                Aucune structure référencée pour cette région pour l'instant : les contacts nationaux restent disponibles.
              </p>
            )}
            {resources.map((r) => (
              <article key={r.id} className="rounded-xl bg-white p-4 ring-1 ring-brand-100">
                <p className="text-sm font-bold text-brand-800">{r.name}</p>
                <p className="text-xs text-ink/60">{r.role}</p>
                <p className="mt-2 text-xs text-ink">
                  <span className="font-semibold">Contact :</span> <span className="font-mono">{r.contact}</span>
                </p>
                <p className="text-xs text-ink/60">{r.hours}</p>
                {r.national && (
                  <p className="mt-1 inline-block rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">National</p>
                )}
              </article>
            ))}
          </div>
        </section>

        {/* Bandeau bas */}
        <div className="mt-10 rounded-xl bg-sand px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
          📵 S'il y a un danger immédiat, n'hésite pas à fermer l'appareil et à parler à un adulte de confiance.
          Le bouton « Quitter » remet une page neutre, sans garder l'historique de cette page.
        </div>

        <footer className="mt-6 text-center text-xs text-ink/50">
          ARO · Un espace apaisant pour les jeunes de Madagascar &nbsp;·&nbsp;
          <a href="/" className="underline">Faire un signalement</a>
          &nbsp;·&nbsp;Confort &amp; Divertissement &nbsp;·&nbsp;Version 1.0
        </footer>
      </main>
    </div>
  );
}
