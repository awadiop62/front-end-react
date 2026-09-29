# HANDOFF TECHNIQUE — PASSAGE DE RELAIS DEV A ➔ DEV B

---

## 1. Contexte du Projet

La **Plateforme de Vote PolyHack** est une application web conçue pour l'organisation et le dépouillement du scrutin officiel de la Commission IT de la CEE ESP Dakar.
Elle garantit :
- L'accès strictement réservé aux étudiants autorisés (contrôle d'accès par Whitelist).
- L'authentification institutionnelle Google SSO.
- L'unicité rigoureuse du vote par électeur.
- Le secret absolu de l'urne et la séparation étanche entre émargement et bulletins.
- Le verrouillage automatique des résultats jusqu'à la clôture et la publication officielle.
- L'auditabilité via l'export de l'urne anonymisée et les reçus scellés.

Ce document formalise le passage de relais technique du **Développeur A** vers le **Développeur B**.

---

## 2. Architecture de l'Équipe

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ÉQUIPE PROJET                                  │
├──────────────────────────────────────┬──────────────────────────────────────┤
│               FRONTEND               │               BACKEND                │
│            (React 19 + Vite)         │          (Python + FastAPI)          │
│                                      │                                      │
│  • Développeur A :                   │  • Développeurs C & D :              │
│    - Socle applicatif & Sécurité     │    - API FastAPI                     │
│    - Authentification Google SSO     │    - Base de données PostgreSQL      │
│    - Parcours Votant & Candidat      │    - Validation cryptographique      │
│    - Reçu & Secret de l'urne         │    - Whitelist électorale SQL        │
│                                      │    - Transactions atomiques de vote  │
│  • Développeur B :                   │    - RBAC & Endpoints /api/admin/*   │
│    - Espace Administration           │    - Moteur de dépouillement         │
│    - Configuration du scrutin        │                                      │
│    - Import Liste électorale (CSV)   │                                      │
│    - Modération des projets          │                                      │
│    - Résultats & Publication         │                                      │
│    - Export d'urne & Dashboard Stats │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┘
```

> **IMPORTANT :** Le backend n'est **ni en Node.js, ni en Express, ni en TypeScript**. Il est développé **exclusivement en Python (FastAPI) + PostgreSQL** par les Développeurs C/D. Le frontend React communique avec FastAPI via les contrats stricts définis dans `API_CONTRACT.md`.

---

## 3. État du Projet après le Travail de Dev A (Socle Stabilisé)

Le Développeur A a finalisé, audité et verrouillé le socle frontend :

1. **Authentification & Session (`ContexteAuth.jsx`, `authService.js`, `main.jsx`)** :
   - `VITE_GOOGLE_CLIENT_ID` lu directement depuis l'environnement ; aucun Client ID fictif en fallback.
   - `login()` ne permet plus aucune injection d'objet utilisateur (`userObj`) ou de jeton arbitraire (`optionalToken`).
   - L'identité, le rôle et le jeton JWT proviennent exclusivement de FastAPI (`POST /api/auth/google`, `POST /api/auth/voter-login`, `POST /api/auth/admin-login`).
   - Redirection automatique et purge de session lors de l'expiration du token JWT (`401`).
2. **Parcours Électeur & Secret de l'Urne (`voteService.js`, `DetailProjet.jsx`, `Recu.jsx`)** :
   - Clé de stockage local du reçu isolée par utilisateur (`polyhack_receipt_<userId>_<scrutinId>`).
   - La déconnexion (`logout()`) nettoie la session et le reçu local de l'utilisateur actif sans toucher aux données d'autrui.
   - **Aucun nom de projet (`projetNom`), identifiant (`projectId`) ou choix du votant n'est persisté localement**.
   - Protection anti-double clic et verrouillage immédiat des boutons d'action pendant la soumission.
3. **Mode Mock & Isolation de Production (`client.js`, `FormulaireConnexionVotant.jsx`)** :
   - `VITE_USE_MOCKS=false` par défaut.
   - **0 import statique** de `mockData.js` dans tout le bundle de production (imports 100% dynamiques et isolés).
   - Aucun basculement automatique silencieux vers les mocks lors d'une erreur réseau FastAPI.
4. **Cache & Performance (`projectsService.js`)** :
   - TTL du cache mémoire fixé à **8 secondes** (entre 5s et 10s).
   - Invalidation automatique du cache sur changement de focus d'onglet (`visibilitychange`) et dès qu'un vote est émis (`castVote`).
5. **Responsive Mobile & Qualité de Code** :
   - Tableaux et formulaires adaptés pour mobile (< 480px) en cartes empilées compactes.
   - `oxlint src` : **0 erreur, 0 avertissement**.
   - `npm run build` : **100% vert**.

---

## 4. Périmètre Exact de Dev B

Le Développeur B prend en charge le **Front-Office d'Administration, la Modération, le Dépouillement, la Publication et les Statistiques**.

Il doit consommer fidèlement les endpoints FastAPI documentés dans `API_CONTRACT.md` sans modifier le socle d'authentification ni le parcours de vote.

---

## 5. Fonctionnalités à Terminer & Règles Métier

### A. Administration du Scrutin
- **Endpoints :** `GET /api/admin/scrutin` et `PUT /api/admin/scrutin`
- **Tâches :**
  - Charger et afficher la configuration courante (Titre, date/heure début, date/heure fin, paramètre `secret`, statut `a_venir` / `ouvert` / `cloture`).
  - Permettre la modification et la sauvegarde avec état de chargement (`savingScrutin`).
  - Mettre à jour l'état partagé du contexte de scrutin (`updateScrutinLocal` / `refreshElection`).

### B. Importation de la Liste Électorale (CSV Whitelist)
- **Endpoint :** `POST /api/admin/electoral-list/import`
- **Tâches :**
  - Permettre le téléversement ou glisser-déposer de fichiers CSV (`nom, prenom, email`).
  - Analyser localement la structure du fichier (détection d'entêtes, validation basique des e-mails avec `@esp.sn`).
  - Transmettre le payload `{ csv: string, records: Array }` à FastAPI.
  - Afficher le retour serveur (`{ count: number, total: number }`) ou l'erreur formatée (`INVALID_CSV_FORMAT`, `EMPTY_CSV`).
  - Bloquer les soumissions concurrentes pendant l'import (`importing`).

### C. Modération des Projets Candidats
- **Endpoints :** `GET /api/admin/projects` et `POST /api/admin/projects/{id}/moderate`
- **Tâches :**
  - Lister l'intégralité des projets avec filtres de statut (`en_attente`, `valide`, `rejete`).
  - Visualiser la fiche complète d'un projet (nom, description, porteur, membres de l'équipe).
  - Actions : **Valider** ou **Rejeter**.
  - **Règle d'or :** En cas de rejet, la saisie d'un **motif de rejet explicatif est obligatoire** (`PROJECT_REJECTED_MOTIF_REQUIRED`).
  - Invalider le cache des projets (`clearApiCache('projects')`) après chaque décision.

### D. Consultation des Résultats
- **Endpoint :** `GET /api/resultats`
- **Tâches :**
  - Si FastAPI répond `423 Locked` (`RESULTS_LOCKED` / `RESULTS_NOT_PUBLISHED`), afficher l'état d'attente informatif.
  - Si le scrutin est clos et publié, afficher le classement officiel, le total des voix et les pourcentages certifiés.
  - **Le frontend ne calcule jamais lui-même les résultats : il affiche les données renvoyées par FastAPI.**

### E. Publication des Résultats
- **Endpoint :** `POST /api/admin/results/publish`
- **Tâches :**
  - Fournir un bouton d'action explicite avec modale de confirmation.
  - Payload : `{ publie: boolean }`.
  - Rafraîchir l'affichage et diffuser un toast de confirmation.

### F. Export Anonymisé de l'Urne
- **Endpoint :** `GET /api/admin/urne/export`
- **Tâches :**
  - Récupérer les données anonymisées de l'urne (`{ records: UrneRecord[], csv: string }`).
  - Déclencher le téléchargement du fichier CSV d'audit côté client.
  - Fournir une option d'impression / export PDF de l'état d'émargement.
  - **Règle absolue : L'export ne doit contenir aucune donnée nominative d'électeur.**

### G. Statistiques & Dashboard de Contrôle
- **Endpoint :** `GET /api/admin/stats`
- **Tâches :**
  - Afficher le taux de participation global, la répartition et l'évolution temporelle.
  - Éviter le polling agressif (utiliser un bouton de rafraîchissement manuel ou un intervalle raisonnable $\ge 30\text{s}$).

---

## 6. Fichiers que Dev A Dépose dans le Dépôt Commun

Les fichiers suivants constituent la livraison de Dev A :

```
/
├── .env.example
├── API_CONTRACT.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── README.md
├── package.json
├── vite.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── types/
│   │   └── models.js
│   ├── styles/
│   │   └── global.css
│   ├── api/
│   │   ├── client.js
│   │   ├── authService.js
│   │   ├── voteService.js
│   │   ├── projectsService.js
│   │   ├── adminService.js
│   │   ├── resultsService.js
│   │   └── mocks/
│   │       └── mockData.js
│   ├── contextes/
│   │   ├── ContexteAuth.jsx
│   │   ├── ContexteScrutin.jsx
│   │   ├── ContexteModeApp.jsx
│   │   ├── ContexteToast.jsx
│   │   └── ContexteTheme.jsx
│   ├── hooks/
│   │   ├── useEstMobile.js
│   │   └── useTableauBordAdmin.js
│   ├── composants/
│   │   ├── auth/
│   │   │   └── FormulaireConnexionVotant.jsx
│   │   ├── ui/
│   │   │   ├── Bouton.jsx
│   │   │   ├── Carte.jsx
│   │   │   ├── Alerte.jsx
│   │   │   ├── Insigne.jsx
│   │   │   ├── Modale.jsx
│   │   │   ├── ChampSaisie.jsx
│   │   │   ├── EtatVide.jsx
│   │   │   ├── Squelette.jsx
│   │   │   └── GestionnaireErreurs.jsx
│   │   └── administrateur/
│   │       ├── En_teteAdmin.jsx
│   │       ├── OngletsNavAdmin.jsx
│   │       ├── PanneauConfigScrutin.jsx
│   │       ├── PanneauListeElectorale.jsx
│   │       ├── ZoneDepotCsv.jsx
│   │       ├── FluxApprobationProjet.jsx
│   │       ├── PanneauResultatsScrutin.jsx
│   │       ├── PanneauExportUrne.jsx
│   │       └── charts/
│   │           ├── ClassParticipationChart.jsx
│   │           ├── ParticipationGaugeChart.jsx
│   │           ├── ProjectVotesBarChart.jsx
│   │           ├── RealtimeStatsDashboard.jsx
│   │           └── VotesTimelineChart.jsx
│   └── pages/
│       ├── accueil/Accueil.jsx
│       ├── connexion/Connexion.jsx
│       ├── votant/
│       │   ├── GalerieProjets.jsx
│       │   ├── DetailProjet.jsx
│       │   └── Recu.jsx
│       ├── candidat/SoumettreProjet.jsx
│       ├── administrateur/Administrateur.jsx
│       └── resultats/Resultats.jsx
```

---

## 7. Fichiers que Dev B Peut Modifier

| Fichier | Fonctionnalité | Action Attendue de Dev B | Coordination |
|---|---|---|---|
| `src/pages/administrateur/Administrateur.jsx` | Page d'accueil admin | Organiser l'affichage des panneaux d'administration et gérer les onglets. | Vérifier la liaison avec `useTableauBordAdmin`. |
| `src/hooks/useTableauBordAdmin.js` | Logique d'état admin | Orchestrer les appels asynchrones admin, les états `loading`/`saving` et les toasts. | Utiliser les méthodes de `adminService.js`. |
| `src/composants/administrateur/PanneauConfigScrutin.jsx` | Configuration scrutin | Formulaire de réglage des dates, titre et secret de vote. | Respecter les DTOs `Election`. |
| `src/composants/administrateur/PanneauListeElectorale.jsx` | Whitelist électorale | Recherche, affichage responsive (cartes/tableau) et modèle CSV. | Préserver la réactivité mobile. |
| `src/composants/administrateur/ZoneDepotCsv.jsx` | Upload CSV | Parsing local et envoi du fichier à FastAPI. | Gérer les retours d'erreurs 400/422. |
| `src/composants/administrateur/FluxApprobationProjet.jsx` | Modération projets | Interface de validation/rejet avec saisie obligatoire du motif de rejet. | Gérer le rafraîchissement d'état. |
| `src/composants/administrateur/PanneauResultatsScrutin.jsx` | Résultats admin | Affichage du dépouillement et déclenchement de la publication. | Gérer le statut `423 Locked`. |
| `src/composants/administrateur/PanneauExportUrne.jsx` | Export d'urne | Déclenchement de l'export CSV et impression PDF. | Aucune donnée d'identité dans l'export. |
| `src/composants/administrateur/charts/*` | Graphiques statistiques | Affichage visuel des métriques administratives. | Brancher sur `fetchAdminStats()`. |
| `src/api/adminService.js` | Services API admin | Implémenter les méthodes d'appels HTTP vers `/api/admin/*`. | Conforme à `API_CONTRACT.md`. |
| `src/api/resultsService.js` | Service résultats | Requêtage de `GET /api/resultats`. | Conforme à `API_CONTRACT.md`. |
| `src/pages/resultats/Resultats.jsx` | Page résultats publique | Affichage public des résultats une fois publiés. | Gérer les 4 états canoniques. |

---

## 8. Fichiers que Dev B Doit Créer

> **Analyse préalable :** L'arborescence actuelle contient déjà les composants et services nécessaires. Dev B n'a **aucun nouveau fichier structurel à créer obligatoirement**, évitant ainsi toute dispersion ou duplication de code.

*Si Dev B souhaite créer des sous-composants spécifiques d'aide à la modération (ex: modale de confirmation avancée), il devra les placer dans `src/composants/administrateur/` sans dupliquer les composants UI de base (`src/composants/ui/`).*

---

## 9. Fichiers que Dev B NE DOIT PAS Modifier (Fichiers Verrouillés)

| Fichier | Justification / Risque en cas de modification |
|---|---|
| **`src/main.jsx`** | Initialisation sécurisée de `<GoogleOAuthProvider>`. Risque de casser la connexion Google SSO. |
| **`src/contextes/ContexteAuth.jsx`** | Gestion centralisée de session et d'authentification. Aucune injection arbitraire d'utilisateur. |
| **`src/api/client.js`** | Client HTTP central, gestion des tokens Bearer, intercepteur d'erreurs HTTP et cache TTL. |
| **`src/api/authService.js`** | Procédure d'authentification, gestion des rôles réels et déconnexion propre. |
| **`src/api/voteService.js`** | Scellement du reçu, isolation du stockage local et préservation de l'anonymat de l'urne. |
| **`src/pages/votant/*`** | Parcours d'émargement et consultation du reçu audités et validés. |
| **`src/pages/candidat/*`** | Formulaire de soumission de projet avec blocage strict pendant le vote. |
| **`src/composants/auth/*`** | Formulaire de connexion avec gestion dynamique de `VITE_GOOGLE_CLIENT_ID`. |
| **`src/types/models.js`** | Modèles et enums métiers partagés avec FastAPI (gelés à l'Étape 5). |

---

## 10. Fichiers Communs & Procédure de Coordination

| Fichier Commun | Propriétaire | Modifications Autorisées pour Dev B | Procédure de Coordination |
|---|---|---|---|
| **`src/types/models.js`** | Dev A | Aucune modification sans concertation préalable. | Si un champ DTO change côté backend, accord obligatoire avec Dev A et C/D. |
| **`src/styles/global.css`** | Partagé | Ajout de classes utilitaires spécifiques admin autorisées. | Ne pas modifier les variables de thème (`:root`), le reset CSS ou les styles d'impression. |
| **`src/contextes/ContexteScrutin.jsx`** | Partagé | Utilisation des méthodes exposées (`refreshElection`, `updateScrutinLocal`). | Ne pas altérer la logique de calcul de phase (`isVoteOuvert`, `isDepotOuvert`). |
| **`API_CONTRACT.md`** | Équipe (Gelé) | Aucune modification unilatérale. | Toute évolution nécessite une revue d'équipe formelle. |

---

## 11. Endpoints FastAPI Consommés par Dev B

| Fonctionnalité | Méthode | Endpoint FastAPI | Droits / Rôle | Payload Requête | Réponse Attendue (`200 OK`) |
|---|---|---|---|---|---|
| Configuration Scrutin | `GET` | `/api/admin/scrutin` | `admin` | Aucun | `Election` (JSON) |
| Mise à jour Scrutin | `PUT` | `/api/admin/scrutin` | `admin` | `Partial<Election>` | `Election` (JSON actualisé) |
| Import Whitelist | `POST` | `/api/admin/electoral-list/import` | `admin` | `{ csv: string, records: Array }` | `{ count: number, total: number }` |
| Liste des Projets | `GET` | `/api/admin/projects` | `admin` | Aucun | `Project[]` (tous statuts) |
| Modération Projet | `POST` | `/api/admin/projects/{id}/moderate` | `admin` | `{ action: "valider"\|"rejeter", motifRejet?: string }` | `Project` (JSON actualisé) |
| Consultation Résultats | `GET` | `/api/resultats` | Public / `admin` | Aucun | `ElectionResults` (ou `423 Locked`) |
| Publication Résultats | `POST` | `/api/admin/results/publish` | `admin` | `{ publie: boolean }` | `{ success: true, resultatsPublies: true }` |
| Exportation de l'Urne | `GET` | `/api/admin/urne/export` | `admin` | Aucun | `{ records: UrneRecord[], csv: string }` |
| Statistiques Admin | `GET` | `/api/admin/stats` | `admin` | Aucun | `AdminStats` (JSON) |

---

## 12. Règles de Sécurité Frontend

1. **Le client n'est jamais une autorité de sécurité** : L'accès aux pages d'administration est vérifié par FastAPI sur chaque requête via le header `Authorization: Bearer <token>`.
2. **Aucun secret dans le bundle** : Jamais de clé secrète, mot de passe de base de données ou clé privée Google dans le code React.
3. **Zéro journalisation sensible** : Aucun `console.log` contenant des tokens JWT, des mots de passe ou des données personnelles d'étudiants.
4. **Secret du vote inviolable** : L'export d'urne ne doit manipuler que les reçus et choix, **jamais d'e-mails ou de noms**.

---

## 13. Règles UI/UX (CEE Design System)

- **Charte Graphique ESP/CEE** : Utiliser exclusivement les variables CSS définies (`var(--accent)`, `var(--bg)`, `var(--surface)`, `var(--border)`, `var(--ink)`).
- **États Standardisés** : Toute vue distante doit implémenter les 4 états :
  1. `loading` : Squelette visuel (`Squelette.jsx` / `PageSpinner`).
  2. `empty` : Message contextualisé (`EtatVide.jsx`).
  3. `error` : Bannière d'erreur avec bouton de réessai (`Alerte.jsx`).
  4. `success` : Affichage structuré.
- **Micro-Interactions** : État `loading` obligatoire sur chaque bouton déclenchant une mutation réseau (`savingScrutin`, `importing`, `moderating`, `publishing`, `exportingUrne`).

---

## 14. Règles Responsive Mobile

- **Écrans cibles :** 320px, 375px, 390px, 430px, 768px, 1366px.
- **Sous 480px / 640px :**
  - Pas de tableaux à défilement horizontal infini.
  - Utiliser des **cartes empilées compactes** (`electoralList`, `projects`).
  - Boutons d'action pleine largeur (`width: 100%`) avec hauteur tactile $\ge 44\text{px}$.

---

## 15. Gestion des Erreurs HTTP Normalisées

| Code HTTP | Cause / Contexte | Traitement Frontend Attendu par Dev B |
|---|---|---|
| `400 Bad Request` | Paramètres invalides (ex: rejet sans motif). | Afficher le message `detail` retourné par FastAPI dans un toast ou une alerte de formulaire. |
| `401 Unauthorized` | Jeton JWT expiré ou absent. | L'intercepteur Axios redirige automatiquement vers `/connexion?expired=true`. |
| `403 Forbidden` | Accès refusé (non inscrit sur la whitelist ou rôle insuffisant). | Afficher un écran ou une alerte de refus formel d'accès. |
| `404 Not Found` | Projet ou ressource introuvable. | Afficher l'état vide `EtatVide.jsx` avec bouton de retour. |
| `409 Conflict` | Conflit de phase (ex: modification impossible en cours de vote). | Alerte d'information métier claire expliquant la contrainte. |
| `422 Unprocessable` | Échec de validation du schéma Pydantic FastAPI. | Pointer les champs du formulaire non conformes. |
| `423 Locked` | Résultats non clôturés ou non publiés. | Afficher l'encart d'attente officiel (compte à rebours / bandeau informatif). |
| `429 Too Many Req` | Rate limiting dépassé. | Toast d'avertissement demandant de patienter quelques secondes. |
| `500 / 503` | Erreur interne du serveur backend FastAPI. | Bannière d'erreur technique avec option « Réessayer ». |

---

## 16. Tests Obligatoires à Réaliser par Dev B

### A. Administration & Configuration
- [ ] Chargement de la configuration via `GET /api/admin/scrutin`.
- [ ] Modification et sauvegarde des dates via `PUT /api/admin/scrutin`.
- [ ] Activation/désactivation du paramètre `secret`.

### B. Import CSV
- [ ] Téléversement d'un CSV valide (`nom, prenom, classe, email`) et vérification du toast de succès.
- [ ] Téléversement d'un fichier invalide ou vide et affichage de l'erreur explicite.
- [ ] Vérification du blocage des clics multiples pendant l'import (`importing === true`).

### C. Modération des Projets
- [ ] Validation d'un projet en attente et passage au statut `valide`.
- [ ] Tentative de rejet sans motif (doit être bloquée avec message d'explication).
- [ ] Rejet d'un projet avec motif et vérification de la mise à jour immédiate.

### D. Résultats & Publication
- [ ] Consultation des résultats avant clôture (vérification de la gestion de `423 Locked`).
- [ ] Clôture du scrutin et affichage du classement dépouillé.
- [ ] Publication officielle via `POST /api/admin/results/publish` avec modale de confirmation.

### E. Export de l'Urne
- [ ] Téléchargement du CSV d'audit via `GET /api/admin/urne/export`.
- [ ] Vérification que le CSV ne contient **aucun nom ni e-mail**.
- [ ] Test de l'impression PDF via `window.print()`.

### F. Responsive & Qualité
- [ ] Test d'affichage sur simulateur mobile (320px et 375px).
- [ ] Exécution de `oxlint src` (0 erreur).
- [ ] Exécution de `npm run build` (Build réussi).

---

## 17. Critères d'Acceptation Globaux

1. **Zéro Régression** : Le parcours de vote et l'authentification Google SSO continuent de fonctionner parfaitement.
2. **Conformité API** : Tous les appels admin utilisent les signatures DTO de `API_CONTRACT.md`.
3. **Étanchéité Mock** : Le mode réel `VITE_USE_MOCKS=false` communique directement avec FastAPI sans dépendance résiduelle aux mocks.
4. **Fluidité UI** : Tout appel asynchrone dispose d'un retour visuel (`loading`, `toast`, `alert`).

---

## 18. Ce que Dev B NE DOIT ABSOLUMENT PAS Faire (Zone Interdite)
- ❌ **Ne pas créer de base de données PostgreSQL ou Redis côté frontend**.
- ❌ **Ne pas modifier les schémas SQL ou les contraintes de table**.
- ❌ **Ne pas modifier la logique de validation cryptographique Google**.
- ❌ **Ne pas contourner les vérifications de permissions par du code client non certifié**.
- ❌ **Ne pas réintroduire d'imports statiques de `mockData.js`**.
- ❌ **Ne pas modifier unilatéralement `API_CONTRACT.md`**.

---

## 19. Dépendances avec les Développeurs C/D (FastAPI / PostgreSQL)

| Ce que Dev B Consomme (Frontend) | Ce que Dev C/D Doivent Fournir (Backend) |
|---|---|
| Requêtes HTTP JSON standardisées avec token Bearer. | Validation cryptographique du token Google et génération du JWT de session. |
| Données de la configuration du scrutin (`GET /api/admin/scrutin`). | Persistance PostgreSQL de la table `election_config`. |
| Envoi du fichier CSV (`POST /api/admin/electoral-list/import`). | Parsing serveur, validation des adresses e-mail et insertion dans la table `electoral_list`. |
| Actions de modération (`POST /api/admin/projects/{id}/moderate`). | Mise à jour du statut en base et envoi asynchrone des e-mails aux candidats. |
| Données de résultats dépouillés (`GET /api/resultats`). | Calcul des voix, des pourcentages et verrouillage HTTP 423 tant que `statut !== 'cloture'`. |
| Données d'audit de l'urne (`GET /api/admin/urne/export`). | Extraction anonymisée stricte de la table `urne_votes` sans jointure nominative. |

---

## 20. Procédure de Livraison & Organisation Git

### Workflow de Branches
```
main (branche de production stable)
  └── dev-integration (branche commune frontend stabilisée par Dev A)
        └── feature/frontend-b-admin (branche de travail de Dev B)
```

### Étapes pour Dev B :

1. **Récupération de la base stabilisée :**
   ```bash
   git fetch origin
   git checkout dev-integration
   git pull origin dev-integration
   ```
2. **Création de la branche de travail :**
   ```bash
   git checkout -b feature/frontend-b-admin
   ```
3. **Développement & Tests Locaux :**
   - Lancer l'application : `npm run dev`.
   - Tester avec `VITE_USE_MOCKS=true` pour le prototypage local ou `VITE_USE_MOCKS=false` avec FastAPI lancé sur le port 8000.
4. **Contrôles Qualité avant Commit :**
   ```bash
   npm run lint   # Validation du linter (oxlint)
   npm run build  # Validation de la compilation Vite
   ```
5. **Soumission de la Pull Request :**
   - Pousser la branche : `git push origin feature/frontend-b-admin`.
   - Ouvrir une Pull Request vers `dev-integration`.
   - Revue conjointe avec Dev A et Dev C/D avant fusion finale.
