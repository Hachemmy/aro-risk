// ─────────────────────────────────────────────────────────────────────────────
// Toutes les routes REST de l'API ARO.
//
// Public  : POST /api/reports  · GET /api/stats · GET /api/resources · GET /api/meta
// Console : POST /api/admin/login ·logout ·me
//           GET  /api/admin/overview | reports | reports/:id/note | alerts | alerts/:id/status
//           POST /api/admin/alerts/:id/dispatch · purge
//           GET  /api/admin/export
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import express from 'express';
import { REGIONS, INCIDENT_TYPES, PLATFORMS, HELP_RESOURCES, threatLevel, THREAT_LEVELS } from './data.js';
import { store, newReport, queueAlert, decryptNote, DATA_DIR } from './db.js';
import { sha256 } from './crypto.js';

// Identifiant + passe console service (variables d'environnement, non nominatifs).
const ADMIN_USER = process.env.ARO_ADMIN_USER || 'aro.admin';
const ADMIN_PASSWORD = process.env.ARO_ADMIN_PASSWORD || null;
const ADMIN_HASH = ADMIN_PASSWORD ? sha256(ADMIN_PASSWORD + '::aro') : null;
const SESSION_TTL = 2 * 60 * 60 * 1000; // 2 h

// Session en mémoire : token éphémère -> { exp }, jamais persistés sur disque.
const sessions = new Map();
function newSession() {
  const token = crypto.randomBytes(24).toString('base64url');
  sessions.set(token, { exp: Date.now() + SESSION_TTL });
  return token;
}
function checkSession(token) {
  const s = sessions.get(token);
  if (!s) return false;
  if (Date.now() > s.exp) { sessions.delete(token); return false; }
  return true;
}
function readCookie(req, name) {
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

function requireAdmin(req, res, next) {
  const token = readCookie(req, 'aro_admin');
  if (!token || !checkSession(token)) {
    return res.status(401).json({ error: 'unauthorized', message: 'Session expirée ou absente.' });
  }
  next();
}

// Détection "ne pas renvoyer de données personnelles dans la réponse"
const PII_PATTERNS = [
  /\+?261\s?\d{2}[\s\d]{6,9}/g,          // +261 / 0 suivi, numéros malgaches
  /0[3-5]\d\s?\d{2}[\s\d]{5,9}/g,        // cellulaire local 03x ...
  /[\w.+-]+@[\w-]+\.[\w.-]+/g,           // e-mail
];
function containsPII(text) {
  return PII_PATTERNS.some((re) => new RegExp(re.source, 'gi').test(text));
}

// Gravité du signal en fonction des checkboxes (les cas graves remontent vite).
function highSeverity(report) { return report.severity >= 3; }

export function createRoutes() {
  const r = express.Router();

  // ── Métadonnées pour le frontend (listes de référence, légende) ──────────
  r.get('/meta', (req, res) => {
    res.json({
      regions: REGIONS,
      types: INCIDENT_TYPES.map(({ id, label }) => ({ id, label })),
      platforms: PLATFORMS,
      threatLevels: THREAT_LEVELS,
    });
  });

  // ── POST /api/reports : réception du signalement anonyme ──────────────────
  r.post('/reports', (req, res) => {
    const body = req.body || {};
    const region = String(body.region || '');
    if (!REGIONS.includes(region)) {
      return res.status(400).json({ error: 'invalid_region', message: 'Sélectionne une région valide.' });
    }

    const chosen = [];
    const ids = Array.isArray(body.types) ? body.types : [];
    if (ids.length > 8) {
      return res.status(400).json({ error: 'too_many_types', message: 'Trop de types sélectionnés.' });
    }
    for (const id of ids) {
      const t = INCIDENT_TYPES.find((x) => x.id === id);
      if (t) chosen.push(t);
    }
    if (chosen.length === 0) {
      return res.status(400).json({ error: 'missing_types', message: 'Coche au moins un type de harcèlement.' });
    }
    const plat = (Array.isArray(body.platforms) ? body.platforms : [])
      .filter((p) => PLATFORMS.includes(p)).slice(0, 6);

    // Texte libre : longueur bornée, réponse minimaliste.
    const note = String(body.note || '').slice(0, 4000).trim();
    const pii = containsPII(note);

    const report = newReport({
      region,
      platforms: plat,
      types: chosen.map((t) => ({ id: t.id, sev: t.sev })),
      note,
    });
    store.insertReport(report);

    // Escalade externe automatique sur cas potentiellement graves (sev 3)
    let alert = null;
    if (highSeverity(report)) {
      alert = queueAlert(report.id, 'Bureau Anti-Cybercrime — SNCT (escalade automatique)');
    }

    // Réponse ultra-minimale : pas d'écho de texte, jamais d'empreinte de trace.
    res.status(201).json({
      ok: true,
      reference: report.id,
      alert: alert ? { status: 'queued' } : null,
      hint: pii
        ? 'Ton message contenait peut-être un numéro ou un e-mail : il est chiffré, mais pense à rester anonyme la prochaine fois.'
        : 'Ton signalement est enregistré sans aucune donnée personnelle.',
    });
  });

  // ── GET /api/stats : agrégation temps réel pour la carte thermique ───────
  r.get('/stats', (req, res) => {
    const reports = store.listReports();
    const now = Date.now();
    const dayAgo = now - 86400000;

    const byRegion = REGIONS.map((region) => ({ region, count: 0 }));
    const byType = INCIDENT_TYPES.map((t) => ({ id: t.id, label: t.label, count: 0 }));
    const last7days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      last7days.push({ date: key, count: 0 });
    }

    let total = 0, last24h = 0, open = 0, alertsSent = 0, alertsQueued = 0;
    for (const rep of reports) {
      total++;
      if (rep.createdAt >= dayAgo) last24h++;
      if (rep.alertStatus === 'queued') open++;
      if (rep.alertStatus === 'sent') alertsSent++;
      if (rep.alertStatus === 'queued') alertsQueued++;
      const idx = byRegion.findIndex((x) => x.region === rep.region);
      if (idx !== -1) byRegion[idx].count++;
      for (const id of rep.types.map((t) => (typeof t === 'string' ? t : t.id))) {
        const t2 = byType.find((x) => x.id === id);
        if (t2) t2.count++;
      }
      const day = new Date(rep.createdAt).toISOString().slice(0, 10);
      const trend = last7days.find((x) => x.date === day);
      if (trend) trend.count++;
    }

    res.json({
      totals: {
        total, last24h,
        openIncidents: open,
        alertsSent,
        alertsQueued,
        zonesWatch: byRegion.filter((x) => threatLevel(x.count) >= 2).length,
        engine: store.engine,
      },
      byRegion: byRegion.map((x) => ({ ...x, level: threatLevel(x.count) })),
      byType,
      last7days,
    });
  });

  // ── GET /api/resources : annuaire régional des structures ────────────────
  r.get('/resources', (req, res) => {
    const region = req.query.region || null;
    res.json({
      region,
      resources: HELP_RESOURCES.filter((x) => x.national || x.region === region),
      updatedAt: new Date().toISOString(),
    });
  });

  // ══════════════════════ CONSOLE ADMINISTRATEUR ══════════════════════════
  r.post('/admin/login', (req, res) => {
    const { user, password } = req.body || {};
    const uok = user && ADMIN_USER === String(user);
    // Comparaison par hash équivalente au temps : on ne stocke jamais le passe en clair.
    const pok = password && sha256(String(password) + '::aro') === ADMIN_HASH;
    if (!uok || !pok) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'Identifiant ou mot de passe incorrect.' });
    }
    const token = newSession();
    res.setHeader('Set-Cookie',
      `aro_admin=${token}; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}; Path=/`);
    res.json({ ok: true, user: ADMIN_USER, expiresInMinutes: SESSION_TTL / 60000 });
  });

  r.post('/admin/logout', (req, res) => {
    const token = readCookie(req, 'aro_admin');
    if (token) sessions.delete(token);
    res.setHeader('Set-Cookie', 'aro_admin=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/');
    res.json({ ok: true });
  });

  r.get('/admin/me', requireAdmin, (req, res) => {
    res.json({ ok: true, user: ADMIN_USER, persist: false, note: 'Session RAM only — contre-traces.' });
  });

  // Vue d'ensemble console (stat cards, donut, régions)
  r.get('/admin/overview', requireAdmin, (req, res) => {
    // Simple agrégation console :
    const reports = store.listReports();
    const byType = INCIDENT_TYPES.map((t) => ({ id: t.id, label: t.label, count: 0 }));
    const byRegion = REGIONS.map((region) => ({ region, count: 0 }));
    let total = 0, last24h = 0, open = 0;
    const dayAgo = Date.now() - 86400000;
    for (const rep of reports) {
      total++;
      if (rep.createdAt >= dayAgo) last24h++;
      if (rep.alertStatus === 'queued') open++;
      const i = byRegion.findIndex((x) => x.region === rep.region);
      if (i !== -1) byRegion[i].count++;
      for (const t of rep.types.map((x) => (typeof x === 'string' ? x : x.id))) {
        const b = byType.find((y) => y.id === t);
        if (b) b.count++;
      }
    }
    const alerts = store.listAlerts();
    res.json({
      stats: {
        total, last24h,
        openIncidents: open,
        alertsSent: alerts.filter((a) => a.status === 'sent').length,
        alertsQueued: alerts.filter((a) => a.status === 'queued').length,
        zonesWatch: byRegion.filter((x) => threatLevel(x.count) >= 2).length,
      },
      byType,
      byRegion: byRegion.map((x) => ({ ...x, level: threatLevel(x.count) })),
      recent: reports.slice(0, 8).map(publicView),
      alerts: alerts.slice(0, 6).map(anonAlertView),
    });
  });

  function publicView(rep) {
    return {
      id: rep.id,
      createdAt: rep.createdAt,
      region: rep.region,
      platforms: rep.platforms,
      types: rep.types.map((t) => (typeof t === 'string' ? t : t.id)),
      severity: rep.severity,
      alertStatus: rep.alertStatus,
      hasNote: !!rep.noteEnc,
    };
  }
  function anonAlertView(a) {
    return { id: a.id, reportId: a.reportId, resource: a.resource, status: a.status, createdAt: a.createdAt };
  }

  // Journal des incidents (signalements anonymisés) — sans le texte libre.
  r.get('/admin/reports', requireAdmin, (req, res) => {
    res.json({
      reports: store.listReports().map(publicView),
    });
  });

  // Texte libre déchiffré UNIQUEMENT à la demande, et jamais à l'avance :
  r.get('/admin/reports/:id/note', requireAdmin, (req, res) => {
    const rep = store.getReport(req.params.id);
    if (!rep) return res.status(404).json({ error: 'not_found', message: 'Signalement introuvable.' });
    res.json({
      id: rep.id,
      note: decryptNote(rep),
      hasNote: !!rep.noteEnc,
      mention: 'Texte chiffré AES-256-GCM. Ne tente pas de contacter la victime : c\'est elle qui utilise l\'annuaire.',
    });
  });

  // Status alertes externes + vérification de transmission (route dédiée).
  r.get('/admin/alerts', requireAdmin, (req, res) => {
    res.json({ alerts: store.listAlerts().map(anonAlertView) });
  });
  r.get('/admin/alerts/:id/status', requireAdmin, (req, res) => {
    const a = store.getAlert(req.params.id);
    if (!a) return res.status(404).json({ error: 'not_found' });
    res.json({ id: a.id, reportId: a.reportId, status: a.status, updatedAt: a.updatedAt });
  });

  // Marque la transmission au relais comme effectuée.
  r.post('/admin/alerts/:id/dispatch', requireAdmin, (req, res) => {
    const a = store.setAlertStatus(req.params.id, 'sent');
    if (!a) return res.status(404).json({ error: 'not_found' });
    res.json({ ok: true, id: a.id, status: a.status, dispatchedAt: a.updatedAt });
  });

  // Purge du vieux stock (cahier des charges : on ne garde pas longtemps).
  r.post('/admin/purge', requireAdmin, (req, res) => {
    const days = Math.max(1, Number(req.body?.days) || 30);
    res.json({ ok: true, deleted: store.purgeOlderThan(days), retentionDays: days });
  });

  // Emplacement + état de la base (transparence totale pour la propriétaire).
  r.get('/admin/db-info', requireAdmin, (req, res) => {
    const file = store.path;
    let sizeBytes = 0;
    try { sizeBytes = fs.statSync(file).size; } catch { /* fichier pas encore créé */ }
    // Chemin réellement visible sur la machine hôte. Surchargeable via env
    // quand la base est montée depuis un autre dossier (Docker, NAS…).
    const hostPath = process.env.ARO_DB_HOST_PATH || file;
    const hostDataDir = process.env.ARO_DB_HOST_DIR || path.dirname(hostPath);
    const keyHostPath = process.env.ARO_KEY_HOST_PATH || path.join(hostDataDir, '.textkey');
    res.json({
      engine: store.engine,
      platform: process.platform,
      containerPath: file,
      hostPath,
      hostDataDir,
      keyHostPath,
      keyExists: fs.existsSync(path.join(DATA_DIR, '.textkey')),
      sizeBytes,
      reports: store.count(),
      alerts: store.listAlerts().length,
      inDocker: fs.existsSync('/.dockerenv'),
    });
  });

  // Télécharger une copie complète de la base (sauvegarde locale).
  r.get('/admin/db-backup', requireAdmin, (req, res) => {
    const stamp = new Date().toISOString().slice(0, 10);
    const tmp = path.join(os.tmpdir(), `aro-base-${crypto.randomBytes(4).toString('hex')}.sqlite`);
    try {
      store.backupTo(tmp);
      res.download(tmp, `aro-base-${stamp}.sqlite`, () => {
        try { fs.unlinkSync(tmp); } catch { /* déjà supprimé */ }
      });
    } catch {
      res.status(500).json({ error: 'backup_failed' });
    }
  });

  // Export CSV complet des incidents (administrateurs authentifiés uniquement).
  r.get('/admin/export', requireAdmin, (req, res) => {
    const rows = [[ 'id', 'horodatage', 'region', 'plateformes', 'types', 'gravite', 'statut_alerte', 'recit' ]];
    for (const rp of store.listReports()) {
      rows.push([
        rp.id,
        new Date(rp.createdAt).toISOString(),
        rp.region,
        rp.platforms.join(' + '),
        rp.types.map((t) => (typeof t === 'string' ? t : t.id)).join(' + '),
        rp.severity,
        rp.alertStatus,
        decryptNote(rp),
      ]);
    }
    const csv = rows.map((cols) => cols.map(csvCell).join(',')).join('\r\n');
    res.set('Content-Type', 'text/csv; charset=utf-8');
    res.set('Content-Disposition', 'attachment; filename="aro-incidents.csv"');
    res.send(`\uFEFF${csv}`);
  });
  function csvCell(s) {
    let v = String(s ?? '').replace(/^[=+\-@]/, "'$&");
    return /[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }

  return r;
}
