import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { fetchScrutinInfo } from '../api/projectsService';
import { checkVoteStatus } from '../api/voteService';
import { useAuth } from './ContexteAuth';
import { USER_ROLES } from '../types/models';
import { computeElectionPeriodStatuses } from '../utilitaires/dateScrutin';

const ElectionContext = createContext(null);

export function ElectionProvider({ children }) {
  const { user, isAuthenticated } = useAuth();

  const [scrutin, setScrutin] = useState(null);
  const [voteStatus, setVoteStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nowTick, setNowTick] = useState(() => new Date());

  const refreshElection = useCallback(async () => {
    try {
      setError(null);
      const [scrutinData, statusData] = await Promise.all([
        fetchScrutinInfo(true).catch(() => null),
        isAuthenticated ? checkVoteStatus().catch(() => ({ aVote: false })) : Promise.resolve({ aVote: false }),
      ]);

      if (scrutinData) {
        setScrutin(scrutinData);
      }
      setVoteStatus(statusData || { aVote: false });
    } catch (err) {
      setError(err.message || 'Erreur de synchronisation du scrutin.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    refreshElection();
  }, [refreshElection]);

  // Actualisation de l'heure en arrière-plan toutes les 15s pour franchissement des seuils de dates en direct
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // Réactualisation automatique lors du retour sur l'onglet (visibilitychange)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setNowTick(new Date());
        refreshElection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshElection]);

  // Permet de mettre à jour le scrutin instantanément côté client lors d'actions admin
  const updateScrutinLocal = useCallback((updates) => {
    setScrutin((prev) => (prev ? { ...prev, ...updates } : updates));
    setNowTick(new Date());
  }, []);

  // Calcul dynamique et rigoureux des statuts du vote et de la candidature selon les périodes configurées
  const periodStatuses = useMemo(() => {
    return computeElectionPeriodStatuses(scrutin, nowTick);
  }, [scrutin, nowTick]);

  const {
    statutVote,
    isVoteOuvert,
    isVoteCloture,
    isVoteAVenir,
    isCandidatureAVenir,
    isCandidatureOuverte,
    isCandidatureCloturee,
    isDepotOuvert,
    voteBadge,
    candidatureBadge,
  } = periodStatuses;

  const candidatureDateDebut = scrutin?.candidatureDateDebut || '2026-09-15T08:00';
  const candidatureDateFin = scrutin?.candidatureDateFin || '2026-09-29T23:59';
  const dateDebut = scrutin?.dateDebut || '2026-09-24T09:00';
  const dateFin = scrutin?.dateFin || '2026-09-30T18:00';

  const isResultatsPublies = Boolean(scrutin?.resultatsPublies);
  const hasVoted = Boolean(voteStatus?.aVote);
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  // Actions autorisées
  const canVote = isVoteOuvert && !hasVoted;
  const canSubmitProject = isDepotOuvert;
  const canViewResults = isVoteCloture && (isResultatsPublies || isAdmin);

  // Scrutin enrichi avec le statut dynamique calculé pour assurer la conformité absolue
  const scrutinSynchronise = useMemo(() => {
    if (!scrutin) return null;
    return {
      ...scrutin,
      statut: statutVote,
      isCandidatureOuverte,
      isDepotOuvert,
      candidatureDateDebut,
      candidatureDateFin,
      dateDebut,
      dateFin,
    };
  }, [scrutin, statutVote, isCandidatureOuverte, isDepotOuvert, candidatureDateDebut, candidatureDateFin, dateDebut, dateFin]);

  const value = useMemo(
    () => ({
      scrutin: scrutinSynchronise,
      rawScrutin: scrutin,
      voteStatus,
      loading,
      error,
      refreshElection,
      updateScrutinLocal,
      statutVote,
      isVoteOuvert,
      isVoteCloture,
      isVoteAVenir,
      isCandidatureAVenir,
      isCandidatureOuverte,
      isCandidatureCloturee,
      isDepotOuvert,
      voteBadge,
      candidatureBadge,
      candidatureDateDebut,
      candidatureDateFin,
      dateDebut,
      dateFin,
      isResultatsPublies,
      hasVoted,
      isAdmin,
      canVote,
      canSubmitProject,
      canViewResults,
    }),
    [
      scrutinSynchronise,
      scrutin,
      voteStatus,
      loading,
      error,
      refreshElection,
      updateScrutinLocal,
      statutVote,
      isVoteOuvert,
      isVoteCloture,
      isVoteAVenir,
      isCandidatureAVenir,
      isCandidatureOuverte,
      isCandidatureCloturee,
      isDepotOuvert,
      voteBadge,
      candidatureBadge,
      candidatureDateDebut,
      candidatureDateFin,
      dateDebut,
      dateFin,
      isResultatsPublies,
      hasVoted,
      isAdmin,
      canVote,
      canSubmitProject,
      canViewResults,
    ]
  );

  return (
    <ElectionContext.Provider value={value}>
      {children}
    </ElectionContext.Provider>
  );
}

export function useElection() {
  const context = useContext(ElectionContext);
  if (!context) {
    throw new Error('useElection doit être utilisé à l’intérieur d’un ElectionProvider');
  }
  return context;
}
