// ─────────────────────────────────────────────────────────────────────────────
// Couche de stockage anonyme.
//
// Choix automatique du moteur :
//   1. SQLite natif (`node:sqlite`, intégré à Node 22+) — recommandé ;
//   2. à défaut, magasin JSON léger sur disque (aucune dépendance native).
//
// Règle d'or (cahier des charges) : NE SONT PERSISTÉS QUE :
//   - les types de harcèlement cochés,
//   - le texte libre CHIFFRÉ (AES-256-GCM),
//   - la ou les plateformes, la région, la gravité, l'horodatage.
//   AUCUNE adresse IP, aucun identifiant, aucun cookie de suivi.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { encryptText, decryptText } from './crypto.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const DATA_DIR = path.join(__dirname, '..', 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });

export function shortId() {
  return 'AR-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

export function shortAlertId() {
  return 'AL-' + crypto.randomBytes(4).toString('hex').toUpperCase();
}

export function computeSeverity(types) {
  // 1 = à surveiller ; 2 = cas grave ; 3 = potentiel de gravité élevé (escalade externe).
  const hasSev2 = (types || []).some((t) => t.sev >= 2);
  const n = (types || []).length;
  if (hasSev2 && n >= 2) return 3;
  if (hasSev2 || n >= 2) return 2;
  return 1;
}

// Met en forme une ligne de base en objet applicatif commun aux deux moteurs.
function normalizeReport(r) {
  if (!r) return r;
  const out = {
    id: r.id,
    createdAt: Number(r.createdAt ?? r.created_at),
    region: r.region,
    platforms: typeof r.platforms === 'string' ? JSON.parse(r.platforms) : (r.platforms || []),
    types: typeof r.types === 'string' ? JSON.parse(r.types) : (r.types || []),
    severity: Number(r.severity),
    noteEnc: (r.noteEnc ?? r.note_enc) ? JSON.parse(r.noteEnc ?? r.note_enc) : null,
    alertStatus: r.alertStatus ?? r.alert_status,
  };
  return out;
}

function normalizeAlert(a) {
  if (!a) return a;
  return {
    id: a.id,
    reportId: a.reportId ?? a.report_id,
    resource: a.resource,
    status: a.status,
    createdAt: Number(a.createdAt ?? a.created_at),
    updatedAt: Number(a.updatedAt ?? a.updated_at),
  };
}

async function buildStore() {
  try {
    const { DatabaseSync } = await import('node:sqlite');
    const db = new DatabaseSync(path.join(DATA_DIR, 'aro.sqlite'));
    db.exec(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS reports (
        id           TEXT PRIMARY KEY,
        created_at   INTEGER NOT NULL,
        region       TEXT NOT NULL,
        platforms    TEXT NOT NULL,
        types        TEXT NOT NULL,
        severity     INTEGER NOT NULL,
        note_enc     TEXT,
        alert_status TEXT NOT NULL DEFAULT 'none'
      );
      CREATE TABLE IF NOT EXISTS alerts (
        id         TEXT PRIMARY KEY,
        report_id  TEXT NOT NULL,
        resource   TEXT NOT NULL,
        status     TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_reports_creat ON reports(created_at DESC);
    `);

    return {
      engine: 'sqlite',
      insertReport(r) {
        db.prepare(
          `INSERT INTO reports (id, created_at, region, platforms, types, severity, note_enc, alert_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(r.id, r.createdAt, r.region, JSON.stringify(r.platforms), JSON.stringify(r.types),
              r.severity, r.noteEnc ? JSON.stringify(r.noteEnc) : null, r.alertStatus);
        return r;
      },
      insertAlert(a) {
        db.prepare(
          `INSERT INTO alerts (id, report_id, resource, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        ).run(a.id, a.reportId, a.resource, a.status, a.createdAt, a.updatedAt);
        return a;
      },
      listReports() {
        return db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all().map(normalizeReport);
      },
      listAlerts() {
        return db.prepare('SELECT * FROM alerts ORDER BY created_at DESC').all().map(normalizeAlert);
      },
      getReport(id) {
        return normalizeReport(db.prepare('SELECT * FROM reports WHERE id = ?').get(id));
      },
      getAlertsForReport(reportId) {
        return db.prepare('SELECT * FROM alerts WHERE report_id = ? ORDER BY created_at DESC')
                 .all(reportId).map(normalizeAlert);
      },
      getAlert(alertId) {
        return normalizeAlert(db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId));
      },
      setAlertStatus(alertId, status) {
        const a = this.getAlert(alertId);
        if (!a) return null;
        db.prepare('UPDATE alerts SET status = ?, updated_at = ? WHERE id = ?').run(status, Date.now(), alertId);
        db.prepare('UPDATE reports SET alert_status = ? WHERE id = ?').run(status, a.reportId);
        return this.getAlert(alertId);
      },
      markAllAlertsSent() {
        const queued = db.prepare(`SELECT * FROM alerts WHERE status = 'queued'`).all().map(normalizeAlert);
        for (const a of queued) this.setAlertStatus(a.id, 'sent');
        return queued.length;
      },
      purgeOlderThan(days) {
        const cutoff = Date.now() - days * 86400000;
        const r = db.prepare('DELETE FROM reports WHERE created_at < ?').run(cutoff);
        const a = db.prepare('DELETE FROM alerts WHERE created_at < ?').run(cutoff);
        return { reports: Number(r.changes), alerts: Number(a.changes) };
      },
      count() {
        return Number(db.prepare('SELECT COUNT(*) AS c FROM reports').get().c);
      },
      backupTo(file) {
        // Copie cohérente de la base (WAL inclus), sans bloquer les écritures.
        db.exec(`VACUUM INTO '${String(file).replace(/'/g, "''")}'`);
        return file;
      },
      path: path.join(DATA_DIR, 'aro.sqlite'),
      clearAll() {
        db.exec('DELETE FROM reports; DELETE FROM alerts;');
      },
    };
  } catch {
    // ── Magasin JSON (sans dépendance native) ──
    const FILE = path.join(DATA_DIR, 'aro.json');
    let state = { reports: [], alerts: [] };
    if (fs.existsSync(FILE)) {
      try { state = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { /* on repart à vide */ }
      if (!Array.isArray(state.reports)) state.reports = [];
      if (!Array.isArray(state.alerts)) state.alerts = [];
    }
    const save = () => fs.writeFileSync(FILE, JSON.stringify(state), 'utf8');

    return {
      engine: 'json',
      insertReport(r) { state.reports.push(r); save(); return r; },
      insertAlert(a) { state.alerts.push(a); save(); return a; },
      listReports() {
        return [...state.reports].sort((a, b) => b.createdAt - a.createdAt);
      },
      listAlerts() {
        return [...state.alerts].sort((a, b) => b.createdAt - a.createdAt);
      },
      getReport(id) { return state.reports.find((r) => r.id === id) || null; },
      getAlertsForReport(reportId) { return state.alerts.filter((a) => a.reportId === reportId); },
      getAlert(alertId) { return state.alerts.find((x) => x.id === alertId) || null; },
      setAlertStatus(alertId, status) {
        const a = state.alerts.find((x) => x.id === alertId);
        if (!a) return null;
        a.status = status; a.updatedAt = Date.now();
        const r = state.reports.find((x) => x.id === a.reportId);
        if (r) r.alertStatus = status;
        save();
        return a;
      },
      markAllAlertsSent() {
        const now = Date.now();
        let n = 0;
        for (const a of state.alerts) if (a.status === 'queued') { a.status = 'sent'; a.updatedAt = now; n++; }
        for (const r of state.reports) if (r.alertStatus === 'queued') r.alertStatus = 'sent';
        save();
        return n;
      },
      purgeOlderThan(days) {
        const cutoff = Date.now() - days * 86400000;
        const before = state.reports.length;
        state.reports = state.reports.filter((r) => r.createdAt >= cutoff);
        state.alerts = state.alerts.filter((a) => a.createdAt >= cutoff);
        save();
        return { reports: before - state.reports.length, alerts: 0 };
      },
      count() { return state.reports.length; },
      backupTo(file) {
        fs.copyFileSync(FILE, file);
        return file;
      },
      path: FILE,
      clearAll() { state = { reports: [], alerts: [] }; save(); },
    };
  }
}

export const store = await buildStore();

export function newReport({ region, platforms, types, note }) {
  const enc = note ? encryptText(note) : null;
  const severity = computeSeverity(types);
  return {
    id: shortId(),
    createdAt: Date.now(),
    region,
    platforms,
    types,
    severity,
    noteEnc: enc,
    alertStatus: severity >= 3 ? 'queued' : 'none',
  };
}

export function queueAlert(reportId, resource) {
  return store.insertAlert({
    id: shortAlertId(),
    reportId,
    resource,
    status: 'queued',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
}

// Ouvre la boîte chiffrée uniquement pour la console administrateur.
export function decryptNote(report) {
  if (!report?.noteEnc) return null;
  try { return decryptText(report.noteEnc); } catch { return null; }
}
