// ─────────────────────────────────────────────────────────────────────────────
// ARO — référentiel client.
// Les 24 régions administratives de Madagascar (numérotation officielle,
// ordre alphabétique — la 24e région Ambatosoa est créée en 2023 à partir du
// nord de l'Analanjirofo, chef-lieu Maroantsetra).
// `n` = numéro affiché sur la carte schématique.
// ─────────────────────────────────────────────────────────────────────────────
export const REGIONS = [
  { n: 1,  name: 'Alaotra-Mangoro' },
  { n: 2,  name: 'Ambatosoa' },
  { n: 3,  name: "Amoron'i Mania" },
  { n: 4,  name: 'Analamanga' },
  { n: 5,  name: 'Analanjirofo' },
  { n: 6,  name: 'Androy' },
  { n: 7,  name: 'Anosy' },
  { n: 8,  name: 'Atsimo-Andrefana' },
  { n: 9,  name: 'Atsimo-Atsinanana' },
  { n: 10, name: 'Atsinanana' },
  { n: 11, name: 'Betsiboka' },
  { n: 12, name: 'Boeny' },
  { n: 13, name: 'Bongolava' },
  { n: 14, name: 'Diana' },
  { n: 15, name: 'Fitovinany' },
  { n: 16, name: 'Haute Matsiatra' },
  { n: 17, name: 'Ihorombe' },
  { n: 18, name: 'Itasy' },
  { n: 19, name: 'Melaky' },
  { n: 20, name: 'Menabe' },
  { n: 21, name: 'Sava' },
  { n: 22, name: 'Sofia' },
  { n: 23, name: 'Vakinankaratra' },
  { n: 24, name: 'Vatovavy' },
];

// Rangées de la carte schématique « MADAGASCAR — Carte schématique des 24 régions »
// (approximation géographique de l'île, du nord au sud, comme la maquette).
export const MAP_ROWS = [
  [14],                 // Diana
  [21, 22],             // Sava · Sofia
  [12, 11, 5],          // Boeny · Betsiboka · Analanjirofo
  [19, 13, 1],          // Melaky · Bongolava · Alaotra-Mangoro
  [18, 4, 10],          // Itasy · Analamanga · Atsinanana
  [23, 24, 15],         // Vakinankaratra · Vatovavy · Fitovinany
  [20, 16, 3],          // Menabe · Haute Matsiatra · Amoron'i Mania
  [17, 9],              // Ihorombe · Atsimo-Atsinanana
  [8, 7, 6],            // Atsimo-Andrefana · Anosy · Androy
  [2],                  // Ambatosoa
];

export const REGION_NAMES = REGIONS.map((r) => r.name);

export const INCIDENT_TYPES = [
  { id: 'revenge-porn', label: 'Revenge porn / Partage d\'images intimes non consenti' },
  { id: 'doxing',       label: 'Doxing (divulgation d\'infos privées)' },
  { id: 'lynchage',     label: 'Lynchage de meute / Cyber-bashing' },
  { id: 'menaces',      label: 'Harcèlement textuel et menaces répétées' },
  { id: 'usurpation',   label: 'Usurpation d\'identité / Faux profil' },
  { id: 'humiliation',  label: 'Humiliation publique / Publication de moqueries' },
  { id: 'chantage',     label: 'Chantage ou sextorsion' },
  { id: 'exclusion',    label: 'Exclusion ciblée et harcèlement de groupe en ligne' },
];

export const PLATFORMS = [
  { id: 'facebook',  label: 'Facebook' },
  { id: 'tiktok',    label: 'TikTok' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'whatsapp',  label: 'WhatsApp' },
  { id: 'snapchat',  label: 'Snapchat' },
  { id: 'twitter',   label: 'X (Twitter)' },
  { id: 'telegram',  label: 'Telegram' },
  { id: 'youtube',   label: 'YouTube' },
  { id: 'linkedin',  label: 'LinkedIn' },
  { id: 'imo',       label: 'IMO' },
  { id: 'reddit',    label: 'Reddit' },
  { id: 'discord',   label: 'Discord' },
  { id: 'autre',     label: 'Autre plateforme' },
];

// Libellés courts partagés par le tableau de bord et le journal.
export const TYPE_LABELS = {
  'revenge-porn': 'Revenge porn',
  'doxing': 'Doxing',
  'lynchage': 'Lynchage de meute',
  'menaces': 'Harcèlement textuel',
  'usurpation': "Usurpation d'identité",
  'humiliation': 'Humiliation publique',
  'chantage': 'Chantage / Sextorsion',
  'exclusion': 'Exclusion ciblée',
};
export const typeLabel = (id) => TYPE_LABELS[id] ?? id;

export const THREAT_COLORS = ['#86efac', '#facc15', '#fb923c', '#ef4444'];
export const THREAT_LABELS = ['0 – 5 cas', '6 – 15 cas', '16 – 30 cas', '+30 cas'];
export const LEVEL_OF = (count) => (count >= 31 ? 3 : count >= 16 ? 2 : count >= 6 ? 1 : 0);
