// ─────────────────────────────────────────────────────────────────────────────
// ARO — données de référence.
// Référentiel partagé : régions de Madagascar, types d'incidents, plateformes,
// niveaux de menace, ressources d'aide. Aucune donnée personnelle ici.
// ─────────────────────────────────────────────────────────────────────────────

// Les 24 régions administratives de Madagascar (numérotation officielle,
// ordre alphabétique). La 24e région **Ambatosoa** (créée en 2023 à partir du
// nord de l'Analanjirofo, chef-lieu Maroantsetra) est incluse.
export const REGIONS = [
  'Alaotra-Mangoro',
  'Ambatosoa',
  "Amoron'i Mania",
  'Analamanga',
  'Analanjirofo',
  'Androy',
  'Anosy',
  'Atsimo-Andrefana',
  'Atsimo-Atsinanana',
  'Atsinanana',
  'Betsiboka',
  'Boeny',
  'Bongolava',
  'Diana',
  'Fitovinany',
  'Haute Matsiatra',
  'Ihorombe',
  'Itasy',
  'Melaky',
  'Menabe',
  'Sava',
  'Sofia',
  'Vakinankaratra',
  'Vatovavy',
];

// Les 8 types de cyberharcèlement obligatoires (cahier des charges, étape 1).
// `sev` = gravité unitaire : 2 = cas graves nécessitant escalade externe.
export const INCIDENT_TYPES = [
  { id: 'revenge-porn', label: "Revenge porn — partage d'images intimes non consenti", sev: 2 },
  { id: 'doxing', label: "Doxing — divulgation d'informations privées", sev: 2 },
  { id: 'lynchage', label: 'Lynchage de meute / Cyber-bashing', sev: 1 },
  { id: 'menaces', label: 'Harcèlement textuel et menaces répétées', sev: 2 },
  { id: 'usurpation', label: "Usurpation d'identité / Faux profil", sev: 1 },
  { id: 'humiliation', label: 'Humiliation publique / Publication de moqueries', sev: 1 },
  { id: 'chantage', label: 'Chantage / Sextorsion', sev: 2 },
  { id: 'exclusion', label: 'Exclusion ciblée et harcèlement de groupe en ligne', sev: 1 },
];

// Plateformes proposées à l'étape 3 du formulaire.
export const PLATFORMS = [
  'facebook',
  'tiktok',
  'instagram',
  'whatsapp',
  'snapchat',
  'twitter',
  'telegram',
  'youtube',
  'linkedin',
  'imo',
  'reddit',
  'discord',
  'autre',
];

// Légende de la carte thermique (cahier des charges) :
// Vert clair 0-5 — Jaune 6-15 — Orange 16-30 — Rouge plus de 30 cas.
export const THREAT_LEVELS = [
  { level: 0, name: 'Peu menacé', min: 0, max: 5, color: '#86efac' },
  { level: 1, name: 'Surveillant', min: 6, max: 15, color: '#facc15' },
  { level: 2, name: 'Menacé', min: 16, max: 30, color: '#fb923c' },
  { level: 3, name: 'Critique', min: 31, max: Infinity, color: '#ef4444' },
];

export function threatLevel(count) {
  return THREAT_LEVELS.find((l) => count >= l.min && count <= l.max).level;
}

// Annuaire régional des structures d'aide (prototype : entrées types à
// compléter avec les contacts réels de l'association partenaire).
// `national: true` = structure joignable depuis n'importe quelle région.
export const HELP_RESOURCES = [
  {
    id: 'ligne-verte-nationale',
    region: null,
    national: true,
    name: 'Ligne Verte Nationale — Écoute anonyme',
    role: 'Premier soutien psychologique, orientation, anonymat garanti',
    contact: '034 00 000 00 (numéro type à confirmer par le partenaire)',
    hours: 'Lun-Dim, 24h/24',
  },
  {
    id: 'bureau-cybercrime',
    region: null,
    national: true,
    name: 'Bureau Anti-Cybercrime — SNCT',
    role: 'Instruction des cas graves : sextorsion, revenge porn, chantage',
    contact: 'Canal officiel du gouvernement (détail à compléter)',
    hours: 'Lun-Ven, 08h-17h',
  },
  {
    id: 'reseau-ong-mdg',
    region: null,
    national: true,
    name: 'Réseau ONG — Plateforme soutien aux jeunes malgaches',
    role: 'Accompagnement juridique et social, relais régionaux',
    contact: 'Coordination partenaire (détail à compléter)',
    hours: 'Lun-Ven, 08h-16h',
  },
  {
    id: 'focus-analamanga',
    region: 'Analamanga',
    national: false,
    name: 'Analamanga — Espace Focales Jeunes (remplacer)',
    role: 'Écoute jeunesse en région — permanence collégiens/lycéens',
    contact: '034 00 000 01',
    hours: 'Lun-Sam, 09h-18h',
  },
  {
    id: 'focus-atsinanana',
    region: 'Atsinanana',
    national: false,
    name: 'Atsinanana — Espace Jeunes Sécurité numérique',
    role: 'Écoute et médiation numérique régionale',
    contact: '034 00 000 02',
    hours: 'Lun-Ven, 09h-17h',
  },
  {
    id: 'focus-sava',
    region: 'Sava',
    national: false,
    name: 'Sava — Ligne Montou Soly (remplacer)',
    role: 'Accompagnement psychosocial jeune public',
    contact: '034 00 000 03',
    hours: 'Lun-Ven, 08h-16h',
  },
];
