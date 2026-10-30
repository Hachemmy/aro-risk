export default function Logo({ light = false, size = 40 }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
        <rect x="2" y="2" width="44" height="44" rx="12" fill={light ? '#ffffff14' : '#14535a'} />
        <path d="M24 10l10 4v8c0 8-4.5 13-10 16-5.5-3-10-8-10-16v-8l10-4z" fill="none" stroke={light ? '#fff' : '#eaf6fb'} strokeWidth="2.4" strokeLinejoin="round" />
        <path d="M18 24l4 4 8-9" fill="none" stroke="#7fd1d9" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={'leading-tight ' + (light ? 'text-white' : 'text-brand-800')}>
        <span className="block text-lg font-bold tracking-tight">ARO</span>
        <span className={'block text-[10px] font-semibold uppercase tracking-wider ' + (light ? 'text-brand-100' : 'text-brand-500')}>
          Réseau anonyme · Madagascar
        </span>
      </span>
    </span>
  );
}
