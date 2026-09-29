// Données de démonstration pour le scrutin PolyHack
import { ELECTION_STATUS, PROJECT_STATUS, USER_ROLES } from '../../types/models';
import { computeElectionPeriodStatuses } from '../../utilitaires/dateScrutin';

const STORAGE_KEY_SCRUTIN = 'polyhack_scrutin_config_v4';
const STORAGE_KEY_PROJECTS = 'polyhack_projects_v4';
const STORAGE_KEY_ELECTORAL = 'polyhack_electoral_list_v4';

// Configuration initiale par défaut : Scrutin PolyHack 2026
const INITIAL_SCRUTIN = {
  id: 'scrutin-polyhack-2026',
  titre: 'Scrutin PolyHack 2026',
  dateDebut: '2026-09-24T09:00',
  dateFin: '2026-09-30T18:00',
  candidatureDateDebut: '2026-09-15T08:00',
  candidatureDateFin: '2026-09-29T23:59',
  isCandidatureOuverte: true,
  statut: ELECTION_STATUS.OPEN,
  secret: true,
  resultatsPublies: false,
};

/**
 * Préréglages des 4 scénarios métier du scrutin pour tests et démonstrations rapides
 */
export const MOCK_ELECTION_SCENARIOS = {
  // 1. Scrutin à venir (vote pas encore ouvert, candidatures autorisées)
  A_VENIR: {
    statut: ELECTION_STATUS.UPCOMING, // 'a_venir'
    resultatsPublies: false,
  },
  // 2. Scrutin ouvert (vote en direct, dépôts suspendus)
  OUVERT: {
    statut: ELECTION_STATUS.OPEN, // 'ouvert'
    resultatsPublies: false,
  },
  // 3. Scrutin clôturé mais résultats non encore publiés par l'admin
  CLOTURE_NON_PUBLIE: {
    statut: ELECTION_STATUS.CLOSED, // 'cloture'
    resultatsPublies: false,
  },
  // 4. Scrutin clôturé et résultats publiés (visibles par tous)
  CLOTURE_PUBLIE: {
    statut: ELECTION_STATUS.CLOSED, // 'cloture'
    resultatsPublies: true,
  },
};

export function applyDynamicStatuses(scrutinData) {
  if (!scrutinData) return scrutinData;
  const computed = computeElectionPeriodStatuses(scrutinData);
  scrutinData.statut = computed.statutVote;
  scrutinData.isCandidatureOuverte = computed.isCandidatureOuverte;
  scrutinData.isDepotOuvert = computed.isDepotOuvert;
  return scrutinData;
}

function loadStoredScrutin() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SCRUTIN);
    if (raw) {
      const parsed = JSON.parse(raw);
      const res = { ...INITIAL_SCRUTIN, ...parsed };
      return applyDynamicStatuses(res);
    }
  } catch {
    // Ignore error
  }
  const res = { ...INITIAL_SCRUTIN };
  return applyDynamicStatuses(res);
}

function saveStoredScrutin(data) {
  try {
    localStorage.setItem(STORAGE_KEY_SCRUTIN, JSON.stringify(data));
  } catch {
    // Ignore error
  }
}

export const mockScrutin = loadStoredScrutin();

export const INITIAL_ELECTORAL_LIST = [
  { nom: 'Fall', prenom: 'Amadou', classe: '', email: 'demo.electeur1@esp.sn' },
  { nom: 'Ndiaye', prenom: 'Awa', classe: '', email: 'demo.candidat@esp.sn' },
  { nom: 'Diop', prenom: 'Cheikh', classe: '', email: 'demo.electeur2@esp.sn' },
  { nom: 'Sarr', prenom: 'Fatou', classe: '', email: 'demo.electeur3@esp.sn' },
  { nom: 'Sy', prenom: 'Ibrahima', classe: '', email: 'demo.electeur4@esp.sn' },
  { nom: 'Diallo', prenom: 'Khady', classe: '', email: 'demo.electeur5@esp.sn' },
];

function loadStoredElectoralList() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ELECTORAL);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure default accounts are present
        const existingEmails = new Set(parsed.map((p) => p.email.toLowerCase()));
        const missing = INITIAL_ELECTORAL_LIST.filter((p) => !existingEmails.has(p.email.toLowerCase()));
        return [...parsed, ...missing];
      }
    }
  } catch {
    // Ignore error
  }
  return [...INITIAL_ELECTORAL_LIST];
}

function saveStoredElectoralList(list) {
  try {
    localStorage.setItem(STORAGE_KEY_ELECTORAL, JSON.stringify(list));
  } catch {
    // Ignore error
  }
}

export let mockElectoralList = loadStoredElectoralList();

export function getMockElectoralList() {
  mockElectoralList = loadStoredElectoralList();
  return [...mockElectoralList];
}

export const mockUtilisateurWhitelist = {
  email: 'serigne.faye@esp.sn',
  nom: 'Faye',
  prenom: 'Serigne Fallou',
  classe: '',
  role: USER_ROLES.STUDENT,
};

export const mockAdminUser = {
  email: 'admin.commission-it@esp.sn',
  nom: 'Commission IT',
  prenom: 'Administrateur',
  classe: '',
  role: USER_ROLES.ADMIN,
};

const INITIAL_PROJECTS = [
  {
    id: 'proj-1',
    nom: 'AquaSense',
    description:
      "Dispositif de contrôle et de suivi de la qualité de l'eau des forages ruraux avec alertes par SMS en cas de contamination.",
    membres: ['Awa Ndiaye', 'Cheikh Diop', 'Fatou Sarr'],
    statut: PROJECT_STATUS.VALIDATED,
    porteurEmail: 'demo.candidat@esp.sn',
    voix: 38,
  },
  {
    id: 'proj-2',
    nom: 'GridWatch',
    description:
      "Système connecté de surveillance du réseau électrique pour détecter les variations de tension et prévenir les coupures.",
    membres: ['Serigne Fallou Faye', 'Moussa Kane'],
    statut: PROJECT_STATUS.VALIDATED,
    porteurEmail: 'serigne.faye@esp.sn',
    voix: 41,
  },
  {
    id: 'proj-3',
    nom: 'CampusRide',
    description: "Application de covoiturage entre étudiants pour faciliter les déplacements inter-campus à l'ESP.",
    membres: ['Ibrahima Sy', 'Khady Diallo', 'Omar Ba', 'Ndeye Fall'],
    statut: PROJECT_STATUS.VALIDATED,
    porteurEmail: 'demo.electeur4@esp.sn',
    voix: 22,
  },
  {
    id: 'proj-4',
    nom: 'NotesSync ESP',
    description: "Plateforme collaborative de partage et d'organisation des supports de cours pour les filières d'ingénierie.",
    membres: ['Aliou Sow'],
    statut: PROJECT_STATUS.PENDING,
    porteurEmail: 'aliou.sow@esp.sn',
    voix: 0,
  },
  {
    id: 'proj-5',
    nom: 'SolarKit ESP',
    description: "Kit pratique d'apprentissage de l'énergie solaire destiné aux travaux pratiques des élèves techniciens.",
    membres: ['Mariama Ba', 'Talla Diagne'],
    statut: PROJECT_STATUS.REJECTED,
    motifRejet: "Dossier incomplet, liste des membres manquante.",
    porteurEmail: 'mariama.ba@esp.sn',
    voix: 0,
  },
];

function loadStoredProjects() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      if (Array.isArray(parsed?.projects)) return parsed.projects;
      if (Array.isArray(parsed?.data)) return parsed.data;
    }
  } catch {
    // Ignore error
  }
  return [...INITIAL_PROJECTS];
}

function saveStoredProjects(list) {
  try {
    const safe = Array.isArray(list) ? list : [...INITIAL_PROJECTS];
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(safe));
  } catch {
    // Ignore error
  }
}

let mockProjects = loadStoredProjects();

export function getMockProjects() {
  if (!Array.isArray(mockProjects)) {
    mockProjects = loadStoredProjects();
  }
  return Array.isArray(mockProjects) ? [...mockProjects] : [...INITIAL_PROJECTS];
}

export function addMockProject(project) {
  mockProjects = [...mockProjects, project];
  saveStoredProjects(mockProjects);
  return project;
}

export function getMockScrutin() {
  applyDynamicStatuses(mockScrutin);
  return { ...mockScrutin };
}

export function updateMockScrutin(updates) {
  Object.assign(mockScrutin, updates);
  applyDynamicStatuses(mockScrutin);
  saveStoredScrutin(mockScrutin);
  return { ...mockScrutin };
}

export function updateMockProjectStatus(id, statut, motifOrComment = '', adminName = 'Commission IT') {
  const now = new Date().toISOString();
  mockProjects = mockProjects.map((p) => {
    if (p.id === id) {
      const history = p.historiqueModeration || [];
      const newEntry = {
        date: now,
        statut,
        commentaire: motifOrComment,
        admin: adminName,
      };
      return {
        ...p,
        statut,
        motifRejet: statut === 'rejete' ? motifOrComment : undefined,
        commentaireAdmin: motifOrComment || (statut === 'valide' ? 'Candidature validée' : 'Candidature rejetée'),
        dateModeration: now,
        moderePar: adminName,
        historiqueModeration: [newEntry, ...history],
      };
    }
    return p;
  });
  saveStoredProjects(mockProjects);
  return mockProjects.find((p) => p.id === id);
}

export function addMockElectoralList(entries) {
  mockElectoralList = [...mockElectoralList, ...entries];
  saveStoredElectoralList(mockElectoralList);
  return [...mockElectoralList];
}

let mockUrne = [
  { recu: 'REC-A7F9-82C1', choix: 'GridWatch', horodatage: '2026-09-24T09:12:04' },
  { recu: 'REC-3E12-BC90', choix: 'AquaSense', horodatage: '2026-09-24T09:15:22' },
  { recu: 'REC-90DA-44E2', choix: 'CampusRide', horodatage: '2026-09-24T09:21:40' },
  { recu: 'REC-55F1-99B7', choix: 'GridWatch', horodatage: '2026-09-24T09:30:11' },
  { recu: 'REC-12BC-77A9', choix: 'AquaSense', horodatage: '2026-09-24T09:44:56' },
];

export function getMockUrne() {
  return [...mockUrne];
}

export function addMockUrneVote(recu, choix, horodatage) {
  mockUrne = [...mockUrne, { recu, choix, horodatage }];
}

/**
 * Simule ou annule l'état "L'utilisateur courant a déjà voté"
 * @param {boolean} hasVoted
 * @param {string} [receiptCode]
 */
export function setMockUserAlreadyVoted(hasVoted = true, receiptCode = 'PH26-REC-DEMO-77A9') {
  let identifier = 'default';
  try {
    const rawUser = sessionStorage.getItem('polyhack_user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      identifier = u?.id || u?.email ? String(u.id || u.email).toLowerCase().trim() : 'default';
    }
  } catch {
    // Ignore
  }
  const receiptKey = `polyhack_receipt_${encodeURIComponent(identifier)}_${mockScrutin.id}`;
  if (hasVoted) {
    localStorage.setItem(
      receiptKey,
      JSON.stringify({
        recu: receiptCode,
        horodatage: new Date().toISOString(),
      })
    );
  } else {
    localStorage.removeItem(receiptKey);
  }
}

/**
 * Réinitialise complètement la simulation pour permettre de re-tester le vote
 */
export function resetMockState() {
  try {
    // Nettoyer tous les reçus de vote stockés dans le navigateur
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('polyhack_receipt_') || key.startsWith('polyhack_vote_')) {
        localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore error
  }

  // Scrutin réinitialisé en statut OUVERT pour vote direct
  const freshScrutin = {
    ...INITIAL_SCRUTIN,
    statut: ELECTION_STATUS.OPEN, // Scrutin ouvert aux votes !
    resultatsPublies: false,
    dateDebut: '2026-09-24T09:00',
    dateFin: '2026-09-30T18:00',
  };

  Object.assign(mockScrutin, freshScrutin);
  saveStoredScrutin(mockScrutin);

  // Réinitialiser les projets et leurs voix de base
  mockProjects = INITIAL_PROJECTS.map((p) => ({ ...p }));
  saveStoredProjects(mockProjects);

  // Réinitialiser l'urne
  mockUrne = [
    { recu: 'REC-A7F9-82C1', choix: 'GridWatch', horodatage: '2026-09-24T09:12:04' },
    { recu: 'REC-3E12-BC90', choix: 'AquaSense', horodatage: '2026-09-24T09:15:22' },
    { recu: 'REC-90DA-44E2', choix: 'CampusRide', horodatage: '2026-09-24T09:21:40' },
  ];

  return { scrutin: mockScrutin, projects: mockProjects };
}
