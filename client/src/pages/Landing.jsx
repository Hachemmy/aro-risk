import { Link } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Icon from '../components/Icon.jsx';
import QuickExit from '../components/QuickExit.jsx';

export default function Landing() {
  return (
    <div className="min-h-full bg-skyform">
      <header className="border-b border-brand-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Logo size={38} />
          <QuickExit />
        </div>
      </header>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-5xl flex-col justify-center px-4 py-10 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-500">Anonyme · Sans compte · Sans trace</p>
          <h1 className="mt-2 text-3xl font-bold text-brand-800 sm:text-4xl">Bienvenue sur ARO</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink/70 sm:text-base">
            Un espace sûr pour les lycéens de Madagascar. Choisis l'espace qui te correspond.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            to="/signaler"
            className="group flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
              <Icon name="shield" size={24} />
            </span>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-brand-500">Jeune / lycéen</p>
            <h2 className="mt-1 text-xl font-bold text-brand-800">Signaler anonymement</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/65">
              Raconte ce que tu vis ou ce que tu as vu. Pas de nom, pas de compte, pas de trace.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
              Entrer dans l'espace signalement
              <Icon name="arrowRight" size={15} />
            </span>
          </Link>

          <Link
            to="/admin"
            className="group flex flex-col rounded-3xl bg-white p-6 shadow-sm ring-1 ring-brand-100 transition hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-300"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/[0.05] text-brand-800 ring-1 ring-brand-100">
              <Icon name="lock" size={24} />
            </span>
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-brand-500">Administrateur</p>
            <h2 className="mt-1 text-xl font-bold text-brand-800">Console de suivi</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/65">
              Accès réservé aux personnes habilitées. Données anonymisées uniquement.
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-brand-700">
              Se connecter à la console
              <Icon name="arrowRight" size={15} />
            </span>
          </Link>
        </div>

        <div className="mt-7 flex flex-col items-center gap-3 text-center">
          <Link
            to="/confort"
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-100 hover:bg-brand-50"
          >
            <Icon name="leaf" size={15} />
            J'ai besoin d'un moment calme
            <Icon name="arrowRight" size={14} />
          </Link>
          <p className="max-w-lg text-xs leading-relaxed text-ink/45">
            En cas de danger immédiat, parle à un adulte de confiance ou contacte les secours.
          </p>
        </div>
      </main>
    </div>
  );
}
