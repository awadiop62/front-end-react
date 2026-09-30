# Plateforme de Vote Électronique PolyHack / ESP Commission CEE

Application web officielle de vote électronique développée pour le scrutin PolyHack, conçue pour être pérenne et réutilisable pour les scrutins de la Commission Électorale Étudiante (CEE) de l'École Supérieure Polytechnique (ESP).

---

## 🚀 Démarrage Rapide

### Prérequis
- **Node.js** >= 18.0.0 (recommandé : v20+)
- **npm** >= 9.0.0

### Installation
Installez les dépendances strictement à partir du lockfile de référence :
```bash
npm ci
```

### Lancement en Développement
Démarre le serveur local Vite sur le port 3000 :
```bash
npm run dev
```
L'application est accessible sur : `http://localhost:3000`

---

## 🛠️ Deux modes indépendants (Mocks vs API Réelle)

La plateforme est conçue pour être 100% autonome et découplée de son backend grâce à une couche de services unifiée (`src/api/*.js`). Le mode est piloté par la variable d'environnement `VITE_USE_MOCKS` :

### 1. Mode Mocks (par défaut : `VITE_USE_MOCKS=true`)
- **Aucun backend requis** : la commande `npm run dev` suffit pour démarrer l'application.
- L'ensemble du parcours utilisateur (authentification Google SSO, consultation de la galerie, vote anonyme avec reçu certifié, soumission de projets, modération, publication des résultats et export de l'urne) s'exécute de façon autonome avec des données simulées stockées localement.
- Idéal pour les démonstrations, les tests fonctionnels et le développement UI/UX hors-ligne.

### 2. Mode API Réelle (`VITE_USE_MOCKS=false`)
- **Connexion à un backend conforme** : Les composants React ne changent pas d'une seule ligne ; les services `src/api/*.js` redirigent toutes les opérations vers l'API spécifiée par `VITE_API_BASE_URL` :
  - **Serveur Express local (`server.ts`)** : démonstrateur complet prêt à l'emploi (`npm start` ou `npx tsx server.ts`), implémentant rigoureusement `API_CONTRACT.md`.
  - **Backend FastAPI de production** : pointer simplement `VITE_API_BASE_URL=http://localhost:8000/api` (ou l'URL du serveur hébergé).
- Les deux implémentations backend respectent à la lettre le contrat d'interface [API_CONTRACT.md](./API_CONTRACT.md) (mêmes routes, mêmes verbes HTTP, mêmes codes d'erreur et mêmes schémas JSON).

---

## 🧪 Commandes de Validation & Qualité

Chaque contribution doit valider sans erreur les commandes suivantes :

```bash
# Vérification du code (Linter Oxlint ultra-rapide)
npm run lint

# Compilation de production (Vite Build)
npm run build

# Prévisualisation locale du build
npm run preview
```

---

## 👥 Organisation du Binôme & Documentation Technique

Le projet est développé par un binôme avec séparation stricte des responsabilités :
- **Développeur A** : UI/UX, Design System CEE, Shell responsive, Parcours Votant (`/connexion`, `/hub`, `/galerie`, `/projets/:id`, `/mon-recu`).
- **Développeur B** : Espace Administration (`/admin/*`), Modération, Import CSV, Dépouillement/Résultats, Export Urne, Intégration Client HTTP FastAPI.

Pour aller plus loin, consultez les documents de cadrage :
- 📋 [API_CONTRACT.md](./API_CONTRACT.md) : Contrat d'interface v1 entre le Frontend et l'API FastAPI backend.
- 🤝 [DEV_B.md](./CONTRIBUTING.md) : Stratégie de branches Git, workflow de pull request et conventions de nommage.
