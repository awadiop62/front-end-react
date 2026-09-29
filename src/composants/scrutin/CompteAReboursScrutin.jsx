import { useState, useEffect } from 'react';
import { ELECTION_STATUS } from '../../types/models';
import { parseElectionDate } from '../../utilitaires/dateScrutin';

function calculateTimeLeft(targetDate) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };
  const target = parseElectionDate(targetDate);
  if (!target) return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };
  const difference = target.getTime() - Date.now();
  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    isPassed: false,
  };
}

export default function ElectionCountdown({ scrutin, dateDebut, dateFin, statut }) {
  const finalStatut = statut || scrutin?.statut;
  const finalDateDebut = dateDebut || scrutin?.dateDebut;
  const finalDateFin = dateFin || scrutin?.dateFin;

  const isAvenir = finalStatut === ELECTION_STATUS.UPCOMING;
  const isCloture = finalStatut === ELECTION_STATUS.CLOSED;
  const targetDate = isAvenir ? finalDateDebut : finalDateFin;

  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    if (isCloture || !targetDate) return;

    setTimeLeft(calculateTimeLeft(targetDate));

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(targetDate);
      setTimeLeft(remaining);
      if (remaining.isPassed) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, isCloture]);

  if (isCloture) {
    return (
      <div className="election-countdown election-countdown--closed" aria-label="Scrutin clos">
        <div className="election-countdown__header">
          <span className="election-countdown__title text-label">
            <span className="msr msr-18" aria-hidden="true">lock</span>
            État de l'urne
          </span>
          <span className="election-countdown__status mono-data" style={{ color: 'var(--ink-muted)' }}>
            Clôturé
          </span>
        </div>
        <div className="election-countdown__closed-msg">
          <span className="msr msr-18" aria-hidden="true">info</span>
          <span>Le scrutin est clos. Les votes sont enregistrés et le dépouillement est terminé.</span>
        </div>
      </div>
    );
  }

  const titleText = isAvenir ? "Ouverture des votes dans" : "Temps restant avant clôture";
  const accessibleText = `${titleText} : ${timeLeft.days} jours, ${timeLeft.hours} heures, ${timeLeft.minutes} minutes.`;

  return (
    <div className="election-countdown" aria-label={accessibleText}>
      <div className="election-countdown__header">
        <span className="election-countdown__title text-label">
          <span className="msr msr-18" aria-hidden="true">timer</span>
          {titleText}
        </span>
        <span className="election-countdown__status mono-label" style={{ color: isAvenir ? 'var(--accent)' : 'var(--success)' }}>
          {isAvenir ? 'À VENIR' : 'EN COURS'}
        </span>
      </div>

      <div className="election-countdown__grid" aria-hidden="true">
        <div className="countdown-box">
          <span className="countdown-box__value">{String(timeLeft.days).padStart(2, '0')}</span>
          <span className="countdown-box__label">Jours</span>
        </div>
        <div className="countdown-box">
          <span className="countdown-box__value">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="countdown-box__label">Heures</span>
        </div>
        <div className="countdown-box">
          <span className="countdown-box__value">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="countdown-box__label">Minutes</span>
        </div>
        <div className="countdown-box">
          <span className="countdown-box__value">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="countdown-box__label">Secondes</span>
        </div>
      </div>
    </div>
  );
}
