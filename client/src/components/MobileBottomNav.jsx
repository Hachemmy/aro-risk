import { NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';

// Barre de navigation mobile (bas d'écran, dispositif tactile).
// Teen-first : le téléphone est le principal point d'accès — navigation
// pouce-douulaire, une seule main, aucun texte minuscule.
const ITEMS = [
  { to: '/signaler', label: 'Signaler', icon: 'shield' },
  { to: '/confort', label: 'Confort', icon: 'leaf' },
];

export default function MobileBottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Navigation mobile"
      className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      {ITEMS.map((it) => {
        const active = pathname === it.to;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            className={'flex min-h-[56px] flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-bold ' +
              (active ? 'text-brand-700' : 'text-ink/55')}
          >
            <Icon name={it.icon} size={20} className={active ? 'scale-110 transition' : ''} />
            {it.label}
          </NavLink>
        );
      })}
    </nav>
  );
}
