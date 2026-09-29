/**
 * Modèles Métier Partagés, Constantes et Énumérations
 * Source unique de vérité pour le Frontend (Développeur A, Développeur B) et référence pour FastAPI
 * 
 * CE FICHIER EST GELÉ. Toute modification doit faire l'objet d'un accord dans API_CONTRACT.md.
 */

// ============================================================================
// 1. ÉNUMÉRATIONS ET CONSTANTES MÉTIER
// ============================================================================

/**
 * Rôles utilisateurs autorisés sur la plateforme
 */
export const USER_ROLES = Object.freeze({
  STUDENT: 'etudiant',
  CANDIDATE: 'candidat',
  ADMIN: 'admin',
  VOTER: 'votant',
});

export const isAdminRole = (role) => role === 'admin' || role === USER_ROLES.ADMIN;
export const isVoterRole = (role) => role === 'votant' || role === 'etudiant' || role === 'candidat' || role === USER_ROLES.STUDENT || role === USER_ROLES.VOTER || role === USER_ROLES.CANDIDATE;

/**
 * Statuts possibles d'un scrutin
 */
export const ELECTION_STATUS = Object.freeze({
  UPCOMING: 'a_venir',
  OPEN: 'ouvert',
  CLOSED: 'cloture',
});

/**
 * Statuts possibles d'un projet soumis
 */
export const PROJECT_STATUS = Object.freeze({
  PENDING: 'en_attente',
  VALIDATED: 'valide',
  REJECTED: 'rejete',
});

/**
 * Actions de modération applicables par l'administrateur
 */
export const MODERATION_ACTIONS = Object.freeze({
  VALIDATE: 'valider',
  REJECT: 'rejeter',
});

/**
 * Codes d'erreur métier standardisés (échangés avec FastAPI)
 */
export const ERROR_CODES = Object.freeze({
  // Authentification & Autorisation
  WHITELIST_DENIED: 'WHITELIST_DENIED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Scrutin & Vote
  ELECTION_NOT_OPEN: 'ELECTION_NOT_OPEN',
  ELECTION_CLOSED: 'ELECTION_CLOSED',
  ALREADY_VOTED: 'ALREADY_VOTED',
  VOTE_INVALID: 'VOTE_INVALID',

  // Projets & Candidatures
  CANDIDATURE_CLOSED: 'CANDIDATURE_CLOSED',
  SUBMISSION_CLOSED: 'SUBMISSION_CLOSED',
  PROJECT_NOT_FOUND: 'PROJECT_NOT_FOUND',
  PROJECT_INVALID: 'PROJECT_INVALID',
  PROJECT_REJECTED_MOTIF_REQUIRED: 'PROJECT_REJECTED_MOTIF_REQUIRED',

  // Résultats & Urne
  RESULTS_LOCKED: 'RESULTS_LOCKED',
  RESULTS_NOT_PUBLISHED: 'RESULTS_NOT_PUBLISHED',

  // Import électoral
  INVALID_CSV_FORMAT: 'INVALID_CSV_FORMAT',
  EMPTY_CSV: 'EMPTY_CSV',

  // Générique
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
});

// ============================================================================
// 2. DÉFINITIONS DE TYPES JSDOC (MODÈLES PARTAGÉS)
// ============================================================================

/**
 * @typedef {Object} User
 * @property {string} id - Identifiant unique de l'utilisateur
 * @property {string} email - Adresse e-mail institutionnelle (@esp.sn)
 * @property {string} nom - Nom de famille
 * @property {string} prenom - Prénom
 * @property {string} classe - Classe ou filière (ex: 'DUT2 GE')
 * @property {'etudiant' | 'candidat' | 'admin'} role - Rôle applicatif
 */

/**
 * @typedef {Object} Election
 * @property {string} id - Identifiant unique du scrutin
 * @property {string} titre - Intitulé du scrutin
 * @property {string} dateDebut - Date et heure de début de vote (ISO 8601 UTC)
 * @property {string} dateFin - Date et heure de clôture de vote (ISO 8601 UTC)
 * @property {string} [candidatureDateDebut] - Date et heure de début de la période de dépôt de candidature, indépendante de la période de vote (ISO 8601 UTC)
 * @property {string} [candidatureDateFin] - Date et heure de fin de la période de dépôt de candidature, indépendante de la période de vote (ISO 8601 UTC)
 * @property {boolean} [isCandidatureOuverte] - Indique si la période de candidature est actuellement ouverte (calculée à la volée côté serveur)
 * @property {'a_venir' | 'ouvert' | 'cloture'} statut - État courant du scrutin
 * @property {boolean} secret - Paramètre d'anonymat de l'urne (Vote secret)
 * @property {boolean} resultatsPublies - Statut de publication officielle par l'admin
 */

/**
 * @typedef {Object} Project
 * @property {string} id - Identifiant unique du projet (ex: 'proj-1')
 * @property {string} nom - Nom du projet (3-120 caractères)
 * @property {string} description - Description détaillée du projet
 * @property {string[]} membres - Liste des noms complets des membres du projet
 * @property {string} [filiere] - Filière ou département d'origine
 * @property {'en_attente' | 'valide' | 'rejete'} statut - Statut de modération
 * @property {string} [motifRejet] - Motif explicatif en cas de rejet (obligatoire si statut === 'rejete')
 * @property {number} [voix] - Nombre de voix obtenues (présent uniquement post-dépouillement pour admin/résultats)
 */

/**
 * @typedef {Object} VoteReceipt
 * @property {string} recu - Code de reçu scellé unique (ex: 'PH26-M5X9-4A7B')
 * @property {string} horodatage - Horodatage ISO 8601 UTC de l'enregistrement
 * @property {string} [projetNom] - Intitulé du projet voté (affiché à l'électeur à la confirmation)
 */

/**
 * @typedef {Object} VoteStatus
 * @property {boolean} aVote - Vrai si l'électeur a déjà émargé pour le scrutin actif
 * @property {string} [recu] - Code de reçu de l'électeur si déjà voté
 * @property {string} [horodatage] - Date de l'émargement si déjà voté
 */

/**
 * @typedef {Object} ElectionResultItem
 * @property {string} id - Identifiant du projet
 * @property {string} nom - Intitulé du projet
 * @property {number} voix - Nombre total de suffrages exprimés
 * @property {number} pourcentage - Pourcentage relatif (ex: 40.6)
 */

/**
 * @typedef {Object} ElectionResults
 * @property {boolean} publie - Indicateur de publication officielle
 * @property {number} totalVoix - Somme des suffrages exprimés
 * @property {ElectionResultItem[]} classement - Liste ordonnée décroissante des résultats
 */

/**
 * @typedef {Object} ElectoralEntry
 * @property {string} nom - Nom de l'étudiant
 * @property {string} prenom - Prénom de l'étudiant
 * @property {string} classe - Classe ou département (ex: 'DUT1 INFO')
 * @property {string} email - Adresse e-mail institutionnelle validée
 */

/**
 * @typedef {Object} UrneRecord
 * @property {string} recu - Code de reçu anonyme scellé
 * @property {string} choix - Nom ou identifiant du projet voté
 * @property {string} horodatage - Date et heure ISO 8601
 */

/**
 * @typedef {Object} ApiError
 * @property {number} [status] - Code d'état HTTP
 * @property {string} message - Message explicatif pour l'UI
 * @property {string|null} [code] - Code d'erreur métier standardisé
 * @property {any} [raw] - Erreur brute d'origine
 */
