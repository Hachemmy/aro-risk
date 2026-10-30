import { Routes, Route } from 'react-router-dom';
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
      {/* ── Espace public ── */}
      <Route path="/" element={<Report />} />
      <Route path="/confort" element={<Comfort />} />

      {/* ── Console administrateur ── */}
      <Route path="/admin" element={<AdminLogin />} />
      <Route path="/admin/espace" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="journal" element={<Journal />} />
        <Route path="parametres" element={<Parametres />} />
      </Route>

      {/* Route inconnue → retour accueil public */}
      <Route path="*" element={<Report />} />
    </Routes>
  );
}
