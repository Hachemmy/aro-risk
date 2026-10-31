import { Link, NavLink } from 'react-router-dom';
import Logo from './Logo.jsx';
import QuickExit from './QuickExit.jsx';
import MobileBottomNav from './MobileBottomNav.jsx';

// En-tête commun aux écrans publics (formulaire + réconfort).
export default function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <Link to="/" className="shrink-0"><Logo size={36} /></Link>
        <nav className="hidden items-center gap-5 text-sm font-medium text-brand-700 sm:flex">
          <NavLink to="/signaler" className={({ isActive }) => 'hover:text-brand-900 ' + (isActive ? 'underline underline-offset-4' : '')}>
            Signaler
          </NavLink>
          <NavLink to="/confort" className={({ isActive }) => 'hover:text-brand-900 ' + (isActive ? 'underline underline-offset-4' : '')}>
            Confort
          </NavLink>
        </nav>
        <div className="flex items-center gap-2">
          <QuickExit />
        </div>
      </div>
      {/* Sous-titres de navigation mobile (visible uniquement en écran étroit) */}
      <nav className="flex items-center gap-2 border-t border-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-700 sm:hidden">
        <NavLink to="/signaler" className={({ isActive }) => 'rounded-full px-2.5 py-1 ' + (isActive ? 'bg-brand-700 text-white' : 'bg-brand-50')}>Signaler</NavLink>
        <NavLink to="/confort" className={({ isActive }) => 'rounded-full px-2.5 py-1 ' + (isActive ? 'bg-brand-700 text-white' : 'bg-brand-50')}>Confort</NavLink>
        <span className="ml-auto text-[10px] font-medium text-ink/45">Anonyme · 12 ans+</span>
      </nav>
      {/* Navigation en bas d'écran sur téléphone */}
      <MobileBottomNav />
    </header>
  );
}
