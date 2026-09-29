# Contrat d'Interface API v1 & Gel des Modèles Métier (Frontend <-> FastAPI Backend)

Ce document constitue la **source unique de vérité contractuelle** entre le Frontend React et le Backend FastAPI de la plateforme de vote PolyHack / CEE.
Il a été gelé à l'**Étape 5** pour garantir un développement parallèle sans conflit entre le Développeur A (UI/UX, Parcours Votant) et le Développeur B (Administration, Intégration FastAPI).

---

## 1. Principes & Conventions Générales

- **Format d'échange** : JSON UTF-8 (`Content-Type: application/json; charset=utf-8`)
- **Préfixe global des routes** : `/api`
- **Format des dates et horodatages** : Norme ISO 8601 UTC stricte (`YYYY-MM-DDTHH:mm:ssZ`)
- **Authentification & Session** : Header standard HTTP `Authorization: Bearer <access_token>` (JWT signé par le backend)
- **Source unique de vérité dans le code** : `src/types/models.js` (constantes et enums gelés avec `Object.freeze`)
- **Codes d'état HTTP standards** :
  - `200 OK` : Lecture ou mise à jour traitée avec succès.
  - `201 Created` : Ressource créée (soumission de projet, enregistrement de vote).
  - `400 Bad Request` : Paramètres ou corps de requête syntaxiquement ou sémantiquement invalides.
  - `401 Unauthorized` : Jeton d'authentification absent, malformé ou expiré.
  - `403 Forbidden` : Utilisateur non autorisé (hors liste électorale / whitelist, ou rôle insuffisant).
  - `404 Not Found` : Ressource introuvable.
  - `409 Conflict` : Conflit avec une règle métier (double vote, dépôt pendant le vote, scrutin non ouvert).
  - `422 Unprocessable Entity` : Échec de validation de schéma Pydantic (FastAPI).
  - `423 Locked` : Ressource verrouillée temporairement (ex: consultation des résultats avant dépouillement et publication).

---

## 2. Format d'Erreur Standardisé

Toutes les erreurs renvoyées par le backend FastAPI doivent respecter le schéma uniforme suivant :

```json
{
  "detail": "Description humaine compréhensible du motif de rejet ou d'erreur",
  "code": "CODE_ERREUR_METIER",
  "timestamp": "2026-09-25T13:00:00Z"
}
```

### Table des Codes d'Erreur Métier Partagés (`ERROR_CODES`)

| Code Métier | Code HTTP | Contexte / Règle métier |
|---|---|---|
| `WHITELIST_DENIED` | `403 Forbidden` | Adresse e-mail institutionnelle absente de la liste électorale importée (§3.3). |
| `UNAUTHORIZED` | `401 Unauthorized` | Requête nécessitant une authentification sans token valide. |
| `FORBIDDEN` | `403 Forbidden` | Tentative d'accès à une route avec des privilèges insuffisants (ex: étudiant vers `/api/admin/*`). |
| `TOKEN_EXPIRED` | `401 Unauthorized` | Le jeton JWT a expiré. |
| `ELECTION_NOT_OPEN` | `409 Conflict` | Tentative de vote alors que le scrutin est `a_venir` ou `cloture` (§3.7). |
| `ELECTION_CLOSED` | `409 Conflict` | Le scrutin est clôturé. |
| `ALREADY_VOTED` | `409 Conflict` | Tentative de second vote par un même votant pour le scrutin actif (§3.7). |
| `VOTE_INVALID` | `400 Bad Request` | Projet voté inexistant, retiré ou non validé. |
| `SUBMISSION_CLOSED` | `409 Conflict` | Tentative de soumission d'un projet pendant la période de vote (§3.4). |
| `PROJECT_NOT_FOUND` | `404 Not Found` | Identifiant de projet introuvable. |
| `PROJECT_INVALID` | `400 Bad Request` | Champs obligatoires manquants ou invalides (nom < 3 car, membres vides). |
| `PROJECT_REJECTED_MOTIF_REQUIRED` | `400 Bad Request` | Rejet d'un projet sans motif explicatif (§3.5). |
| `RESULTS_LOCKED` | `423 Locked` | Tentative d'accès aux résultats avant la clôture ou avant publication officielle (§3.9). |
| `RESULTS_NOT_PUBLISHED` | `423 Locked` | Scrutin clôturé mais résultats non encore publiés par l'administrateur (§3.9). |
| `INVALID_CSV_FORMAT` | `400 Bad Request` | Colonnes CSV invalides (obligatoires : nom, prénom, email ; classe optionnelle) (§3.2). |
| `EMPTY_CSV` | `400 Bad Request` | Fichier CSV téléversé vide (§3.2). |
| `VALIDATION_ERROR` | `422 Unprocessable` | Données de requête non conformes aux modèles Pydantic. |

---

## 3. Modèles de Données Gelés (DTOs Partagés)

Les structures ci-dessous sont définies dans `src/types/models.js` et doivent être rigoureusement respectées par le Frontend et le Backend FastAPI.

### 3.1. Modèle Utilisateur (`User`)
```typescript
interface User {
  id: string;               // Ex: "usr-1"
  email: string;            // Ex: "serigne.faye@esp.sn"
  nom: string;              // Ex: "Faye"
  prenom: string;           // Ex: "Serigne Fallou"
  classe?: string;          // Facultatif (ex: "DUT2 GE" ou vide)
  role: 'etudiant' | 'candidat' | 'admin';
}
```

### 3.2. Modèle Scrutin (`Election`)
```typescript
interface Election {
  id: string;               // Ex: "scrutin-polyhack-2026"
  titre: string;            // Ex: "Scrutin PolyHack 2026"
  dateDebut: string;        // ISO 8601 UTC (ex: "2026-09-24T09:00:00Z")
  dateFin: string;          // ISO 8601 UTC (ex: "2026-09-26T18:00:00Z")
  statut: 'a_venir' | 'ouvert' | 'cloture';
  secret: boolean;          // Paramètre de vote secret / anonymat strict (§3.1, §3.8)
  resultatsPublies: boolean;// Publication explicite par l'administrateur (§3.9)
}
```

### 3.3. Modèle Projet (`Project`)
```typescript
interface Project {
  id: string;               // Ex: "proj-1"
  nom: string;              // Ex: "AquaSense"
  description: string;      // Description détaillée
  membres: string[];        // Ex: ["Awa Ndiaye", "Cheikh Diop"]
  filiere?: string;         // Ex: "Génie Informatique"
  statut: 'en_attente' | 'valide' | 'rejete';
  motifRejet?: string;      // Renseigné uniquement si statut === 'rejete' (§3.5)
  voix?: number;            // Accessible UNIQUEMENT après dépouillement et publication
}
```

### 3.4. Modèle Reçu de Vote (`VoteReceipt`)
```typescript
interface VoteReceipt {
  recu: string;             // Format: "PH26-XXXX-XXXX" (empreinte scellée unique)
  horodatage: string;       // ISO 8601 UTC
  projetNom?: string;       // Renvoyé pour confirmation visuelle immédiate au votant
}
```

### 3.5. Modèle Statut de Vote Personnel (`VoteStatus`)
```typescript
interface VoteStatus {
  aVote: boolean;           // true si l'utilisateur a émargé pour le scrutin actif
  recu?: string;            // Présent si aVote === true
  horodatage?: string;      // Présent si aVote === true
}
```

### 3.6. Modèle Résultats Dépouillés (`ElectionResults`)
```typescript
interface ElectionResultItem {
  id: string;               // Ex: "proj-2"
  nom: string;              // Ex: "GridWatch"
  voix: number;             // Ex: 41
  pourcentage: number;      // Ex: 40.6
}

interface ElectionResults {
  publie: boolean;          // true si publié officiellement par l'admin
  totalVoix: number;        // Nombre total d'émargements exprimés
  classement: ElectionResultItem[];
}
```

### 3.7. Modèle Entrée Électorale (`ElectoralEntry`)
```typescript
interface ElectoralEntry {
  nom: string;
  prenom: string;
  classe: string;
  email: string;
}
```

### 3.8. Modèle Enregistrement d'Urne Anonymisée (`UrneRecord`)
```typescript
interface UrneRecord {
  recu: string;             // Reçu scellé unique
  choix: string;            // Nom ou identifiant du projet voté
  horodatage: string;       // Date et heure ISO 8601 UTC
  // STRICTEMENT AUCUNE DONNÉE NOMINATIVE (ni nom, ni email) (§3.10)
}
```

---

## 4. Endpoints Confirmés (Cahier des Charges & UML)

Ces endpoints sont validés par les exigences fonctionnelles et les diagrammes de séquence du projet.

### 4.1. `POST /api/auth/google` (Authentification & Whitelist Google)
- **Règle Métier (§3.3)** : Réception du token Google, extraction de l'email institutionnel, comparaison avec la whitelist importée. Accès refusé (`403`) si absent.
- **Requête** : `{ "id_token": "string" }` (ou `{ "credential": "string" }`)
- **Réponse (`200 OK`)** :
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "usr-1",
      "email": "serigne.faye@esp.sn",
      "nom": "Faye",
      "prenom": "Serigne Fallou",
      "classe": "DUT2 GE",
      "role": "etudiant"
    }
  }
  ```

### 4.1b. `POST /api/auth/voter-login` (Authentification Électeur)
- **Règle Métier (§3.3)** : Route d'authentification directe des électeurs inscrits sur la liste électorale.
- **Requête** :
  ```json
  {
    "email": "serigne.faye@esp.sn"
  }
  ```
- **Réponse (`200 OK`)** :
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "usr-1",
      "email": "serigne.faye@esp.sn",
      "nom": "Faye",
      "prenom": "Serigne Fallou",
      "classe": "DUT2 GE",
      "role": "etudiant"
    }
  }
  ```

### 4.1c. `POST /api/auth/admin-login` (Authentification Administrateur Commission IT)
- **Règle Métier (§2.1)** : Connexion administrateur sécurisée via code d'accès administrateur.
- **Requête** :
  ```json
  {
    "email": "admin.commission-it@esp.sn",
    "passcode": "SECRET_PASSCODE"
  }
  ```
- **Réponse (`200 OK`)** : `{ "access_token": "sec_adm_...", "token_type": "bearer", "user": { ... } }`

### 4.1d. `GET /api/auth/me` (Profil de l'utilisateur connecté)
- **Règle Métier** : Renvoie le profil de l'utilisateur actuellement authentifié via son token Bearer.
- **Réponse (`200 OK`)** : Modèle `User`.

### 4.1e. `POST /api/auth/logout` (Déconnexion utilisateur)
- **Règle Métier** : Invalide la session active côté serveur.
- **Réponse (`200 OK`)** : `{ "success": true }`

### 4.2. `GET /api/scrutin/actif` (Scrutin en cours)
- **Règle Métier (§3.1)** : Fournit l'état courant, les dates limites et les indicateurs d'ouverture au vote et aux dépôts.
- **Réponse (`200 OK`)** : Modèle `Election`.

### 4.3. `GET /api/projects` (Galerie publique des projets)
- **Règle Métier (§3.6)** : Pour les votants et le public, le serveur renvoie **exclusivement** les projets dont le statut est `valide`.
- **Réponse (`200 OK`)** : `Project[]` (sans attribut `voix`).

### 4.4. `GET /api/projects/{id}` (Fiche détaillée projet)
- **Règle Métier (§3.6)** : Consultation du détail d'un projet validé. Renvoie `404` si non existant ou non validé.
- **Réponse (`200 OK`)** : `Project`.

### 4.5. `POST /api/projects` (Soumission de candidature)
- **Règle Métier (§3.4)** : Dépôt d'un projet par un candidat. **Interdit formellement pendant la période de scrutin ouverte (`409 Conflict`)**. Le projet est créé avec `statut: "en_attente"`.
- **Requête** :
  ```json
  {
    "nom": "string (3-120 car)",
    "description": "string (min 20 car)",
    "membres": ["string (nom 1)", "string (nom 2)"]
  }
  ```
- **Réponse (`201 Created`)** : `Project`.

### 4.6. `GET /api/vote/statut` (Vérification d'émargement)
- **Règle Métier (§3.7)** : Vérifie si le votant authentifié a déjà émis son vote pour le scrutin en cours.
- **Réponse (`200 OK`)** : `VoteStatus` (`{ "aVote": boolean, "recu"?: string, "horodatage"?: string }`).

### 4.7. `POST /api/vote` (Enregistrement sécurisé du vote)
- **Règle Métier (§3.7, §3.8)** :
  1. Vérifier la présence sur la liste électorale.
  2. Vérifier que le scrutin est ouvert (`statut === 'ouvert'`).
  3. Vérifier l'absence d'émargement antérieur (`aVote === false`).
  4. Réaliser la transaction atomique (émargement nominatif + insertion anonyme dans l'urne).
  5. Sceller le reçu unique et l'enregistrer dans l'urne.
- **Requête** : `{ "projetId": "string" }`
- **Réponse (`201 Created`)** : `VoteReceipt` (`{ "recu": "PH26-XXXX-XXXX", "horodatage": "...", "projetNom": "..." }`).

### 4.8. `GET /api/resultats` (Dépouillement et Résultats)
- **Règle Métier (§3.9)** : Inaccessible tant que le scrutin n'est pas clôturé (`423 Locked`). Inaccessible au public tant que l'administrateur n'a pas publié (`423 Locked`).
- **Réponse (`200 OK`)** : `ElectionResults`.

### 4.9. `GET /api/admin/scrutin` (Paramètres administrateur)
- **Règle Métier (§3.1)** : Lecture complète de la configuration du scrutin pour l'espace d'administration.
- **Réponse (`200 OK`)** : `Election`.

### 4.10. `PUT /api/admin/scrutin` (Mise à jour configuration scrutin)
- **Règle Métier (§3.1)** : Modification des dates de début/fin, du titre et du paramètre de confidentialité `secret`.
- **Requête** : Partiel ou total de `Election`.
- **Réponse (`200 OK`)** : `Election` mis à jour.

### 4.11. `POST /api/admin/electoral-list/import` (Importation liste électorale)
- **Règle Métier (§3.2)** : Importation du fichier CSV (`nom, prenom, email`, avec `classe` facultative). Reconstitution de la whitelist d'autorisation.
- **Requête** : `{ "csv": "nom,prenom,email..." }`
- **Réponse (`200 OK`)** : `{ "count": number, "total": number }`.

### 4.12. `GET /api/admin/projects` (Modération - Tous les projets)
- **Règle Métier (§3.5)** : Liste complète de tous les projets quel que soit leur statut (`en_attente`, `valide`, `rejete`).
- **Réponse (`200 OK`)** : `Project[]`.

### 4.13. `POST /api/admin/projects/{id}/moderate` (Validation ou rejet)
- **Règle Métier (§3.5)** : L'administrateur valide ou rejette un projet. En cas de rejet, un motif est obligatoirement renseigné.
- **Requête** :
  ```json
  {
    "action": "valider" | "rejeter",
    "motifRejet": "string (obligatoire si action === 'rejeter')"
  }
  ```
- **Réponse (`200 OK`)** : `Project` actualisé.

### 4.14. `POST /api/admin/results/publish` (Publication des résultats)
- **Règle Métier (§3.9)** : Action explicite de l'administrateur pour rendre les résultats visibles aux votants et déclencher les notifications.
- **Requête** : `{ "publie": true }`
- **Réponse (`200 OK`)** : `{ "success": true, "resultatsPublies": true }`.

### 4.15. `GET /api/admin/urne/export` (Export de l'urne anonymisée)
- **Règle Métier (§3.10)** : Export de l'urne pour audit. Ne doit comporter **aucune** donnée d'identité.
- **Réponse (`200 OK`)** : `{ "records": UrneRecord[], "csv": string }`.

---

## 5. Points & Mécanismes Restant à Confirmer avec FastAPI

Les éléments ci-dessous représentent des choix techniques proposés à valider avec le Développeur B lors de l'implémentation backend :

1. **Format d'upload du CSV électoral** :
   - *Option A (actuelle)* : Envoi d'un payload JSON `{ "csv": "texte..." }`.
   - *Option B (à confirmer)* : Téléversement binaire standard `multipart/form-data` avec champ de fichier `file`.
2. **Type MIME de l'export d'urne** :
   - *Option A (actuelle)* : JSON enveloppe `{ records: [...], csv: "..." }`.
   - *Option B (à confirmer)* : Endpoint direct renvoyant le flux binaire `text/csv; charset=utf-8` avec header `Content-Disposition: attachment; filename="urne_anonymisee.csv"`, et optionnellement PDF `application/pdf`.
3. **Pagination des listes volumineuses** :
   - Pour la liste électorale (milliers d'étudiants) : query params standards `?limit=50&offset=0` ou `?page=1&size=50`, renvoyant `{ "items": [...], "total": 1250, "page": 1, "size": 50 }`.
   - Pour les projets : pagination optionnelle (le volume attendu est généralement inférieur à 100 projets par hackathon).
4. **Renouvellement de token (`POST /api/auth/refresh`)** :
   - Proposition d'un endpoint pour rafraîchir le jeton JWT expirant sans forcer une reconnexion Google complète.
5. **Déclenchement des e-mails de notification** :
   - Traitement asynchrone côté backend via tâches de fond (FastAPI `BackgroundTasks` ou Celery worker) pour ne pas bloquer les requêtes HTTP de publication ou de rejet de projet.

---

## 6. Traitement des Opérations Sensibles (Vote & Secret de l'Urne)

Conformément aux exigences §3.7 et §3.8 :

1. **Transaction Atomique Backend** :
   L'enregistrement d'un vote doit impérativement s'exécuter dans une transaction SQL isolée (niveau `SERIALIZABLE` ou verrouillage pessimiste sur la ligne d'émargement de l'étudiant) :
   - Vérification de l'absence d'enregistrement d'émargement préalable.
   - Création de la ligne d'émargement : `(user_id, scrutin_id, date_emargement)`.
   - Génération de l'identifiant cryptographique scellé (`recu`).
   - Insertion dans la table de l'urne : `(recu, projet_id, horodatage)`.
   - **Isolation stricte** : Si `secret === true`, il n'existe aucune clé étrangère ni lien direct entre l'émargement (`user_id`) et le bulletin dans l'urne (`projet_id`).
2. **Idempotence & Prévention du Double Vote** :
   - Côté frontend : Désactivation immédiate du bouton de vote au clic, affichage d'un état de chargement bloquant (`isSubmitting`), puis bascule irréversible vers l'écran de reçu.
   - Côté backend : Contrainte d'unicité `UNIQUE(user_id, scrutin_id)` levant immédiatement une erreur `409 Conflict` (`ALREADY_VOTED`).
3. **Non-répudiation et Reçu Scellé** :
   - Le reçu est conservé localement dans le navigateur pour consultation ultérieure (`/mon-recu`).
   - L'électeur peut vérifier la présence de son reçu dans l'export public de l'urne sans que quiconque ne puisse relier son identité à son choix.

---

## 7. Gestion des Listes, Pagination et États de Chargement Frontend

Pour assurer la cohérence de l'expérience utilisateur et éviter toute divergence entre Développeur A et Développeur B :

1. **États Standardisés d'Affichage** :
   Chaque vue dépendante d'une ressource distante implémente les 4 états canoniques :
   - **`loading`** : Affichage d'un squelette animé (`Skeleton.jsx`) respectant les dimensions finales.
   - **`empty`** : Affichage du composant unifié `EmptyState.jsx` avec message d'action contextualisé.
   - **`error`** : Affichage d'un bandeau ou bloc `Alert.jsx` (variante `error`) avec option de réessai (`Recharger`).
   - **`success`** : Rendu des données métier formatées.
2. **États Métier Spécifiques au Scrutin** :
   - **`already_voted`** : Affichage du reçu d'émargement avec bouton d'accès à la galerie en mode lecture seule.
   - **`results_locked`** : Affichage d'un compte à rebours ou message d'attente expliquant que le scrutin n'est pas encore clôturé ou en cours de validation.
   - **`submission_closed`** : Affichage d'une alerte informative prévenant que les dépôts sont clos pendant la période de vote.
3. **Zéro Émission Hors Services** :
   - Aucun composant React n'appelle Axios directement.
   - Tout appel transite par les services (`projectsService.js`, `voteService.js`, `adminService.js`, etc.).
   - Tous les composants importent leurs enums et constantes depuis `src/types/models.js`.
