import { Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.jsx';
import Report from './pages/Report.jsx';
import Comfort from './pages/Comfort.jsx';
import AdminLogin from './pages/AdminLogin.jsx';
import AdminLayout from './admin/AdminLayout.jsx';
import Dashboard from './admin/Dashboard.jsx';
import Journal from './admin/Journal.jsx';
import Parametres from './admin/Parametres.jsx';

export default function App() {
  return (
    <Routes>
      {/* ── Accueil : choix de l'espace ── */}
      <Route path="/" element={<Landing />} />

      {/* ── Espace public ── */}
      <Route path="/signaler" element={<Report />} />
      <Route path="/confort" element={<Comfort />} />

      {/* ── Console administrateur ── */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/espace" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="journal" element={<Journal />} />
        <Route path="parametres" element={<Parametres />} />
      </Route>

      {/* Route inconnue → retour à l'accueil */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
