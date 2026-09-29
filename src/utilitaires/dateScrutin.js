import { ELECTION_STATUS } from '../types/models';

/**
 * Analyse une chaîne de date ISO ou datetime-local sans décalage de fuseau horaire intempestif.
 * Supporte "YYYY-MM-DDTHH:mm", "YYYY-MM-DDTHH:mm:ss", "YYYY-MM-DDTHH:mm:ss.sssZ", etc.
 * 
 * @param {string|Date} dateStr 
 * @returns {Date|null}
 */
export function parseElectionDate(dateStr) {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  if (typeof dateStr !== 'string') return null;

  const trimmed = dateStr.trim();
  // Format local : YYYY-MM-DDTHH:mm(:ss)
  const localMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (localMatch && !trimmed.endsWith('Z') && !trimmed.includes('+') && !trimmed.includes('-0') && !trimmed.includes('-1')) {
    const [, year, month, day, hours, minutes, seconds] = localMatch;
    const d = new Date(
      parseInt(year, 10),
      parseInt(month, 10) - 1,
      parseInt(day, 10),
      parseInt(hours, 10),
      parseInt(minutes, 10),
      seconds ? parseInt(seconds, 10) : 0
    );
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formate une date pour l'affichage de période (ex: "15 sept., 08:00" ou "29 sept. 2026, 23:59")
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatPeriodDate(dateVal) {
  if (!dateVal) return '—';
  const d = parseElectionDate(dateVal);
  if (!d) return String(dateVal);
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Calcule dynamiquement et en temps réel le statut du vote et de la candidature
 * en se basant sur les périodes configurées par l'administrateur.
 * 
 * @param {Object} scrutin 
 * @param {Date} [referenceDate] 
 * @returns {Object}
 */
export function computeElectionPeriodStatuses(scrutin, referenceDate = new Date()) {
  const now = referenceDate instanceof Date ? referenceDate : new Date();

  const voteDebut = parseElectionDate(scrutin?.dateDebut);
  const voteFin = parseElectionDate(scrutin?.dateFin);

  const candDebut = parseElectionDate(scrutin?.candidatureDateDebut);
  const candFin = parseElectionDate(scrutin?.candidatureDateFin);

  // 1. STATUT DU VOTE (SCRUTIN)
  let isVoteAVenir = false;
  let isVoteOuvert = false;
  let isVoteCloture = false;
  let statutVote = ELECTION_STATUS.UPCOMING;

  if (scrutin?.statut === ELECTION_STATUS.CLOSED && (!voteFin || now >= voteFin)) {
    // Si l'administrateur a explicitement clôturé le scrutin ou que la fin est dépassée
    isVoteCloture = true;
    statutVote = ELECTION_STATUS.CLOSED;
  } else if (voteDebut && voteFin) {
    if (now < voteDebut) {
      isVoteAVenir = true;
      statutVote = ELECTION_STATUS.UPCOMING;
    } else if (now >= voteDebut && now <= voteFin) {
      isVoteOuvert = true;
      statutVote = ELECTION_STATUS.OPEN;
    } else {
      isVoteCloture = true;
      statutVote = ELECTION_STATUS.CLOSED;
    }
  } else if (scrutin?.statut) {
    // Repli sur le statut déclaré si dates absentes
    isVoteOuvert = scrutin.statut === ELECTION_STATUS.OPEN;
    isVoteCloture = scrutin.statut === ELECTION_STATUS.CLOSED;
    isVoteAVenir = scrutin.statut === ELECTION_STATUS.UPCOMING;
    statutVote = scrutin.statut;
  }

  // 2. STATUT DES CANDIDATURES (DÉPÔT DES PROJETS)
  let isCandidatureAVenir = false;
  let isWithinCandidatureDates = false;
  let isCandidatureCloturee = false;

  if (candDebut && candFin) {
    if (now < candDebut) {
      isCandidatureAVenir = true;
    } else if (now >= candDebut && now <= candFin) {
      isWithinCandidatureDates = true;
    } else {
      isCandidatureCloturee = true;
    }
  } else if (candFin) {
    if (now <= candFin) {
      isWithinCandidatureDates = true;
    } else {
      isCandidatureCloturee = true;
    }
  } else {
    isWithinCandidatureDates = scrutin?.isCandidatureOuverte !== undefined ? Boolean(scrutin.isCandidatureOuverte) : true;
  }

  // Règle métier : la soumission des projets est fermée pendant la période de vote
  const isDepotOuvert = isWithinCandidatureDates && !isVoteOuvert;

  // Libellés et tons des badges
  const voteBadge = {
    label: isVoteOuvert ? 'Ouvert' : isVoteAVenir ? 'À venir' : 'Clos',
    tone: isVoteOuvert ? 'success' : isVoteAVenir ? 'accent' : 'neutral',
  };

  let candidatureBadge = {
    label: 'Clos',
    tone: 'neutral',
  };

  if (isDepotOuvert) {
    candidatureBadge = {
      label: 'Ouvert',
      tone: 'success',
    };
  } else if (isVoteOuvert) {
    candidatureBadge = {
      label: 'Suspendu (Vote en cours)',
      tone: 'neutral',
    };
  } else if (isCandidatureAVenir) {
    candidatureBadge = {
      label: 'À venir',
      tone: 'accent',
    };
  } else {
    candidatureBadge = {
      label: 'Clos',
      tone: 'neutral',
    };
  }

  return {
    statutVote,
    isVoteOuvert,
    isVoteAVenir,
    isVoteCloture,
    isCandidatureAVenir,
    isWithinCandidatureDates,
    isCandidatureOuverte: isWithinCandidatureDates,
    isCandidatureCloturee,
    isDepotOuvert,
    voteBadge,
    candidatureBadge,
    candidatureDateDebut: scrutin?.candidatureDateDebut,
    candidatureDateFin: scrutin?.candidatureDateFin,
    dateDebut: scrutin?.dateDebut,
    dateFin: scrutin?.dateFin,
  };
}
