import { useMemo } from 'react';
import { REGIONS, MAP_ROWS, THREAT_COLORS, THREAT_LABELS, LEVEL_OF } from '../data/reference.js';

// ─────────────────────────────────────────────────────────────────────────────
// Carte SCHÉMATIQUE interactive « MADAGASCAR — Carte schématique des 24 régions » :
// chaque région est une fichette cliquable (numéro officiel + nom + nombre de
// cas) colorée selon la légende :
//   Vert clair 0-5 · Jaune 6-15 · Orange 16-30 · Rouge +30 cas.
// Aucune géolocalisation : uniquement des valeurs agrégées du backend.
// ─────────────────────────────────────────────────────────────────────────────
const CHIP_BG = [
  'bg-[#e7f4e2] text-ink border-[#cde3c6]',       // vert clair 0-5
  'bg-[#fdf3b8] text-ink border-[#e6d97e]',       // jaune 6-15
  'bg-[#fb923c] text-white border-[#d97017]',     // orange 16-30
  'bg-[#ef4444] text-white border-[#c22b2b]',     // rouge +30
];

export default function ThreatMap({ counts, selected, onSelect, compact = false }) {
  const byRegion = useMemo(() => {
    const m = new Map();
    for (const r of REGIONS) {
      const hit = counts?.find((c) => c.region === r.name);
      m.set(r.name, hit ? hit.count : 0);
    }
    return m;
  }, [counts]);

  const top = useMemo(() =>
    REGIONS.map((r) => ({ name: r.name, count: byRegion.get(r.name) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  [byRegion]);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-2xl bg-[#f4faf2] ring-1 ring-brand-100">
        {/* Bandeau-titre de la carte */}
        <div className="bg-[#dcebd6] px-3 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-brand-800">
          MADAGASCAR — Carte schématique des 24 régions
        </div>

        <div className={'overflow-x-auto px-3 ' + (compact ? 'py-2.5' : 'py-4')}>
          <div className="mx-auto flex max-w-md flex-col gap-1.5">
            {MAP_ROWS.map((row, i) => (
              <div key={i} className="flex items-stretch justify-center gap-1.5">
                {row.map((n) => {
                  const reg = REGIONS.find((r) => r.n === n);
                  const count = byRegion.get(reg.name) ?? 0;
                  const lvl = LEVEL_OF(count);
                  const isSel = selected === reg.name;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => onSelect?.(reg.name)}
                      title={`${reg.name} — ${count} cas · ${THREAT_LABELS[lvl]}`}
                      className={
                        'flex w-[31%] min-w-[92px] flex-col items-center rounded-lg border px-1.5 py-1.5 text-center transition hover:-translate-y-0.5 hover:shadow-sm focus:outline-none '
                        + (isSel ? 'bg-brand-500 text-white border-brand-700 shadow-sm' : CHIP_BG[lvl])
                      }
                    >
                      <span className={'block text-[10px] font-bold leading-none ' + (isSel ? 'text-white/85' : 'text-ink/45')}>
                        {reg.n}
                      </span>
                      <span className="block truncate text-[11px] font-bold leading-tight">{reg.name}</span>
                      <span className={'mt-0.5 block text-[10px] font-semibold leading-none ' + (isSel ? 'text-white/85' : 'text-ink/60')}>
                        {count} cas
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Légende officielle + zones sous surveillance */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
          <p className="mb-1.5 font-bold text-brand-800 text-xs">Légende — de moins menacé à plus menacé</p>
          <ul className="space-y-1 text-[11px]">
            {THREAT_LABELS.map((l, i) => (
              <li key={l} className="flex items-center gap-1.5">
                <span className="inline-block h-3 w-3 rounded-full border border-black/5" style={{ background: THREAT_COLORS[i] }} />
                <span className="text-ink/80">{l}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-brand-50 p-3 ring-1 ring-brand-100">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-brand-700">Zones sous surveillance</p>
          <ol className="grid gap-1 text-sm sm:grid-cols-2">
            {top.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-2 rounded px-1">
                <span className="truncate text-ink">{r.name}</span>
                <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
                  {r.count}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
