import { apiClient, USE_MOCKS, mockDelay, getCached, setCached, clearApiCache } from './client';
import { PROJECT_STATUS, ELECTION_STATUS, ERROR_CODES } from '../types/models';

const PROJECTS_CACHE_TTL_MS = 8000; // 8 secondes (5-10s pour concilier réactivité admin et charge réseau)

// Invalidation automatique du cache des projets lors du retour de focus / visibilité sur l'onglet
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      clearApiCache('projects');
    }
  });
}

export async function fetchValidatedProjects(bypassCache = false) {
  if (bypassCache) {
    clearApiCache('projects');
  }
  const cached = getCached('projects');
  if (cached && Array.isArray(cached)) return cached;

  if (USE_MOCKS) {
    const { getMockProjects } = await import('./mocks/mockData');
    await mockDelay();
    const raw = getMockProjects();
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.projects) ? raw.projects : (Array.isArray(raw?.data) ? raw.data : []));
    const data = list.filter((p) => p.statut === PROJECT_STATUS.VALIDATED);
    setCached('projects', data, PROJECTS_CACHE_TTL_MS);
    return data;
  }
  const { data } = await apiClient.get('/projects', { params: { statut: PROJECT_STATUS.VALIDATED } });
  const result = Array.isArray(data) ? data : (Array.isArray(data?.projects) ? data.projects : (Array.isArray(data?.data) ? data.data : []));
  setCached('projects', result, PROJECTS_CACHE_TTL_MS);
  return result;
}

export const fetchProjects = fetchValidatedProjects;

export async function fetchProjectById(id) {
  if (USE_MOCKS) {
    const { getMockProjects } = await import('./mocks/mockData');
    await mockDelay(350);
    const raw = getMockProjects();
    const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.projects) ? raw.projects : (Array.isArray(raw?.data) ? raw.data : []));
    const project = list.find((p) => p.id === id);
    if (!project) {
      const err = new Error('Projet introuvable.');
      err.status = 404;
      err.code = ERROR_CODES.PROJECT_NOT_FOUND;
      throw err;
    }
    return project;
  }
  const { data } = await apiClient.get(`/projects/${id}`);
  return data;
}

export async function fetchMyProjects() {
  if (USE_MOCKS) {
    const { getMockProjects } = await import('./mocks/mockData');
    await mockDelay(300);
    const storedUserRaw = sessionStorage.getItem('polyhack_user');
    const user = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    const userEmail = String(user?.email || '').toLowerCase().trim();
    const userName = `${user?.prenom || ''} ${user?.nom || ''}`.toLowerCase().trim();
    const raw = getMockProjects();
    const all = Array.isArray(raw) ? raw : (Array.isArray(raw?.projects) ? raw.projects : (Array.isArray(raw?.data) ? raw.data : []));
    
    if (!userEmail && !userName) return [];

    return all.filter((p) => {
      // 1. Filtrage strict par l'e-mail du porteur de projet
      if (p.porteurEmail) {
        return String(p.porteurEmail).toLowerCase().trim() === userEmail;
      }
      // 2. Ou si l'utilisateur est explicitement listé dans les membres de l'équipe
      if (Array.isArray(p.membres)) {
        return p.membres.some((m) => {
          const mLower = String(m).toLowerCase().trim();
          return (userEmail && mLower.includes(userEmail)) || (userName && mLower.includes(userName));
        });
      }
      return false;
    });
  }
  const { data } = await apiClient.get('/projects/mine');
  const result = Array.isArray(data) ? data : (Array.isArray(data?.projects) ? data.projects : (Array.isArray(data?.data) ? data.data : []));
  return result;
}

export async function submitProject({ nom, description, membres }) {
  if (USE_MOCKS) {
    const { getMockScrutin, addMockProject } = await import('./mocks/mockData');
    await mockDelay(700);
    const scrutin = getMockScrutin();

    if (scrutin.statut === ELECTION_STATUS.OPEN) {
      const err = new Error(
        'La soumission de projet est fermée pendant la période de vote.'
      );
      err.status = 409;
      err.code = ERROR_CODES.SUBMISSION_CLOSED;
      throw err;
    }

    if (!scrutin.isDepotOuvert && scrutin.isCandidatureOuverte === false) {
      const err = new Error(
        'La période de dépôt de candidature n’est pas ouverte actuellement.'
      );
      err.status = 409;
      err.code = ERROR_CODES.SUBMISSION_CLOSED;
      throw err;
    }

    const storedUserRaw = sessionStorage.getItem('polyhack_user');
    const user = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    const userEmail = String(user?.email || 'demo.candidat@esp.sn').toLowerCase().trim();

    const project = {
      id: `proj-${Date.now()}`,
      nom,
      description,
      membres,
      statut: PROJECT_STATUS.PENDING,
      voix: 0,
      porteurEmail: userEmail,
      dateSoumission: new Date().toISOString(),
    };
    addMockProject(project);
    clearApiCache('projects');
    return project;
  }
  const { data } = await apiClient.post('/projects', { nom, description, membres });
  clearApiCache('projects');
  return data;
}

export async function fetchScrutinInfo(bypassCache = false) {
  if (bypassCache) {
    clearApiCache('scrutin');
  }
  const cached = getCached('scrutin');
  if (cached) return cached;

  if (USE_MOCKS) {
    const { getMockScrutin } = await import('./mocks/mockData');
    await mockDelay(300);
    const data = getMockScrutin();
    setCached('scrutin', data, 15000);
    return data;
  }
  const { data } = await apiClient.get('/scrutin/actif');
  setCached('scrutin', data, 15000);
  return data;
}
