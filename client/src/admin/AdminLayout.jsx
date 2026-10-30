import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import QuickExit from '../components/QuickExit.jsx';
import { api } from '../lib/api.js';

// ─────────────────────────────────────────────────────────────────────────────
// Console administrateur — menu minimaliste à 3 onglets stricts (cahier des
// charges) : 1) Tableau de bord & carte thermique · 2) Journal · 3) Paramètres.
// Garde d'accès : /api/admin/me (cookie HttpOnly). 401 → renvoi au login.
// ─────────────────────────────────────────────────────────────────────────────

const TABS = [
  { to: '/admin/espace', end: true, label: 'Tableau de bord & Carte thermique' },
  { to: '/admin/espace/journal', label: 'Journal des incidents' },
  { to: '/admin/espace/parametres', label: 'Paramètres techniques' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api.admin('/me')
      .then(setMe)
      .catch(() => navigate('/admin', { replace: true }))
      .finally(() => setReady(true));
  }, [navigate]);

  async function logout() {
    await api.logout().catch(() => {});
    navigate('/admin', { replace: true });
  }

  if (!ready) {
    return <div className="min-h-full bg-brand-900" />;
  }

  return (
    <div className="flex min-h-full bg-white">
      {/* ── Menu latéral réduit à 3 onglets ── */}
      <aside className="hidden w-64 shrink-0 flex-col justify-between bg-brand-800 md:flex">
        <div>
          <div className="p-5"><Logo light /></div>
          <nav className="mt-6 space-y-1 px-3">
            {TABS.map((t) => (
              <NavLink key={t.to} to={t.to} end={t.end}
                className={({ isActive }) =>
                  'block rounded-xl px-3 py-2.5 text-sm font-medium transition '
                  + (isActive ? 'bg-brand-600 text-white' : 'text-brand-100/80 hover:bg-brand-700/60 hover:text-white')}>
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="mx-5 mt-8 rounded-xl bg-brand-900/70 p-3 text-[11px] leading-relaxed text-brand-100 ring-1 ring-white/10">
            🔒 Anonymat garanti : cette console n'agrège que des données techniques. Aucun nom, adresse IP, e-mail ou géoloc n'arrive au serveur.
          </div>
        </div>
        <div className="p-5 text-[11px] text-brand-300">
          Console v1 · Madagascar
          <p className="mt-1 text-brand-400/70">Anonymat garanti — rien de personnel n'est stocké</p>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <div className="flex min-h-full flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-100 bg-white px-4 py-3 md:px-8">
          <div>
            <p className="text-xs text-ink/50">Salut, {me?.user ?? 'aro.admin'} 👋 · Aucune PII n'a jamais quitté les téléphones des jeunes : ce que tu lis ici reste technique et anonyme.</p>
            <h1 className="text-xl font-bold text-ink">Tableau de Bord Administrateur</h1>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
              Session éphémère · 2 h max
            </span>
            <button type="button" onClick={logout}
              className="rounded-full bg-brand-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-800">
              Se déconnecter
            </button>
            <QuickExit compact />
          </div>
        </header>

        {/* Onglets en version mobile (3 onglets stricts, équivalent sidebar) */}
        <nav className="flex gap-1 overflow-x-auto border-b border-brand-100 px-2 py-2 md:hidden">
          {TABS.map((t) => (
            <NavLink key={t.to} to={t.to} end={t.end}
              className={({ isActive }) =>
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold '
                + (isActive ? 'bg-brand-700 text-white' : 'bg-brand-50 text-brand-700')}>
              {t.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 py-5 md:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-brand-100 px-4 py-3 text-[11px] text-ink/50 md:px-8">
          Console sécurisée · signalements anonymes uniquement
        </footer>
      </div>
    </div>
  );
}
