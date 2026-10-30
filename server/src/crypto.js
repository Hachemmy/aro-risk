// ─────────────────────────────────────────────────────────────────────────────
// Chiffrement AES-256-GCM du texte libre ("Se vider").
// La clé est générée aléatoirement au premier démarrage et conservée HORS de la
// base, dans server/data/.textkey : même si la base fuit, les récits restent
// illisibles. Aucune donnée personnelle n'est stockée par ce module.
// ─────────────────────────────────────────────────────────────────────────────
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KEY_FILE = path.join(__dirname, '..', 'data', '.textkey');

function loadOrCreateKey() {
  fs.mkdirSync(path.dirname(KEY_FILE), { recursive: true });
  if (fs.existsSync(KEY_FILE)) {
    const k = Buffer.from(fs.readFileSync(KEY_FILE, 'utf8').trim(), 'hex');
    if (k.length === 32) return k;
  }
  const k = crypto.randomBytes(32);
  fs.writeFileSync(KEY_FILE, k.toString('hex'), 'utf8');
  return k;
}

const KEY = loadOrCreateKey();

export function encryptText(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const data = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return {
    d: data.toString('base64'),
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
  };
}

export function decryptText(box) {
  if (!box || !box.d || !box.iv || !box.tag) return '';
  const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(box.iv, 'base64'));
  decipher.setAuthTag(Buffer.from(box.tag, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(box.d, 'base64')), decipher.final()]).toString('utf8');
}

export function sha256(s) {
  return crypto.createHash('sha256').update(String(s)).digest('hex');
}
