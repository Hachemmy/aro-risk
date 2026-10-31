// ─────────────────────────────────────────────────────────────────────────────
// ARO — serveur API REST — anonymat strict : aucun log d'accès, aucun stockage
// d'IP, cache interdit.
// ─────────────────────────────────────────────────────────────────────────────
import express from 'express';
import cors from 'cors';
import { securityHeaders, rateLimiter } from './security.js';
import { createRoutes } from './routes.js';
import { store } from './db.js';

const PORT = Number(process.env.PORT) || 4000;
const ALLOWED = (process.env.ARO_ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',').map((s) => s.trim()).filter(Boolean);

const app = express();

// Sans trace : pas de bandeau "X-Powered-By", jamais de log d'accès générique.
app.disable('x-powered-by');
app.disable('etag');

app.use(securityHeaders);
app.use(cors({ origin: ALLOWED, credentials: true }));
app.use(express.json({ limit: '64kb' }));

// Protection anti-usage abusif (compteurs éphémères en RAM, jamais persistés).
// POST de signalement : 8/min par client ; lecture agrégée : 60/min.
app.use('/api/reports', rateLimiter({ windowMs: 60000, max: 8 }));
app.use('/api', rateLimiter({ windowMs: 60000, max: 60 }));

app.use('/api', createRoutes());

// Sonde de vie, sans divulgation : { ok: true } uniquement.
app.get('/health', (req, res) => res.json({ ok: true }));

// ── Mode "conteneur unique" : servir le frontend construit (Docker) ─────────
// Si un build React est embarqué (client-dist/), Express le publie en statique
// et renvoie index.html pour les routes SPA — un seul Dockerfile, un seul port.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath as _fURL } from 'node:url';
const __dirnameRoot = path.dirname(_fURL(import.meta.url));
const distDir = path.join(__dirnameRoot, '..', 'client-dist');
if (fs.existsSync(path.join(distDir, 'index.html'))) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
  console.log(`Frontend React servi depuis ${distDir}`);
}

// Réponse par défaut propre, sans pile d'erreur côté client.
app.use((err, req, res, next) => {
  // Erreurs de parse JSON etc. — on traduit sans jamais jeter de stack-trace.
  const status = err?.status || err?.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'server_error' : 'bad_request',
    message: status === 500
      ? 'Une erreur technique a eu lieu. Le signalement est intact.'
      : 'Requête incomprise — revois ta saisie.',
  });
});

app.listen(PORT, () => {
  console.log(`ARO API en ligne : http://localhost:${PORT}  (moteur de stockage : ${store.engine})`);
  console.log('  Anonymat actif — aucune donnée personnelle n\'est enregistrée.');
});
