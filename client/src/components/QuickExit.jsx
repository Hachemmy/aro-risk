import { useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Sortie rapide — bouton PERMANENT en haut à droite (public + console).
//  1) clic → remplace l'historique par une page neutre (météo) via location.replace
//  2) 3 appuis sur Échap en moins de 1,5 s → même effet
// Aucune trace du formulaire ne reste : sessionStorage est purgé avant la fuite.
// ─────────────────────────────────────────────────────────────────────────────
const NEUTRAL_URL = 'https://www.google.com/search?q=' + encodeURIComponent('météo Antananarivo');

export default function QuickExit({ compact = false }) {
  const taps = useRef(0);
  const lastTap = useRef(0);

  function leaveNow() {
    try { sessionStorage.clear(); } catch { /* rien à purger */ }
    window.location.replace(NEUTRAL_URL);
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      const now = Date.now();
      taps.current = now - lastTap.current < 1500 ? taps.current + 1 : 1;
      lastTap.current = now;
      if (taps.current >= 3) leaveNow();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <button
      type="button"
      onClick={leaveNow}
      title="Sortir immédiatement vers une page neutre (ou Échap ×3)"
      className={
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition '
        + (compact
          ? 'bg-white/10 text-white hover:bg-brand-600'
          : 'bg-brand-700 text-white hover:bg-brand-800')
      }
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <rect x="4" y="10" width="16" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0" />
      </svg>
      Quitter
    </button>
  );
}
