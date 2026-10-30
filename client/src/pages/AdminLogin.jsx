import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import QuickExit from '../components/QuickExit.jsx';
import { api } from '../lib/api.js';

// ─────────────────────────────────────────────────────────────────────────────
// Accès restreint — Espace Administrateur.
// Session éphémère via cookie HttpOnly (2 h). Aucune persistance côté appareil.
// Démo : utilisateur `aro.admin`, passe `AroDemo2026!`.
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminLogin() {
  const navigate = useNavigate();
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.login(user.trim(), password);
      navigate('/admin/espace', { replace: true });
    } catch {
      setError('Identifiant ou mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col bg-brand-900">
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
              <path d="M24 10l10 4v8c0 8-4.5 13-10 16-5.5-3-10-8-10-16v-8l10-4z" fill="none" stroke="#eaf6fb" strokeWidth="2.6" strokeLinejoin="round" />
              <path d="M18 24l4 4 8-9" fill="none" stroke="#7fd1d9" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <span className="text-sm leading-tight text-white">
            <span className="block font-bold">ARO</span>
            <span className="block text-[10px] text-brand-200">Réseau anonyme de soutien</span>
          </span>
        </Link>
        <span className="text-xs font-medium text-brand-200">Espace Administrateur</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <form onSubmit={submit} className="rounded-3xl bg-white p-6 shadow-xl sm:p-8">
            <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">🔒 Accès restreint</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Espace Administrateur</h1>
            <p className="mt-1 text-sm text-ink/60">
              Cet espace gère les signalements anonymisés uniquement, pour éviter tout risque d'identification ARO.
            </p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-xs font-bold text-brand-700">Identifiant</span>
                <input
                  type="text" autoComplete="off" spellCheck="false" required
                  value={user} onChange={(e) => setUser(e.target.value)}
                  placeholder="Saisir votre identifiant"
                  className="mt-1 w-full rounded-xl border border-brand-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
                />
              </label>

              <label className="block">
                <span className="text-xs font-bold text-brand-700">Mot de passe</span>
                <span className="mt-1 flex items-center rounded-xl border border-brand-200 px-3 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-200">
                  <input
                    type={show ? 'text' : 'password'} autoComplete="off" required
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisir votre mot de passe"
                    className="w-full bg-transparent py-2.5 text-sm outline-none"
                  />
                  <button type="button" onClick={() => setShow(!show)}
                    className="ml-2 shrink-0 text-xs font-semibold text-brand-700 underline-offset-2 hover:underline">
                    {show ? 'Masquer' : '👁 Afficher'}
                  </button>
                </span>
              </label>

              {error && (
                <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-700 ring-1 ring-red-200">{error}</p>
              )}

              <button type="submit" disabled={loading}
                className="w-full rounded-xl bg-brand-700 px-4 py-3 text-base font-bold text-white transition hover:bg-brand-800 disabled:opacity-60">
                {loading ? 'Connexion…' : 'Se connecter →'}
              </button>

              <p className="rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-brand-800 ring-1 ring-brand-100">
                ⚠️ Un souci d'accès ? Contactez l'administrateur technique via ce canal sécurisé.
              </p>

              <p className="text-center text-xs text-ink/50">
                Démo — accès <code className="rounded bg-brand-50 px-1 font-mono text-brand-700">aro.admin</code> / <code className="rounded bg-brand-50 px-1 font-mono text-brand-700">AroDemo2026!</code>
              </p>
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-brand-100">
            <Link to="/confort" className="underline underline-offset-2 hover:text-white">← Retour à l'aide &amp; réconfort</Link>
          </p>

          <div className="mt-5 rounded-xl bg-amber-100/95 p-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-300">
            ⚠️ Environnement réel — données anonymisées. Aucune navigation directe
            à partir de cette console : toute navigation internet s'effectue hors de cet espace.
          </div>
        </div>
      </main>

      <footer className="flex items-center justify-between px-6 py-4 text-[11px] text-brand-300">
        <span>ARO · Projet de réponse au cyberharcèlement</span>
        <span className="flex items-center gap-3">
          Aucune donnée personnelle n'est conservée pour cette session
          <QuickExit compact />
        </span>
      </footer>
    </div>
  );
}
