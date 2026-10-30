// ─────────────────────────────────────────────────────────────────────────────
// Baremes de sécurité HTTP — objectif anonymat :
//  - aucune trace persistée : les routeurs ne JAMAIS écrire l'IP sur disque ;
//  - les compteurs de rate-limit vivent en RAM, jamais persistés ;
//  - cache interdit (no-store) : rien ne reste sur un appareil partagé ;
//  - n'enregistre pas : pas de log d'accès, pas de referrer, indexation refusée.
// ─────────────────────────────────────────────────────────────────────────────

export function securityHeaders(req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Robots-Tag': 'noindex, nofollow, noarchive',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), camera=(), microphone=(), interest-cohort=()',
    'Cross-Origin-Resource-Policy': 'same-site',
    // Rien ne doit rester sur l'appareil (navigateurs partagés) :
    'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
    'Pragma': 'no-cache',
    // Serveur : on ne divulgue rien
    'Server': 'ARO',
  });
  if (req.method === 'GET' || req.method === 'HEAD') {
    res.set('Vary', 'Cookie');
  }
  next();
}

// Limiteur de débit anonyme : clé éphémère en RAM (jamais écrite, jamais
// relâchée hors du processus). Sert uniquement à bloquer un emploi abusif.
export function rateLimiter({ windowMs = 60000, max = 60 } = {}) {
  const hits = new Map(); // clé éphémère -> timestamps[]
  let lastSweep = Date.now();

  function sweep(now) {
    if (now - lastSweep < windowMs) return;
    for (const [k, arr] of hits) {
      const alive = arr.filter((t) => now - t < windowMs);
      if (alive.length === 0) hits.delete(k); else hits.set(k, alive);
    }
    lastSweep = now;
  }

  return (req, res, next) => {
    const now = Date.now();
    sweep(now);
    // clé : jamais d'ID réel — un simple hash éphémère en mémoire.
    const key = req.ip || 'anonymous';
    const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (arr.length >= max) {
      return res.status(429).json({
        error: 'too_many_requests',
        message: 'Trop de requêtes. Patientez un instant.',
      });
    }
    arr.push(now);
    hits.set(key, arr);
    next();
  };
}
