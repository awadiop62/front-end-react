import { useEffect, useState, useCallback } from 'react';
import { fetchAdminStats } from '../../../api/adminService';
import { useToast } from '../../../contextes/ContexteToast';
import { useEstMobile } from '../../../hooks/useEstMobile';
import Carte from '../../ui/Carte';
import Insigne from '../../ui/Insigne';
import Bouton from '../../ui/Bouton';
import { PageSpinner } from '../../ui/Squelette';
import ParticipationGaugeChart from './ParticipationGaugeChart';
import ProjectVotesBarChart from './ProjectVotesBarChart';
import VotesTimelineChart from './VotesTimelineChart';
import ClassParticipationChart from './ClassParticipationChart';

export default function RealtimeStatsDashboard() {
  const { showToast } = useToast();
  const isMobile = useEstMobile();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const loadStats = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const data = await fetchAdminStats();
      setStats(data);
      setLastRefreshed(new Date());
    } catch {
      if (!isSilent) {
        showToast('Erreur lors du chargement des statistiques en direct.', { variant: 'err' });
      }
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Polling automatique toutes les 6 secondes si activé
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadStats(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadStats]);

  if (loading && !stats) {
    return <PageSpinner label="Calcul et agrégation des statistiques en temps réel…" />;
  }

  const {
    totalElecteurs = 0,
    totalEmargements = 0,
    totalVotesUrne = 0,
    tauxParticipation = 0,
    classeStats = [],
    projectStats = [],
    statusCounts = { valide: 0, en_attente: 0, rejete: 0, total: 0 },
    votesTimeline = [],
    scrutinStatut,
  } = stats || {};

  const isScrutinCloture = scrutinStatut === 'cloture' || scrutinStatut === 'closed';

  return (
    <div className="realtime-stats" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      {/* Barre d'outils temps réel & statut */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-sm)',
          padding: '12px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: autoRefresh ? 'var(--success)' : 'var(--ink-muted)',
              display: 'inline-block',
              boxShadow: autoRefresh ? '0 0 0 3px var(--success-bg)' : 'none',
              animation: autoRefresh ? 'pulse 2s infinite' : 'none',
            }}
          />
          <div>
            <strong style={{ fontSize: '13px', color: 'var(--ink)' }}>
              {autoRefresh ? 'Flux en temps réel actif' : 'Actualisation manuelle'}
            </strong>
            <span className="text-caption" style={{ color: 'var(--ink-muted)', display: 'block', fontSize: '11px' }}>
              Dernière mise à jour : {lastRefreshed.toLocaleTimeString('fr-FR')}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Bouton
            variant={autoRefresh ? 'secondary' : 'ghost'}
            size="sm"
            icon={autoRefresh ? 'pause' : 'play_arrow'}
            onClick={() => setAutoRefresh((prev) => !prev)}
          >
            {autoRefresh ? 'Pause' : 'Reprendre direct'}
          </Bouton>

          <Bouton
            variant="primary"
            size="sm"
            icon="refresh"
            onClick={() => loadStats(false)}
          >
            Actualiser
          </Bouton>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 'var(--space-md)',
        }}
      >
        {/* KPI 1 : Taux */}
        <Carte style={{ padding: 'var(--space-md)', borderTop: '3px solid #10B981' }}>
          <span className="mono-label" style={{ color: 'var(--ink-muted)', fontSize: '11px' }}>
            PARTICIPATION
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
            <span className="text-display" style={{ fontSize: isMobile ? '24px' : '28px', color: '#10B981' }}>
              {tauxParticipation}%
            </span>
          </div>
          <span className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: '11px' }}>
            des électeurs inscrits
          </span>
        </Carte>

        {/* KPI 2 : Émargements */}
        <Carte style={{ padding: 'var(--space-md)', borderTop: '3px solid #00A0E8' }}>
          <span className="mono-label" style={{ color: 'var(--ink-muted)', fontSize: '11px' }}>
            ÉMARGEMENTS
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
            <span className="text-display" style={{ fontSize: isMobile ? '24px' : '28px', color: 'var(--ink)' }}>
              {totalEmargements}
            </span>
            <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>/ {totalElecteurs}</span>
          </div>
          <span className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: '11px' }}>
            Votants authentifiés
          </span>
        </Carte>

        {/* KPI 3 : Bulletins Scellés */}
        <Carte style={{ padding: 'var(--space-md)', borderTop: '3px solid #6366F1' }}>
          <span className="mono-label" style={{ color: 'var(--ink-muted)', fontSize: '11px' }}>
            URNE SCELLÉE
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
            <span className="text-display" style={{ fontSize: isMobile ? '24px' : '28px', color: 'var(--ink)' }}>
              {totalVotesUrne}
            </span>
          </div>
          <span className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: '11px' }}>
            Bulletins anonymes scellés
          </span>
        </Carte>

        {/* KPI 4 : Projets */}
        <Carte style={{ padding: 'var(--space-md)', borderTop: '3px solid #F59E0B' }}>
          <span className="mono-label" style={{ color: 'var(--ink-muted)', fontSize: '11px' }}>
            PROJETS EN LICE
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '4px' }}>
            <span className="text-display" style={{ fontSize: isMobile ? '24px' : '28px', color: 'var(--ink)' }}>
              {statusCounts.valide}
            </span>
            <span className="text-caption" style={{ color: 'var(--ink-muted)' }}>/ {statusCounts.total}</span>
          </div>
          <span className="text-caption" style={{ color: 'var(--ink-muted)', fontSize: '11px' }}>
            {statusCounts.en_attente} en attente
          </span>
        </Carte>
      </div>

      {/* Graphiques D3 Ligne 1 : Jauge + Répartition par Projet */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
          gap: 'var(--space-lg)',
        }}
      >
        {/* Jauge D3 */}
        <Carte style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '100%', marginBottom: 'var(--space-sm)' }}>
            <h3 className="text-h3" style={{ margin: 0 }}>Jauge de Participation</h3>
            <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
              Taux d'émargement global
            </p>
          </div>
          <ParticipationGaugeChart
            taux={tauxParticipation}
            votants={totalEmargements}
            total={totalElecteurs}
            size={isMobile ? 180 : 210}
          />
        </Carte>

        {/* Diagramme à barres D3 : Voix par projet */}
        <Carte style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 className="text-h3" style={{ margin: 0 }}>Répartition des Voix par Projet (D3)</h3>
              <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
                {isScrutinCloture ? "Dépouillement officiel des suffrages" : "Inaccessible pendant la période de vote"}
              </p>
            </div>
            <Insigne tone={isScrutinCloture ? 'accent' : 'warn'} icon={isScrutinCloture ? 'leaderboard' : 'lock'}>
              {isScrutinCloture ? `${projectStats.length} projets` : 'Verrouillé'}
            </Insigne>
          </div>

          {isScrutinCloture ? (
            <ProjectVotesBarChart data={projectStats} />
          ) : (
            <div style={{ padding: 'var(--space-md)', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-strong)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--warn-text)', marginBottom: '6px' }}>
                <span className="msr msr-20" aria-hidden="true">lock_clock</span>
                <strong style={{ fontSize: '14px' }}>Dépouillement bloqué pendant le vote en cours</strong>
              </div>
              <p className="text-body" style={{ color: 'var(--ink-muted)', fontSize: '13px', margin: 0, lineHeight: 1.5 }}>
                Conformément au secret de l'urne et aux règles de gestion, l'administrateur n'a accès aux résultats du vote qu'à l'issue définitive du scrutin (période de vote fermée).
              </p>
            </div>
          )}
        </Carte>
      </div>

      {/* Graphiques D3 Ligne 2 : Timeline des Votes + Participation par Classe */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 'var(--space-lg)',
        }}
      >
        {/* Timeline D3 */}
        <Carte style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 className="text-h3" style={{ margin: 0 }}>Dynamique du Scrutin (D3)</h3>
              <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
                Progression cumulée des votes
              </p>
            </div>
            <span className="msr msr-20" style={{ color: 'var(--accent)' }} aria-hidden="true">
              show_chart
            </span>
          </div>

          <VotesTimelineChart data={votesTimeline} />
        </Carte>

        {/* Participation par Classe D3 */}
        <Carte style={{ padding: 'var(--space-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
            <div>
              <h3 className="text-h3" style={{ margin: 0 }}>Participation par Filière / Classe (D3)</h3>
              <p className="text-caption" style={{ color: 'var(--ink-muted)' }}>
                Taux de mobilisation des départements
              </p>
            </div>
            <span className="msr msr-20" style={{ color: 'var(--success)' }} aria-hidden="true">
              bar_chart
            </span>
          </div>

          <ClassParticipationChart data={classeStats} />
        </Carte>
      </div>
    </div>
  );
}
