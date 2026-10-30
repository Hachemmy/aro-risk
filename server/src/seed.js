// ─────────────────────────────────────────────────────────────────────────────
// Données de démonstration pour la maquette ARO.
// Génère des signalements ANONYMES plausibles sur les 14 derniers jours pour
// faire vivre la carte thermique et le journal. Aucune donnée personnelle.
//   exécution : npm run seed   (dans server/)
// ─────────────────────────────────────────────────────────────────────────────
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { store, queueAlert } from './db.js';
import { INCIDENT_TYPES } from './data.js';
import { encryptText } from './crypto.js';

const NOTES = [
  "On m'a envoyé des messages injurieux pendant trois jours, sur un groupe de classe. Je n'ose plus rentrer chez moi.",
  "Ma photo a été reprise d'un profil faux et des dizaines de commentaires malsains ont suivi.",
  "Quelqu'un a partagé mon numéro dans un canal puis des inconnus m'ont écrit la nuit.",
  "Un compte avec ma photo a ajouté tous mes amis et répond à ma place.",
  "On me demande une photo et on me dit que si je refuse ils montrent déjà ce qu'ils ont.",
  "Des moqueries sous chaque story que je publie, même les gens que je connais partagent.",
  "On m'a exclu du groupe WhatsApp de la classe et un autre groupe parle de moi constamment.",
  "Une vidéo honteuse tournait depuis hier soir ; je n'ai pas dormi.",
  "Un utilisateur que je ne connais pas a posté mon quartier approximatif sur un forum.",
  "Chaque jour il m'écrit quand je refuse, de nouveaux comptes reviennent avec le même ton menaçant.",
];

// Pondération : Analamanga densément peuplée sort en tête, comme dans les stats.
const WEIGHTED = [
  'Analamanga', 'Analamanga', 'Analamanga',
  'Atsinanana', 'Atsinanana',
  "Amoron'i Mania", 'Sava', 'Diana', 'Sofia',
  'Haute Matsiatra', 'Vakinankaratra', 'Boeny',
  'Menabe', 'Ihorombe', 'Analanjirofo', 'Alaotra-Mangoro',
  'Vatovavy', 'Fitovinany', 'Atsimo-Atsinanana', 'Anosy',
  'Atsimo-Andrefana', 'Bongolava', 'Itasy', 'Melaky',
  'Betsiboka', 'Androy', 'Analamanga', 'Atsinanana',
  'Ambatosoa',
];

const PLATFORMS_SEED = ['facebook', 'tiktok', 'whatsapp', 'instagram', 'telegram', 'snapchat', 'twitter', 'imo'];

const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rndInt = (max) => Math.floor(Math.random() * max);

function generate() {
  store.clearAll();
  const TOTAL = 140;

  for (let i = 0; i < TOTAL; i++) {
    const offsetMs = rndInt(14 * 24 * 60) * 60000; // <- jusqu'à 14 jours
    const createdAt = Date.now() - offsetMs - rndInt(86400000);

    // 1 à 3 types de harcèlement
    const typeCount = 1 + rndInt(3);
    const pool = [...INCIDENT_TYPES];
    const types = [];
    for (let k = 0; k < typeCount && pool.length; k++) {
      const t = pool.splice(rndInt(pool.length), 1)[0];
      types.push({ id: t.id, sev: t.sev });
    }

    // 1 à 3 plateformes
    const pPool = [...PLATFORMS_SEED];
    const platCount = 1 + rndInt(3);
    const platforms = [];
    for (let k = 0; k < platCount && pPool.length; k++) {
      platforms.push(pPool.splice(rndInt(pPool.length), 1)[0]);
    }

    const hasSev2 = types.some((t) => t.sev >= 2);
    const severity = hasSev2 && types.length >= 2 ? 3 : hasSev2 ? 2 : 1;

    // ~50 % des signalements incluent un récit (chiffré à l'insertion).
    const note = Math.random() < 0.5 ? rnd(NOTES) : '';

    const rep = {
      id: `AR-${String(i + 1).padStart(3, '0')}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      createdAt,
      region: rnd(WEIGHTED),
      platforms,
      types,
      severity,
      noteEnc: note ? encryptText(note) : null,
      alertStatus: severity >= 3 ? 'queued' : 'none',
    };
    store.insertReport(rep);

    // Une partie des alertes est déjà "envoyée" vers le relais externe.
    if (severity >= 3 && Math.random() < 0.55) {
      queueAlert(rep.id, rnd(['Bureau Anti-Cybercrime — SNCT', 'Ligne Verte Nationale']));
      if (Math.random() < 0.7) {
        const a = store.listAlerts()[0];
        if (a && a.status === 'queued') store.setAlertStatus(a.id, 'sent');
      }
    }
  }

  console.log(`✔ Jeu de démonstration prêt : ${store.count()} signalements anonymes (moteur ${store.engine}).`);
  console.log('  Démarre l’API avec : npm run dev   (dans server/)');
}

// Exécutable en CLI (`node src/seed.js`) ou appelé par la console admin
// (POST /admin/demo-reseed) pour régénérer la démonstration à la volée.
export function generateDemo() {
  generate();
  return { ok: true, total: store.count() };
}

const invokedDirectly =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (invokedDirectly) generate();
