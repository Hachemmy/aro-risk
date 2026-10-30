# ─────────────────────────────────────────────────────────────────────────────
# ARO — Dockerfile UNIQUE (tout-en-un)
#   conteneur  =  React (build Vite)  +  API Express  +  base SQLite
#   lancé par :  docker build -t aro .
#                docker run -p 8080:8080 -v ./server/data:/app/server/data aro
# Tout est visible et maîtrisable : le code, la base, la clé de chiffrement.
# ─────────────────────────────────────────────────────────────────────────────

# Étape 1 — construction du frontend React (Vite -> /dist)
FROM node:22-alpine AS client-build
WORKDIR /app/client
COPY client/package.json ./
RUN npm install --no-audit --no-fund
COPY client/ ./
RUN npm run build

# Étape 2 — runtime : Node.js sert l'API anonyme ET le site construit
FROM node:22-alpine
WORKDIR /app/server

COPY server/package.json ./
RUN npm install --omit=dev --no-audit --no-fund
COPY server/src ./src
COPY --from=client-build /app/client/dist ./client-dist

ENV NODE_ENV=production
ENV PORT=8080

# Base de données anonyme disponible en interne (montée en volume au run)
VOLUME /app/server/data

EXPOSE 8080
CMD ["node", "src/index.js"]
